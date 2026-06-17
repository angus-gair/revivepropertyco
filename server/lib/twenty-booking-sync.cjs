// Pushes a website booking form lead to Twenty CRM as an Opportunity.
// Fire-and-forget — caller should not await or block on this.
'use strict';

const TWENTY_SERVER_URL = (process.env.TWENTY_SERVER_URL || '').replace(/\/$/, '');
const TWENTY_API_TOKEN = process.env.TWENTY_API_TOKEN;

async function graphql(query, variables = {}) {
  const response = await fetch(`${TWENTY_SERVER_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twenty API HTTP ${response.status}: ${text}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`Twenty GraphQL: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

async function findOrCreatePerson(firstName, lastName, email, phone) {
  // Search by email first — more reliable than name for website leads
  if (email) {
    try {
      const result = await graphql(
        `query FindByEmail($email: StringFilter) {
          people(filter: { emails: { primaryEmail: $email } }, first: 1) {
            edges { node { id } }
          }
        }`,
        { email: { eq: email } }
      );
      const existing = result.people?.edges?.[0]?.node;
      if (existing) return existing.id;
    } catch (e) {
      console.warn('[twenty-booking-sync] Email search failed, will create new person:', e.message);
    }
  }

  const personData = { name: { firstName, lastName } };
  if (email) personData.emails = { primaryEmail: email };
  if (phone) personData.phones = { primaryPhoneNumber: phone, primaryPhoneCountryCode: 'AU' };

  const result = await graphql(
    `mutation CreatePerson($data: PersonCreateInput!) {
      createPerson(data: $data) { id }
    }`,
    { data: personData }
  );
  return result.createPerson.id;
}

// Mid-range estimated deal value per service (AUD), derived from operational pricing guide.
// Used as the opportunity amount before an actual quote is issued.
const SERVICE_ESTIMATES = {
  'Pressure Washing':          350,  // mid Overhaul tier ($350–$550)
  'Garden Maintenance':        250,  // mid Tidy Up→Overhaul range
  'Lawn Mowing':                75,  // mid Just The Mow ($60–$90)
  'Pool Maintenance':          200,  // between Standard Clean and Green Pool Recovery
  'Rubbish Removal & Declutter': 300,
  'Re-grouting':               900,  // mid Full Shower epoxy ($900–$1,400)
};

async function createOpportunity(booking, personId) {
  const estimatedAud = SERVICE_ESTIMATES[booking.serviceType] || 250;

  const result = await graphql(
    `mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) { id name stage }
    }`,
    {
      data: {
        name: `${booking.serviceType} - ${booking.firstName} ${booking.lastName}`,
        stage: 'NEW',
        amount: { amountMicros: estimatedAud * 1_000_000, currencyCode: 'AUD' },
        pointOfContactId: personId,
      },
    }
  );
  return result.createOpportunity;
}

async function createNoteWithTarget(booking, opportunityId) {
  const markdown = `### Website Booking Lead
- **Type:** ${booking.type === 'QUOTE' ? 'Quote Request' : 'Job Booking'}
- **Service:** ${booking.serviceType}
- **Name:** ${booking.firstName} ${booking.lastName}
- **Email:** ${booking.email}
- **Phone:** ${booking.phone}
- **Address:** ${booking.address}
- **Requested:** ${booking.date} at ${booking.timeSlot}
- **Notes:** ${booking.notes || 'None'}
- **Source:** Website booking form (revivepropertyco.au/book)
- **Reference:** ${booking.bookingReference}`;

  const noteResult = await graphql(
    `mutation CreateNote($data: NoteCreateInput!) {
      createNote(data: $data) { id }
    }`,
    {
      data: {
        title: `Website Lead: ${booking.serviceType} – ${booking.firstName} ${booking.lastName}`,
        bodyV2: { markdown },
      },
    }
  );

  await graphql(
    `mutation CreateNoteTarget($data: NoteTargetCreateInput!) {
      createNoteTarget(data: $data) { id }
    }`,
    { data: { noteId: noteResult.createNote.id, targetOpportunityId: opportunityId } }
  );
}

/**
 * Push a website booking to Twenty CRM as an Opportunity.
 * Non-blocking — errors are logged but do not affect the booking response.
 *
 * @param {object} booking - { firstName, lastName, email, phone, address,
 *                             serviceType, type, date, timeSlot, notes, bookingReference }
 */
async function pushBookingToTwenty(booking) {
  if (!TWENTY_API_TOKEN || TWENTY_API_TOKEN === 'generate-after-twenty-setup') {
    console.log('[twenty-booking-sync] Skipping: TWENTY_API_TOKEN not configured');
    return { success: false, skipped: true };
  }
  if (!TWENTY_SERVER_URL) {
    console.log('[twenty-booking-sync] Skipping: TWENTY_SERVER_URL not configured');
    return { success: false, skipped: true };
  }

  try {
    const personId = await findOrCreatePerson(
      (booking.firstName || '').trim(),
      (booking.lastName || '').trim(),
      booking.email,
      booking.phone
    );

    const opportunity = await createOpportunity(booking, personId);

    try {
      await createNoteWithTarget(booking, opportunity.id);
    } catch (noteErr) {
      console.warn('[twenty-booking-sync] Note creation failed (non-fatal):', noteErr.message);
    }

    console.log(
      `[twenty-booking-sync] Pushed: ${booking.firstName} ${booking.lastName} - ${booking.serviceType} -> ${opportunity.id}`
    );
    return { success: true, opportunityId: opportunity.id };

  } catch (err) {
    console.error('[twenty-booking-sync] Failed to push booking to CRM:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { pushBookingToTwenty };
