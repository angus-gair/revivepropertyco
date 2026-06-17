// Pushes customer-portal events to Twenty CRM.
//   - pushCustomerToTwenty(customer)        : on portal registration -> ensure a Person exists + log a Note
//   - syncQuoteDecisionToTwenty(decision)   : on quote approve/reject -> move the Opportunity + log a Note
// Fire-and-forget — callers must not await/block on these (errors are swallowed and logged).
// Mirrors the proven pattern in twenty-booking-sync.cjs (kept separate to avoid risk to the booking path).
'use strict';

const TWENTY_SERVER_URL = (process.env.TWENTY_SERVER_URL || '').replace(/\/$/, '');
const TWENTY_API_TOKEN = process.env.TWENTY_API_TOKEN;

// Twenty's default Opportunity stage funnel is NEW > SCREENING > MEETING > PROPOSAL > CUSTOMER.
// There is no closed-lost stage in this workspace, so a rejected quote only gets a Note.
const WON_STAGE = 'CUSTOMER';

function isConfigured() {
  if (!TWENTY_API_TOKEN || TWENTY_API_TOKEN === 'generate-after-twenty-setup') {
    console.log('[twenty-portal-sync] Skipping: TWENTY_API_TOKEN not configured');
    return false;
  }
  if (!TWENTY_SERVER_URL) {
    console.log('[twenty-portal-sync] Skipping: TWENTY_SERVER_URL not configured');
    return false;
  }
  return true;
}

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

async function findPersonByEmail(email) {
  if (!email) return null;
  try {
    const result = await graphql(
      `query FindByEmail($email: StringFilter) {
        people(filter: { emails: { primaryEmail: $email } }, first: 1) {
          edges { node { id } }
        }
      }`,
      { email: { eq: email } }
    );
    return result.people?.edges?.[0]?.node?.id || null;
  } catch (e) {
    console.warn('[twenty-portal-sync] Person email search failed:', e.message);
    return null;
  }
}

