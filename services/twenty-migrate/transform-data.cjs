// services/twenty-migrate/transform-data.cjs
// Transform platform data to Twenty CRM format

/**
 * Map platform lead status to Twenty status
 */
function mapLeadStatus(status) {
  const statusMap = {
    'NEW': 'NEW',
    'CONTACTED': 'CONTACTED',
    'BOOKED': 'BOOKED',
    'ARCHIVED': 'ARCHIVED'
  };
  return statusMap[status] || 'NEW';
}

/**
 * Map platform service type to Twenty service type
 */
function mapServiceType(serviceType) {
  const typeMap = {
    'Pressure Washing': 'PRESSURE_WASHING',
    'Garden Maintenance': 'GARDEN_MAINTENANCE',
    'Lawn Mowing': 'LAWN_MOWING',
    'Pool Maintenance': 'POOL_MAINTENANCE',
    'Rubbish Removal & Declutter': 'RUBBISH_REMOVAL',
    'Re-grouting': 'RE_GROUTING'
  };
  return typeMap[serviceType] || serviceType?.toUpperCase().replace(/ /g, '_') || null;
}

/**
 * Map platform quote status to Twenty quote status
 */
function mapQuoteStatus(status) {
  const statusMap = {
    'DRAFT': 'DRAFT',
    'SENT': 'SENT',
    'ACCEPTED': 'ACCEPTED',
    'REJECTED': 'REJECTED',
    'EXPIRED': 'EXPIRED'
  };
  return statusMap[status] || 'DRAFT';
}

/**
 * Map hipages lead status to Twenty hipages status
 */
function mapHipagesStatus(status) {
  const statusMap = {
    'AVAILABLE': 'AVAILABLE',
    'FIRST_TO_ACCEPT': 'FIRST_TO_ACCEPT',
    'WAITLIST': 'WAITLIST',
    'ACCEPTED': 'ACCEPTED',
    'EXPIRED': 'EXPIRED'
  };
  return statusMap[status] || 'AVAILABLE';
}

/**
 * Transform platform lead to Twenty Person + ServiceJob
 */
function transformLeadToServiceJob(lead) {
  return {
    person: {
      firstName: lead.first_name || '',
      lastName: lead.last_name || '',
      email: lead.email || null,
      phone: lead.phone || null
    },
    serviceJob: {
      name: `${lead.service_interest || 'Service'} - ${lead.first_name} ${lead.last_name}`,
      description: lead.notes || '',
      status: mapLeadStatus(lead.status),
      serviceType: mapServiceType(lead.service_interest),
      address: lead.address || null,
      originalLeadId: lead.id,
      createdAt: new Date(lead.created_at).toISOString()
    }
  };
}

/**
 * Transform platform appointment to Twenty ServiceJob
 */
function transformAppointment(appointment) {
  return {
    serviceJob: {
      name: `${appointment.service_type || 'Service'} - ${appointment.type}`,
      description: appointment.notes || '',
      status: 'BOOKED',
      serviceType: mapServiceType(appointment.service_type),
      appointmentDate: appointment.date,
      appointmentTimeSlot: appointment.time_slot,
      appointmentType: appointment.type,
      appointmentStatus: appointment.status,
      originalAppointmentId: appointment.id,
      originalLeadId: appointment.lead_id
    }
  };
}

/**
 * Transform platform task to Twenty format (as note on related record)
 */
function transformTask(task) {
  return {
    taskNote: {
      title: task.title,
      description: task.description || '',
      completed: task.completed,
      dueDate: task.due_date ? new Date(task.due_date).toISOString() : null,
      originalTaskId: task.id,
      originalLeadId: task.lead_id
    }
  };
}

/**
 * Transform platform quote to Twenty Quote
 */
function transformQuote(quote) {
  return {
    quote: {
      name: `Quote - ${quote.valid_until ? 'Valid until ' + quote.valid_until : 'Draft'}`,
      status: mapQuoteStatus(quote.status),
      totalAmount: parseFloat(quote.amount) || 0,
      expiryDate: quote.valid_until ? new Date(quote.valid_until).toISOString() : null,
      notes: quote.notes || '',
      originalQuoteId: quote.id,
      originalLeadId: quote.lead_id,
      createdAt: quote.created_at ? new Date(quote.created_at).toISOString() : null
    }
  };
}

