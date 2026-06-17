const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { resolveTenantId } = require('../lib/tenant-context.cjs');
const { v4: uuidv4 } = require('uuid');

// Apply authentication to all CRM routes
router.use(authenticateToken);

/**
 * GET /api/crm/leads - Get all leads (tenant-scoped)
 */
router.get('/leads', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [resolveTenantId(req)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/crm/appointments - Get all appointments
 */
router.get('/appointments', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM appointments WHERE tenant_id = $1 ORDER BY date ASC, time_slot ASC`,
      [resolveTenantId(req)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/crm/tasks - Get all tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM tasks WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [resolveTenantId(req)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/crm/leads/:id/status - Update lead status
 */
router.patch('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Construct dynamic UPDATE query
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.status(400).json({ error: 'No updates provided' });
    
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const tenantParam = keys.length + 2;
    const values = [id, ...Object.values(updates), resolveTenantId(req)];

    const result = await query(
      `UPDATE leads SET ${setClause} WHERE id = $1 AND tenant_id = $${tenantParam} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

/**
 * POST /api/crm/tasks - Add new task
 */
router.post('/tasks', async (req, res) => {
  try {
    const { title, leadId, dueDate, completed } = req.body;
    const id = uuidv4();
    const createdAt = Date.now();
    
    const result = await query(
      `INSERT INTO tasks (id, lead_id, title, due_date, completed, created_at, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, leadId || null, title, dueDate || null, !!completed, createdAt, resolveTenantId(req)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

/**
 * PATCH /api/crm/tasks/:id - Update task
 */
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const tenantParam = keys.length + 2;
    const values = [id, ...Object.values(updates), resolveTenantId(req)];

    const result = await query(
      `UPDATE tasks SET ${setClause} WHERE id = $1 AND tenant_id = $${tenantParam} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/crm/tasks/:id - Delete task
 */
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM tasks WHERE id = $1 AND tenant_id = $2`, [id, resolveTenantId(req)]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

module.exports = router;
