// server/lib/twenty-schema.cjs
// Schema management service for Twenty CRM custom objects

const { TwentyClient } = require('./twenty-client.cjs');

/**
 * Create ServiceJob custom object in Twenty CRM
 * Maps to platform's Lead/Appointment domain
 * @param {TwentyClient} twentyClient - Authenticated Twenty client instance
 * @returns {Promise<object>} Created object data with id, name, label
 */
async function createServiceJobObject(twentyClient) {
  // Create the custom object
  const objectResult = await twentyClient.createObject(
    'ServiceJob',
    'Property service job from platform'
  );

  const objectId = objectResult.id;

  // Add status field (SELECT type)
  await twentyClient.createField(objectId, 'status', 'SELECT', {
    options: [
      { value: 'NEW', label: 'New', color: 'gray' },
      { value: 'CONTACTED', label: 'Contacted', color: 'blue' },
      { value: 'BOOKED', label: 'Booked', color: 'green' },
      { value: 'ARCHIVED', label: 'Archived', color: 'gray' }
    ]
  });

  // Add service type field (SELECT type)
  await twentyClient.createField(objectId, 'serviceType', 'SELECT', {
    options: [
      { value: 'PRESSURE_WASHING', label: 'Pressure Washing' },
      { value: 'GARDEN_MAINTENANCE', label: 'Garden Maintenance' },
      { value: 'LAWN_MOWING', label: 'Lawn Mowing' },
      { value: 'POOL_MAINTENANCE', label: 'Pool Maintenance' },
      { value: 'RUBBISH_REMOVAL', label: 'Rubbish Removal & Declutter' },
      { value: 'RE_GROUTING', label: 'Re-grouting' }
    ]
  });

  // Add address field (TEXT type)
  await twentyClient.createField(objectId, 'address', 'TEXT');

  // Add original lead ID reference (TEXT type)
  await twentyClient.createField(objectId, 'originalLeadId', 'TEXT');

  // Add notes field (TEXT type)
  await twentyClient.createField(objectId, 'notes', 'TEXT');

  return objectResult;
}

/**
 * Create HipagesLead custom object in Twenty CRM
 * Extends ServiceJob with hipages-specific fields
 * @param {TwentyClient} twentyClient - Authenticated Twenty client instance
 * @returns {Promise<object>} Created object data with id, name, label
 */
async function createHipagesLeadObject(twentyClient) {
  // Create the custom object
  const objectResult = await twentyClient.createObject(
    'HipagesLead',
    'Lead scraped from hipages.com.au'
  );

  const objectId = objectResult.id;

  // Add source URL field (TEXT type)
  await twentyClient.createField(objectId, 'sourceUrl', 'TEXT');

  // Add posted date field (DATE type)
  await twentyClient.createField(objectId, 'postedDate', 'DATE');

  // Add scraped at timestamp (DATE time = true)
  await twentyClient.createField(objectId, 'scrapedAt', 'DATE');

  // Add hipages status field (SELECT type)
  await twentyClient.createField(objectId, 'hipagesStatus', 'SELECT', {
    options: [
      { value: 'AVAILABLE', label: 'Available', color: 'green' },
      { value: 'FIRST_TO_ACCEPT', label: 'First to Accept', color: 'yellow' },
      { value: 'WAITLIST', label: 'Waitlist', color: 'orange' },
      { value: 'ACCEPTED', label: 'Accepted', color: 'blue' },
      { value: 'EXPIRED', label: 'Expired', color: 'gray' }
    ]
  });

  // Add credits field (NUMBER type)
  await twentyClient.createField(objectId, 'credits', 'NUMBER');

  return objectResult;
}

/**
 * Create Quote custom object in Twenty CRM
 * Maps to platform's Quote domain
 * @param {TwentyClient} twentyClient - Authenticated Twenty client instance
 * @returns {Promise<object>} Created object data with id, name, label
 */
async function createQuoteObject(twentyClient) {
  // Create the custom object
  const objectResult = await twentyClient.createObject(
    'Quote',
    'Service quote for customer'
  );

  const objectId = objectResult.id;

  // Add status field (SELECT type)
  await twentyClient.createField(objectId, 'status', 'SELECT', {
    options: [
      { value: 'DRAFT', label: 'Draft', color: 'gray' },
      { value: 'SENT', label: 'Sent', color: 'blue' },
      { value: 'ACCEPTED', label: 'Accepted', color: 'green' },
      { value: 'REJECTED', label: 'Rejected', color: 'red' },
      { value: 'EXPIRED', label: 'Expired', color: 'gray' }
    ]
  });

  // Add total amount field (CURRENCY type)
  await twentyClient.createField(objectId, 'totalAmount', 'CURRENCY');

  // Add expiry date field (DATE type)
  await twentyClient.createField(objectId, 'expiryDate', 'DATE');

  // Add approved at timestamp (DATE type)
  await twentyClient.createField(objectId, 'approvedAt', 'DATE');

  // Add rejected at timestamp (DATE type)
  await twentyClient.createField(objectId, 'rejectedAt', 'DATE');

  // Add line items field (JSON type for array of line items)
  await twentyClient.createField(objectId, 'lineItems', 'JSON');

  return objectResult;
}

/**
 * Setup all custom objects for a tenant workspace
 * Call this when provisioning a new tenant workspace
 * @param {TwentyClient} twentyClient - Authenticated Twenty client instance
 * @returns {Promise<object>} Results with success flag and object data
 */
async function setupWorkspaceSchema(twentyClient) {
  const results = {
    serviceJob: null,
    hipagesLead: null,
    quote: null
  };

  try {
    results.serviceJob = await createServiceJobObject(twentyClient);
    results.hipagesLead = await createHipagesLeadObject(twentyClient);
    results.quote = await createQuoteObject(twentyClient);

    return { success: true, objects: results };
  } catch (error) {
    console.error('[schema] Error setting up workspace schema:', error);
    return { success: false, error: error.message, partial: results };
  }
}

module.exports = {
  createServiceJobObject,
  createHipagesLeadObject,
  createQuoteObject,
  setupWorkspaceSchema
};
