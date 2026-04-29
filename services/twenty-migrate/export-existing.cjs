// services/twenty-migrate/export-existing.cjs
// Export existing data from platform database for migration to Twenty CRM

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20
});

/**
 * Export all leads from platform database
 */
async function exportLeads() {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, phone, address,
            service_interest, notes, status, created_at
     FROM leads
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Export all appointments from platform database
 */
async function exportAppointments() {
  const result = await pool.query(
    `SELECT id, lead_id, service_type, type, date, time_slot, notes, status
     FROM appointments
     ORDER BY date ASC, time_slot ASC`
  );
  return result.rows;
}

/**
 * Export all tasks from platform database
 */
async function exportTasks() {
  const result = await pool.query(
    `SELECT id, lead_id, title, description, due_date, completed, created_at
     FROM tasks
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Export all quotes from platform database
 */
async function exportQuotes() {
  const result = await pool.query(
    `SELECT id, lead_id, amount, status, valid_until, notes, created_at
     FROM quotes
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Export all hipages leads from platform database
 */
async function exportHipagesLeads() {
  const result = await pool.query(
    `SELECT lead_id, hipages_id, customer_name, suburb, postcode,
            job_type, job_subtype, description, credits, status,
            contact_status, posted_date, scraped_at, synced_to_crm, crm_lead_id
     FROM hipages_leads
     ORDER BY posted_date DESC NULLS LAST, scraped_at DESC`
  );
  return result.rows;
}

/**
 * Export all data for migration
 */
async function exportAllData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Export all data types
    const [leads, appointments, tasks, quotes, hipagesLeads] = await Promise.all([
      exportLeads(),
      exportAppointments(),
      exportTasks(),
      exportQuotes(),
      exportHipagesLeads()
    ]);

    await client.query('COMMIT');

    return {
      leads,
      appointments,
      tasks,
      quotes,
      hipagesLeads,
      exportedAt: new Date().toISOString(),
      counts: {
        leads: leads.length,
        appointments: appointments.length,
        tasks: tasks.length,
        quotes: quotes.length,
        hipagesLeads: hipagesLeads.length,
        total: leads.length + appointments.length + tasks.length + quotes.length + hipagesLeads.length
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[export] Error exporting data:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  exportLeads,
  exportAppointments,
  exportTasks,
  exportQuotes,
  exportHipagesLeads,
  exportAllData
};