async function createPerson({ firstName, lastName, email, phone }) {
  const personData = { name: { firstName: firstName || '', lastName: lastName || '' } };
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

async function findOrCreatePerson(person) {
  const existing = await findPersonByEmail(person.email);
  if (existing) return existing;
  return createPerson(person);
}

// Most-recent Opportunity that this Person is the point of contact for (any stage).
async function findLatestOpportunityForPerson(personId) {
  if (!personId) return null;
  try {
    const result = await graphql(
      `query OppsForPerson($pid: UUIDFilter) {
        opportunities(
          filter: { pointOfContactId: $pid }
          first: 1
          orderBy: { createdAt: DescNullsLast }
        ) {
          edges { node { id name stage } }
        }
      }`,
      { pid: { eq: personId } }
    );
    return result.opportunities?.edges?.[0]?.node || null;
  } catch (e) {
    console.warn('[twenty-portal-sync] Opportunity lookup failed:', e.message);
    return null;
  }
}

async function createOpportunity({ name, stage, amountAud, personId }) {
  const data = { name, stage };
  if (amountAud != null && !Number.isNaN(amountAud)) {
    data.amount = { amountMicros: Math.round(amountAud * 1_000_000), currencyCode: 'AUD' };
  }
  if (personId) data.pointOfContactId = personId;

  const result = await graphql(
    `mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) { id stage }
    }`,
    { data }
  );
  return result.createOpportunity;
}

async function updateOpportunity(id, { stage, amountAud }) {
  const data = {};
  if (stage) data.stage = stage;
  if (amountAud != null && !Number.isNaN(amountAud)) {
    data.amount = { amountMicros: Math.round(amountAud * 1_000_000), currencyCode: 'AUD' };
  }
  if (Object.keys(data).length === 0) return;
  await graphql(
    `mutation UpdateOpportunity($id: UUID!, $data: OpportunityUpdateInput!) {
      updateOpportunity(id: $id, data: $data) { id stage }
    }`,
    { id, data }
  );
}

// Create a Note and attach it to either an Opportunity or a Person.
async function createNote({ title, markdown, opportunityId, personId }) {
  const noteResult = await graphql(
    `mutation CreateNote($data: NoteCreateInput!) {
      createNote(data: $data) { id }
    }`,
    { data: { title, bodyV2: { markdown } } }
  );
  const noteId = noteResult.createNote.id;

  const targetData = { noteId };
  if (opportunityId) targetData.targetOpportunityId = opportunityId;
  else if (personId) targetData.targetPersonId = personId;
  else return;

  await graphql(
    `mutation CreateNoteTarget($data: NoteTargetCreateInput!) {
      createNoteTarget(data: $data) { id }
    }`,
    { data: targetData }
  );
}

/**
 * On portal registration, ensure the customer exists as a Person in Twenty and log the signup.
 * @param {object} c - { firstName, lastName, email, mobile, address, suburb, postcode, state }
 */
async function pushCustomerToTwenty(c) {
  if (!isConfigured()) return { success: false, skipped: true };
  try {
    const personId = await findOrCreatePerson({
      firstName: (c.firstName || '').trim(),
      lastName: (c.lastName || '').trim(),
      email: c.email,
      phone: c.mobile,
    });

    const addr = [c.address, c.suburb, c.postcode, c.state].filter(Boolean).join(', ');
    const markdown = `### Customer Portal Registration
- **Name:** ${c.firstName || ''} ${c.lastName || ''}
- **Email:** ${c.email || 'N/A'}
- **Mobile:** ${c.mobile || 'N/A'}
- **Address:** ${addr || 'N/A'}
- **Source:** Customer portal sign-up (portal.revivepropertyco.au)`;

    try {
      await createNote({
        title: `Portal Sign-up: ${c.firstName || ''} ${c.lastName || ''}`.trim(),
        markdown,
        personId,
      });
    } catch (noteErr) {
      console.warn('[twenty-portal-sync] Registration note failed (non-fatal):', noteErr.message);
    }

    console.log(`[twenty-portal-sync] Registered customer synced -> person ${personId}`);
    return { success: true, personId };
  } catch (err) {
    console.error('[twenty-portal-sync] Failed to sync registration:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * On portal quote approval/rejection, move the matching Opportunity and log the decision.
 * Approve -> stage CUSTOMER (+ amount); Reject -> Note only (no lost stage in this workspace).
 * @param {object} d - { decision:'approve'|'reject', quoteId, amount, reason,
 *                        firstName, lastName, email, serviceType, address }
 */
async function syncQuoteDecisionToTwenty(d) {
  if (!isConfigured()) return { success: false, skipped: true };
  const approved = d.decision === 'approve';
  try {
    const personId = await findOrCreatePerson({
      firstName: (d.firstName || '').trim(),
      lastName: (d.lastName || '').trim(),
      email: d.email,
    });

    let opp = await findLatestOpportunityForPerson(personId);

    if (approved) {
      if (opp) {
        await updateOpportunity(opp.id, { stage: WON_STAGE, amountAud: d.amount });
      } else {
        // No existing opportunity (e.g. portal-only customer) — create one so the win is captured.
        opp = await createOpportunity({
          name: `${d.serviceType || 'Service'} - ${d.firstName || ''} ${d.lastName || ''}`.trim(),
          stage: WON_STAGE,
          amountAud: d.amount,
          personId,
        });
      }
    }

    const markdown = `### Quote ${approved ? 'Approved' : 'Rejected'} (Customer Portal)
- **Customer:** ${d.firstName || ''} ${d.lastName || ''}
- **Email:** ${d.email || 'N/A'}
- **Quote amount:** ${d.amount != null ? `$${d.amount} AUD` : 'N/A'}
- **Service:** ${d.serviceType || 'N/A'}
- **Quote reference:** ${d.quoteId}
- **Decision:** ${approved ? 'APPROVED — moved to CUSTOMER (won)' : 'REJECTED'}
- **Reason:** ${d.reason || 'None given'}
- **Source:** Customer portal (portal.revivepropertyco.au)`;

    try {
      await createNote({
        title: `Quote ${approved ? 'Approved' : 'Rejected'}: ${d.firstName || ''} ${d.lastName || ''}`.trim(),
        markdown,
        opportunityId: opp ? opp.id : undefined,
        personId,
      });
    } catch (noteErr) {
      console.warn('[twenty-portal-sync] Decision note failed (non-fatal):', noteErr.message);
    }

    console.log(
      `[twenty-portal-sync] Quote ${d.decision} synced -> person ${personId}${opp ? `, opp ${opp.id}` : ''}`
    );
    return { success: true, personId, opportunityId: opp ? opp.id : null };
  } catch (err) {
    console.error('[twenty-portal-sync] Failed to sync quote decision:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { pushCustomerToTwenty, syncQuoteDecisionToTwenty };
