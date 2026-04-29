// services/twenty-migrate/import-to-twenty.cjs
// Import transformed data to Twenty CRM via GraphQL API

const { TwentyClient } = require('../../server/lib/twenty-client.cjs');

// Default batch size and delay for API rate limiting
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_BATCH_DELAY = 500; // ms between batches

/**
 * Create Person record in Twenty
 */
async function createPerson(twentyClient, personData) {
  const mutation = `
    mutation createOnePerson($data: PersonCreateInput!) {
      createOnePerson(data: $data) {
        id
        firstName
        lastName
        email
        phone
      }
    }
  `;

  const result = await twentyClient.graphql(mutation, {
    data: {
      firstName: personData.firstName,
      lastName: personData.lastName,
      email: personData.email || undefined,
      phone: personData.phone || undefined
    }
  });

  return result.createOnePerson;
}

/**
 * Create people in batches
 */
async function createPeople(twentyClient, people, options = {}) {
  const { batchSize = DEFAULT_BATCH_SIZE, delay = DEFAULT_BATCH_DELAY, onProgress } = options;
  const created = [];
  const failed = [];

  for (let i = 0; i < people.length; i += batchSize) {
    const batch = people.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.allSettled(
        batch.map(person => createPerson(twentyClient, person))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          created.push(result.value);
        } else {
          failed.push({ person: batch[j], error: result.reason.message });
        }
      }

      if (onProgress) {
        onProgress({
          processed: Math.min(i + batchSize, people.length),
          total: people.length,
          created: created.length,
          failed: failed.length
        });
      }

      // Delay between batches
      if (i + batchSize < people.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error(`[import] Batch ${i / batchSize} failed:`, error.message);
      failed.push(...batch.map(p => ({ person: p, error: error.message })));
    }
  }

  return { created, failed, peopleMap: new Map(created.map((p, i) => [people[i], p])) };
}

/**
 * Create ServiceJob in Twenty
 */
async function createServiceJob(twentyClient, serviceJobData, personId) {
  const mutation = `
    mutation createOneServiceJob($data: ServiceJobCreateInput!) {
      createOneServiceJob(data: $data) {
        id
        name
        status
      }
    }
  `;

  const variables = {
    data: {
      name: serviceJobData.name,
      description: serviceJobData.description || '',
      person: { connect: { id: personId } }
    }
  };

  const result = await twentyClient.graphql(mutation, variables);

  return result.createOneServiceJob;
}

/**
 * Import transformed data to Twenty
 */
async function importToTwenty(transformedData, apiToken, serverUrl, options = {}) {
  const { batchSize = DEFAULT_BATCH_SIZE, delay = DEFAULT_BATCH_DELAY, onProgress } = options;

  const twentyClient = new TwentyClient(apiToken, serverUrl);

  const results = {
    people: { created: [], failed: [], map: new Map() },
    serviceJobs: { created: [], failed: [] },
    hipagesLeads: { created: [], failed: [] },
    quotes: { created: [], failed: [] },
    tasks: { notes: [] }
  };

  // Step 1: Create all people
  console.log(`[import] Creating ${transformedData.people.length} people...`);
  const peopleResult = await createPeople(twentyClient, transformedData.people, {
    batchSize,
    delay,
    onProgress: (progress) => {
      console.log(`[import] People: ${progress.processed}/${progress.total} (${progress.created} created, ${progress.failed} failed)`);
      if (onProgress) onProgress({ phase: 'people', ...progress });
    }
  });

  results.people = peopleResult;

  // Create person lookup map
  const personMap = new Map();
  transformedData.people.forEach((p, i) => {
    if (peopleResult.created[i]) {
      personMap.set(p._sourceLeadId || p._sourceHipagesLeadId, peopleResult.created[i].id);
    }
  });

  // Step 2: Create ServiceJobs (from leads and appointments)
  const serviceJobsToCreate = transformedData.serviceJobs.filter(sj =>
    !transformedData.hipagesLeads.find(hl => hl._personKey === sj._personKey)
  );

  console.log(`[import] Creating ${serviceJobsToCreate.length} service jobs...`);
  for (let i = 0; i < serviceJobsToCreate.length; i += batchSize) {
    const batch = serviceJobsToCreate.slice(i, i + batchSize);

    for (const sj of batch) {
      try {
        const personId = personMap.get(sj.originalLeadId);
        if (!personId) {
          results.serviceJobs.failed.push({ serviceJob: sj, error: 'Person not found' });
          continue;
        }

        const created = await createServiceJob(twentyClient, sj, personId);
        results.serviceJobs.created.push(created);

        if ((i + 1) % 10 === 0 && onProgress) {
          onProgress({ phase: 'serviceJobs', processed: i + 1, total: serviceJobsToCreate.length });
        }
      } catch (error) {
        results.serviceJobs.failed.push({ serviceJob: sj, error: error.message });
      }
    }

    if (i + batchSize < serviceJobsToCreate.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Step 3: Create HipagesLeads (similar to ServiceJobs but for hipages)
  console.log(`[import] Creating ${transformedData.hipagesLeads.length} hipages leads...`);
  for (let i = 0; i < transformedData.hipagesLeads.length; i += batchSize) {
    const batch = transformedData.hipagesLeads.slice(i, i + batchSize);

    for (const hl of batch) {
      try {
        const personId = personMap.get(hl.originalHipagesLeadId);
        if (!personId) {
          results.hipagesLeads.failed.push({ hipagesLead: hl, error: 'Person not found' });
          continue;
        }

        const created = await createServiceJob(twentyClient, {
          name: hl.name,
          description: hl.description || ''
        }, personId);
        results.hipagesLeads.created.push(created);

      } catch (error) {
        results.hipagesLeads.failed.push({ hipagesLead: hl, error: error.message });
      }
    }

    if (i + batchSize < transformedData.hipagesLeads.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Step 4: Quotes are handled as notes on ServiceJobs for now
  console.log(`[import] ${transformedData.quotes.length} quotes will be added as notes`);
  results.quotes.notes = transformedData.quotes;

  // Step 5: Tasks as notes
  results.tasks.notes = transformedData.tasks;

  return results;
}

module.exports = {
  createPerson,
  createPeople,
  createServiceJob,
  importToTwenty
};
