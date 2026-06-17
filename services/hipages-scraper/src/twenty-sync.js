require('dotenv').config();
const pool = require('./lib/db.js');

const TWENTY_SERVER_URL = (process.env.TWENTY_SERVER_URL || '').replace(/\/$/, '');
const TWENTY_API_TOKEN = process.env.TWENTY_API_TOKEN;

async function graphql(query, variables = {}) {
  const response = await fetch(`${TWENTY_SERVER_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TWENTY_API_TOKEN}`
    },
    body: JSON.stringify({ query, variables })
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

async function findOrCreatePerson(firstName, lastName) {
  try {
    const findQuery = `
      query FindPerson($firstName: StringFilter, $lastName: StringFilter) {
        people(filter: { name: { firstName: $firstName, lastName: $lastName } }, first: 1) {
          edges { node { id } }
        }
      }
    `;
    const result = await graphql(findQuery, {
      firstName: { eq: firstName },
      lastName: { eq: lastName }
    });
    const existing = result.people?.edges?.[0]?.node;
    if (existing) return existing.id;
  } catch (e) {
    console.warn('[twenty-sync] Person search failed, will create new:', e.message);
  }

  const createMutation = `
    mutation CreatePerson($data: PersonCreateInput!) {
      createPerson(data: $data) {
        id
      }
    }
  `;
  const result = await graphql(createMutation, {
    data: { name: { firstName, lastName } }
  });
  return result.createPerson.id;
}

async function createOpportunity(lead, personId) {
  const name = `${lead.job_type} - ${lead.customer_name} - ${lead.suburb}`;
  const credits = parseInt(lead.credits) || 0;

  const mutation = `
    mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) {
        id
        name
        stage
      }
    }
  `;

  const result = await graphql(mutation, {
    data: {
      name,
      amount: { amountMicros: credits * 20 * 1000000, currencyCode: 'AUD' },
      stage: 'NEW',
      pointOfContactId: personId
    }
  });

  return result.createOpportunity;
}

async function createImageAttachments(images, opportunityId) {
  const mutation = `
    mutation CreateAttachment($data: AttachmentCreateInput!) {
      createAttachment(data: $data) { id }
    }
  `;
  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const filename = url.split('/').pop() + '.jpg';
    await graphql(mutation, {
      data: {
        name: filename,
        fullPath: url,
        fileCategory: 'IMAGE',
        targetOpportunityId: opportunityId
      }
    });
  }
}

async function createNoteWithTarget(lead, opportunityId) {
  const postedStr = lead.posted_date ? new Date(lead.posted_date).toISOString() : 'Unknown';
  const images = lead.raw_data?.images || [];
  const imageSection = images.length > 0
    ? '\n\n### Photos\n' + images.map((url, i) => `![Photo ${i + 1}](${url})`).join('\n')
    : '';
  const markdown = `### Hipages Lead Details
- **Job Type:** ${lead.job_type}${lead.job_subtype ? ` (${lead.job_subtype})` : ''}
- **Description:** ${lead.description || 'No description'}
- **Location:** ${lead.suburb}${lead.postcode ? ` ${lead.postcode}` : ''}
- **Credits:** ${lead.credits}
- **Status:** ${lead.status}
- **Contact Status:** ${lead.contact_status || 'Unknown'}
- **Posted Date:** ${postedStr}
- **Lead ID:** ${lead.lead_id}${imageSection}`;

  const noteMutation = `
    mutation CreateNote($data: NoteCreateInput!) {
      createNote(data: $data) {
        id
      }
    }
  `;

  const noteResult = await graphql(noteMutation, {
    data: {
      title: `Hipages: ${lead.job_type} - ${lead.suburb}`,
      bodyV2: { markdown }
    }
  });

  const noteId = noteResult.createNote.id;

  const targetMutation = `
    mutation CreateNoteTarget($data: NoteTargetCreateInput!) {
      createNoteTarget(data: $data) {
        id
      }
    }
  `;

  await graphql(targetMutation, {
    data: { noteId, targetOpportunityId: opportunityId }
  });
}

const SYNC_BATCH_SIZE = 80;   // max leads per run (~85 tokens/min at 700ms spacing)
const INTER_LEAD_DELAY = 700; // ms between leads

async function withRateLimitRetry(fn, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message && err.message.includes('LIMIT_REACHED') && attempt < 3) {
        console.warn(`[twenty-sync] Rate limit hit on ${label}, waiting 65s (attempt ${attempt}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 65000));
      } else {
        throw err;
      }
    }
  }
}

async function syncNewLeads() {
  if (!TWENTY_API_TOKEN || TWENTY_API_TOKEN === 'generate-after-twenty-setup') {
    console.log('[twenty-sync] Skipping: TWENTY_API_TOKEN not configured');
    return { synced: 0, failed: 0, skipped: true };
  }

  if (!TWENTY_SERVER_URL) {
    console.log('[twenty-sync] Skipping: TWENTY_SERVER_URL not configured');
    return { synced: 0, failed: 0, skipped: true };
  }

  const client = await pool.connect();
  let synced = 0;
  let failed = 0;

  try {
    const { rows: leads } = await client.query(
      `SELECT * FROM hipages_leads
       WHERE synced_to_crm = false
       ORDER BY scraped_at DESC
       LIMIT $1`,
      [SYNC_BATCH_SIZE]
    );

    if (leads.length === 0) {
      console.log('[twenty-sync] No unsynced leads to push');
      return { synced: 0, failed: 0 };
    }

    const { rows: [{ count: remaining }] } = await client.query(
      'SELECT COUNT(*) FROM hipages_leads WHERE synced_to_crm = false'
    );
    console.log(`[twenty-sync] Pushing ${leads.length} leads (${remaining} total unsynced)`);

    for (const lead of leads) {
      try {
        const nameParts = (lead.customer_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '';

        const personId = await withRateLimitRetry(
          () => findOrCreatePerson(firstName, lastName),
          'findOrCreatePerson'
        );
        const opportunity = await withRateLimitRetry(
          () => createOpportunity(lead, personId),
          'createOpportunity'
        );

        try {
          await withRateLimitRetry(
            () => createNoteWithTarget(lead, opportunity.id),
            'createNoteWithTarget'
          );
        } catch (noteErr) {
          console.warn(`[twenty-sync] Note creation failed for lead ${lead.lead_id}:`, noteErr.message);
        }

        const images = lead.raw_data?.images || [];
        if (images.length > 0) {
          try {
            await withRateLimitRetry(
              () => createImageAttachments(images, opportunity.id),
              'createImageAttachments'
            );
          } catch (imgErr) {
            console.warn(`[twenty-sync] Image attachments failed for lead ${lead.lead_id}:`, imgErr.message);
          }
        }

        await client.query(
          `UPDATE hipages_leads
           SET synced_to_crm = true, crm_opportunity_id = $1, updated_at = NOW()
           WHERE lead_id = $2`,
          [opportunity.id, lead.lead_id]
        );

        console.log(`[twenty-sync] Synced: ${lead.customer_name} - ${lead.job_type} (${lead.suburb}) -> ${opportunity.id}`);
        synced++;

        await new Promise(resolve => setTimeout(resolve, INTER_LEAD_DELAY));

      } catch (err) {
        console.error(`[twenty-sync] Failed lead ${lead.lead_id} (${lead.customer_name}):`, err.message);
        failed++;
      }
    }

    console.log(`[twenty-sync] Done: ${synced} synced, ${failed} failed`);
    return { synced, failed };

  } finally {
    client.release();
  }
}

module.exports = { syncNewLeads };