/**
 * Transform hipages lead to Twenty HipagesLead
 */
function transformHipagesLead(hipagesLead) {
  // Parse customer name (format: "FirstName LastName" or just a name)
  const nameParts = (hipagesLead.customer_name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    person: {
      firstName: firstName,
      lastName: lastName || 'Customer',
      email: null,
      phone: null
    },
    hipagesLead: {
      name: `${hipagesLead.job_type} - ${hipagesLead.suburb || 'Unknown'}`,
      description: hipagesLead.description || '',
      status: 'NEW',
      serviceType: mapServiceType(hipagesLead.job_type),
      sourceUrl: `https://www.hipages.com.au/jobs/${hipagesLead.hipages_id}`,
      postedDate: hipagesLead.posted_date ? new Date(hipagesLead.posted_date).toISOString() : null,
      scrapedAt: hipagesLead.scraped_at ? new Date(hipagesLead.scraped_at).toISOString() : null,
      hipagesStatus: mapHipagesStatus(hipagesLead.status),
      credits: hipagesLead.credits || 0,
      suburb: hipagesLead.suburb,
      postcode: hipagesLead.postcode,
      jobSubtype: hipagesLead.job_subtype,
      originalHipagesLeadId: hipagesLead.lead_id
    }
  };
}

/**
 * Transform all exported data
 */
function transformAllData(exportedData) {
  const transformed = {
    people: [],
    serviceJobs: [],
    hipagesLeads: [],
    quotes: [],
    tasks: []
  };

  // Track person deduplication by email
  const peopleByEmail = new Map();

  // Transform leads
  for (const lead of exportedData.leads) {
    const { person, serviceJob } = transformLeadToServiceJob(lead);

    // Deduplicate people by email
    const personKey = person.email || person.phone || `lead-${lead.id}`;
    if (!peopleByEmail.has(personKey)) {
      peopleByEmail.set(personKey, { ...person, _sourceLeadId: lead.id });
      transformed.people.push(person);
    }

    transformed.serviceJobs.push({
      ...serviceJob,
      _personKey: personKey,
      _sourceType: 'lead'
    });
  }

  // Transform hipages leads
  for (const hipagesLead of exportedData.hipagesLeads) {
    const { person, hipagesLead: hl } = transformHipagesLead(hipagesLead);

    const personKey = `hipages-${hipagesLead.lead_id}`;
    if (!peopleByEmail.has(personKey)) {
      peopleByEmail.set(personKey, { ...person, _sourceHipagesLeadId: hipagesLead.lead_id });
      transformed.people.push(person);
    }

    transformed.hipagesLeads.push({
      ...hl,
      _personKey: personKey,
      _sourceType: 'hipages'
    });
  }

  // Transform appointments
  for (const appointment of exportedData.appointments) {
    const { serviceJob } = transformAppointment(appointment);
    transformed.serviceJobs.push({
      ...serviceJob,
      _sourceType: 'appointment'
    });
  }

  // Transform tasks (will be added as notes)
  for (const task of exportedData.tasks) {
    const { taskNote } = transformTask(task);
    transformed.tasks.push(taskNote);
  }

  // Transform quotes
  for (const quote of exportedData.quotes) {
    const { quote: q } = transformQuote(quote);
    transformed.quotes.push({
      ...q,
      _sourceType: 'quote'
    });
  }

  return {
    ...transformed,
    transformedAt: new Date().toISOString(),
    counts: {
      people: transformed.people.length,
      serviceJobs: transformed.serviceJobs.length,
      hipagesLeads: transformed.hipagesLeads.length,
      quotes: transformed.quotes.length,
      tasks: transformed.tasks.length
    }
  };
}

module.exports = {
  mapLeadStatus,
  mapServiceType,
  mapQuoteStatus,
  mapHipagesStatus,
  transformLeadToServiceJob,
  transformAppointment,
  transformTask,
  transformQuote,
  transformHipagesLead,
  transformAllData
};
