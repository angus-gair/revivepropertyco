// services/twenty-migrate/run-migration.cjs
// Main migration orchestrator for Twenty CRM data migration

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exportAllData } = require('./export-existing.cjs');
const { transformAllData } = require('./transform-data.cjs');
const { importToTwenty } = require('./import-to-twenty.cjs');

// Output directory for migration artifacts
const OUTPUT_DIR = path.join(__dirname, 'output');

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Save migration artifacts to disk
 */
function saveArtifacts(exportedData, transformedData) {
  ensureOutputDir();

  const timestamp = new Date().toISOString().replace(/:/g, '-');

  // Save exported data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `exported-${timestamp}.json`),
    JSON.stringify(exportedData, null, 2)
  );

  // Save transformed data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `transformed-${timestamp}.json`),
    JSON.stringify(transformedData, null, 2)
  );

  return timestamp;
}

/**
 * Load migration artifacts from disk (for idempotent re-run)
 */
function loadArtifacts(timestamp) {
  const exportedPath = path.join(OUTPUT_DIR, `exported-${timestamp}.json`);
  const transformedPath = path.join(OUTPUT_DIR, `transformed-${timestamp}.json`);

  if (!fs.existsSync(exportedPath) || !fs.existsSync(transformedPath)) {
    return null;
  }

  return {
    exported: JSON.parse(fs.readFileSync(exportedPath, 'utf8')),
    transformed: JSON.parse(fs.readFileSync(transformedPath, 'utf8'))
  };
}

/**
 * Run the full migration pipeline
 */
async function runMigration(options = {}) {
  const {
    apiToken = process.env.TWENTY_API_TOKEN,
    serverUrl = process.env.TWENTY_SERVER_URL,
    skipExport = false,
    skipTransform = false,
    skipImport = false,
    artifactTimestamp = null
  } = options;

  console.log('==========================================');
  console.log('Twenty CRM Migration');
  console.log('==========================================');
  console.log(`Server: ${serverUrl}`);
  console.log(`API Token: ${apiToken ? '***' + apiToken.slice(-4) : 'not provided'}`);
  console.log('');

  let exportedData, transformedData, importResults;

  // Step 1: Export
  if (skipExport) {
    if (artifactTimestamp) {
      console.log(`[skip] Loading artifacts from ${artifactTimestamp}...`);
      const artifacts = loadArtifacts(artifactTimestamp);
      if (artifacts) {
        exportedData = artifacts.exported;
        transformedData = artifacts.transformed;
      } else {
        throw new Error(`Artifacts not found for timestamp: ${artifactTimestamp}`);
      }
    } else {
      throw new Error('skipExport=true requires artifactTimestamp');
    }
  } else {
    console.log('[step 1/3] Exporting data from platform database...');
    exportedData = await exportAllData();
    console.log(`  Exported: ${exportedData.counts.total} records`);
    console.log(`    - Leads: ${exportedData.counts.leads}`);
    console.log(`    - Appointments: ${exportedData.counts.appointments}`);
    console.log(`    - Tasks: ${exportedData.counts.tasks}`);
    console.log(`    - Quotes: ${exportedData.counts.quotes}`);
    console.log(`    - Hipages leads: ${exportedData.counts.hipagesLeads}`);
  }

  // Step 2: Transform
  if (!skipTransform && !transformedData) {
    console.log('[step 2/3] Transforming data to Twenty format...');
    transformedData = transformAllData(exportedData);
    console.log(`  Transformed:`);
    console.log(`    - People: ${transformedData.counts.people}`);
    console.log(`    - ServiceJobs: ${transformedData.counts.serviceJobs}`);
    console.log(`    - HipagesLeads: ${transformedData.counts.hipagesLeads}`);
    console.log(`    - Quotes: ${transformedData.counts.quotes}`);
    console.log(`    - Tasks: ${transformedData.counts.tasks}`);
  }

  // Save artifacts
  if (!skipExport && !skipTransform) {
    const timestamp = saveArtifacts(exportedData, transformedData);
    console.log(`  Saved artifacts: ${timestamp}`);
  }

  // Step 3: Import
  if (!skipImport) {
    console.log('[step 3/3] Importing data to Twenty CRM...');

    if (!apiToken) {
      throw new Error('TWENTY_API_TOKEN is required for import. Set in .env or pass via options.');
    }

    importResults = await importToTwenty(transformedData, apiToken, serverUrl, {
      batchSize: options.batchSize || 20,
      delay: options.delay || 500,
      onProgress: (progress) => {
        console.log(`  [${progress.phase}] ${progress.processed}/${progress.total} (${progress.created} created, ${progress.failed} failed)`);
      }
    });

    console.log('');
    console.log('Import Results:');
    console.log(`  People: ${importResults.people.created.length} created, ${importResults.people.failed.length} failed`);
    console.log(`  ServiceJobs: ${importResults.serviceJobs.created.length} created, ${importResults.serviceJobs.failed.length} failed`);
    console.log(`  HipagesLeads: ${importResults.hipagesLeads.created.length} created, ${importResults.hipagesLeads.failed.length} failed`);
    console.log(`  Quotes: ${importResults.quotes.notes.length} notes to add`);
  }

  console.log('');
  console.log('==========================================');
  console.log('Migration Complete!');
  console.log('==========================================');

  return {
    exported: exportedData,
    transformed: transformedData,
    imported: importResults,
    timestamp: new Date().toISOString()
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--skip-export') options.skipExport = true;
    if (arg === '--skip-transform') options.skipTransform = true;
    if (arg === '--skip-import') options.skipImport = true;
    if (arg === '--batch-size' && args[i + 1]) options.batchSize = parseInt(args[++i]);
    if (arg === '--delay' && args[i + 1]) options.delay = parseInt(args[++i]);
    if (arg === '--artifact' && args[i + 1]) options.artifactTimestamp = args[++i];
  }

  runMigration(options)
    .then(() => {
      console.log('\n✓ Migration successful');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { runMigration, saveArtifacts, loadArtifacts };
