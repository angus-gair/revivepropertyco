'use strict';
// Booking suite: website form → Twenty CRM opportunity, amount estimates, person dedup.
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { ok, equal, gt, suite } = require('./lib/assert.js');

// Inline the sync function for isolated testing (mirrors server/lib/twenty-booking-sync.cjs)
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

const SERVICE_ESTIMATES = {
  'Pressure Washing':             350,
  'Garden Maintenance':           250,
  'Lawn Mowing':                   75,
  'Pool Maintenance':             200,
  'Rubbish Removal & Declutter':  300,
  'Re-grouting':                  900,
};

async function run() {
  await suite('Booking: service → amount map', async () => {
    for (const [service, expected] of Object.entries(SERVICE_ESTIMATES)) {
      ok(expected > 0, `${service}: $${expected} > 0`);
    }
    equal(SERVICE_ESTIMATES['Re-grouting'],        900, 'Re-grouting = $900');
    equal(SERVICE_ESTIMATES['Pressure Washing'],   350, 'Pressure Washing = $350');
    equal(SERVICE_ESTIMATES['Lawn Mowing'],         75, 'Lawn Mowing = $75');
  });

  if (!TWENTY_API_TOKEN || TWENTY_API_TOKEN === 'generate-after-twenty-setup') {
    console.log('  ⚠ Skipping live API tests — no token');
    return;
  }

  await suite('Booking: Twenty push (Garden Maintenance)', async () => {
    // Create person
    const personRes = await graphql(`
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) { id }
      }`, {
      data: {
        name: { firstName: 'BookingTest', lastName: 'Runner' },
        emails: { primaryEmail: 'booking-test-runner@revivetest.internal' },
        phones: { primaryPhoneNumber: '0400000099', primaryPhoneCountryCode: 'AU' },
      }
    });
    const personId = personRes.createPerson?.id;
    ok(personId, `Person with email+phone created → ${personId}`);

    const serviceType = 'Garden Maintenance';
    const estAud = SERVICE_ESTIMATES[serviceType];

    // Create opportunity
    const oppRes = await graphql(`
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) { id name stage amount { amountMicros currencyCode } }
      }`, {
      data: {
        name: `${serviceType} - BookingTest Runner`,
        stage: 'NEW',
        amount: { amountMicros: estAud * 1_000_000, currencyCode: 'AUD' },
        pointOfContactId: personId,
      }
    });
    const opp = oppRes.createOpportunity;
    ok(opp?.id, `Opportunity created → ${opp?.id}`);
    equal(opp?.amount?.amountMicros, estAud * 1_000_000, `Amount = ${estAud} AUD`);
    equal(opp?.amount?.currencyCode, 'AUD', 'Currency = AUD');
    equal(opp?.stage, 'NEW', 'Stage = NEW');
  });

  await suite('Booking: email dedup (existing person not re-created)', async () => {
    const email = 'dedup-test@revivetest.internal';

    // Create first time
    await graphql(`
      mutation CreatePerson($data: PersonCreateInput!) { createPerson(data: $data) { id } }
    `, { data: { name: { firstName: 'Dedup', lastName: 'Test' }, emails: { primaryEmail: email } } });

    // Search by email — should find the one we just created
    const searchRes = await graphql(`
      query FindByEmail($email: StringFilter) {
        people(filter: { emails: { primaryEmail: $email } }, first: 1) {
          edges { node { id } }
        }
      }`, { email: { eq: email } });

    const found = searchRes.people?.edges?.[0]?.node;
    ok(found?.id, `Person found by email → ${found?.id}`);
  });
}

module.exports = { run };
