'use strict';
// Twenty CRM suite: API connectivity, person creation, opportunity creation with amount.
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { ok, equal, gt, suite } = require('./lib/assert.js');

const TWENTY_SERVER_URL = (process.env.TWENTY_SERVER_URL || '').replace(/\/$/, '');
const TWENTY_API_TOKEN  = process.env.TWENTY_API_TOKEN;

async function graphql(query, variables = {}) {
  const res = await fetch(`${TWENTY_SERVER_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TWENTY_API_TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function run() {
  await suite('Twenty CRM: config', async () => {
    ok(!!TWENTY_SERVER_URL, `TWENTY_SERVER_URL set (${TWENTY_SERVER_URL})`);
    ok(!!TWENTY_API_TOKEN && TWENTY_API_TOKEN !== 'generate-after-twenty-setup',
       'TWENTY_API_TOKEN is a real token');
    gt(TWENTY_API_TOKEN?.length || 0, 50, 'Token length looks like a JWT');
  });

  if (!TWENTY_API_TOKEN || TWENTY_API_TOKEN === 'generate-after-twenty-setup') {
    console.log('  ⚠ Skipping live API tests — no token');
    return;
  }

  let personId, opportunityId;

  await suite('Twenty CRM: Person creation', async () => {
    const data = await graphql(`
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) { id }
      }`, {
      data: { name: { firstName: 'ReviveTest', lastName: 'Suite' } }
    });
    personId = data.createPerson?.id;
    ok(personId, `Person created → ${personId}`);
  });

  await suite('Twenty CRM: Opportunity with amount', async () => {
    if (!personId) { console.log('  ⚠ Skipped (no personId)'); return; }

    const data = await graphql(`
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) { id name stage amount { amountMicros currencyCode } }
      }`, {
      data: {
        name:  'ReviveTest Suite - Pressure Washing',
        stage: 'NEW',
        amount: { amountMicros: 350_000_000, currencyCode: 'AUD' },
        pointOfContactId: personId,
      }
    });
    opportunityId = data.createOpportunity?.id;
    ok(opportunityId, `Opportunity created → ${opportunityId}`);
    equal(data.createOpportunity?.amount?.currencyCode, 'AUD', 'Currency is AUD');
    equal(data.createOpportunity?.amount?.amountMicros, 350_000_000, 'Amount = 350 AUD in micros');
    equal(data.createOpportunity?.stage, 'NEW', 'Stage = NEW');
  });

  await suite('Twenty CRM: Note attached to Opportunity', async () => {
    if (!opportunityId) { console.log('  ⚠ Skipped (no opportunityId)'); return; }

    const noteData = await graphql(`
      mutation CreateNote($data: NoteCreateInput!) {
        createNote(data: $data) { id }
      }`, {
      data: { title: 'ReviveTest Suite Note', bodyV2: { markdown: '### Test\n- automated test note' } }
    });
    const noteId = noteData.createNote?.id;
    ok(noteId, `Note created → ${noteId}`);

    const targetData = await graphql(`
      mutation CreateNoteTarget($data: NoteTargetCreateInput!) {
        createNoteTarget(data: $data) { id }
      }`, {
      data: { noteId, targetOpportunityId: opportunityId }
    });
    ok(targetData.createNoteTarget?.id, 'NoteTarget linked to Opportunity');
  });

  await suite('Twenty CRM: HiPages sync backlog', async () => {
    // Read from DB via scraper pool
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const { rows: [s] } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE synced_to_crm = false) as unsynced FROM hipages_leads`
    );
    await pool.end();
    const unsynced = parseInt(s.unsynced);
    console.log(`  ℹ HiPages unsynced backlog: ${unsynced}`);
    ok(unsynced < 200, `Backlog healthy (< 200 unsynced, currently ${unsynced})`);
  });
}

module.exports = { run };
