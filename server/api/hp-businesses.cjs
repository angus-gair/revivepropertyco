'use strict';
const express = require('express');
const router = express.Router();
const { query, pool } = require('../lib/hp-businesses-db.cjs');
const { authenticateToken } = require('../lib/auth.cjs');

/**
 * GET /api/hp-businesses/debug - Health check (no auth required)
 */
router.get('/debug', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM hp_businesses');
    const sessions = await query('SELECT COUNT(*) as count FROM hp_scrape_sessions');
    res.json({
      success: true,
      message: 'HP Businesses API is working',
      database: 'Connected (hipages_directory)',
      totalBusinesses: result.rows[0].count,
      totalSessions: sessions.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


/**
 * GET /api/hp-businesses/noauth/businesses - Public businesses list (no auth required)
 * Same as /businesses but accessible without JWT — for dashboard/public pages
 */
router.get('/noauth/businesses', async (req, res) => {
  try {
    const { page = 1, limit = 10000, trade, suburb, state, lead_status, search, sort = 'scraped_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (trade) { where += ` AND primary_trade ILIKE $${i++}`; params.push(`%${trade}%`); }
    if (suburb) { where += ` AND suburb ILIKE $${i++}`; params.push(`%${suburb}%`); }
    if (state) { where += ` AND state = $${i++}`; params.push(state); }
    if (lead_status && lead_status !== 'ALL') { where += ` AND lead_status = $${i++}`; params.push(lead_status); }
    if (search) {
      where += ` AND (business_name ILIKE $${i} OR suburb ILIKE $${i} OR primary_trade ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }

    const allowed = { scraped_at: 'scraped_at', rating: 'rating', review_count: 'review_count', business_name: 'business_name' };
    const sortCol = allowed[sort] || 'scraped_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(`SELECT COUNT(*) as total FROM hp_businesses ${where}`, params);
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT * FROM hp_businesses ${where} ORDER BY ${sortCol} ${sortDir} NULLS LAST LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('[hp-businesses] Error (noauth):', error);
    res.status(500).json({ success: false, error: 'Failed to fetch businesses' });
  }
});

// Apply authentication to all routes below
router.use(authenticateToken);

/**
 * GET /api/hp-businesses/businesses - Paginated list with filters
 * Filters: trade, suburb, state, lead_status, verified, min_rating, search
 * Sort: scraped_at, rating, review_count, business_name (default: scraped_at DESC)
 */
router.get('/businesses', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      trade,
      suburb,
      state,
      lead_status,
      verified,
      min_rating,
      search,
      sort = 'scraped_at',
      order = 'DESC'
    } = req.query;

    const clampedLimit = Math.min(parseInt(limit) || 20, 10000);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * clampedLimit;

    // Whitelist sort columns to prevent injection
    const allowedSorts = {
      scraped_at: 'scraped_at',
      rating: 'rating',
      review_count: 'review_count',
      business_name: 'business_name'
    };
    const sortCol = allowedSorts[sort] || 'scraped_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    // rating and scraped_at use NULLS LAST when descending
    const nullsClause = (sortCol === 'rating' || sortCol === 'scraped_at') && sortOrder === 'DESC'
      ? ' NULLS LAST'
      : '';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (trade) {
      conditions.push(`primary_trade ILIKE $${idx}`);
      params.push(`%${trade}%`);
      idx++;
    }
    if (suburb) {
      conditions.push(`suburb ILIKE $${idx}`);
      params.push(`%${suburb}%`);
      idx++;
    }
    if (state) {
      conditions.push(`state ILIKE $${idx}`);
      params.push(state);
      idx++;
    }
    if (lead_status) {
      conditions.push(`lead_status = $${idx}`);
      params.push(lead_status.toUpperCase());
      idx++;
    }
    if (verified !== undefined) {
      conditions.push(`verified = $${idx}`);
      params.push(verified === 'true');
      idx++;
    }
    if (min_rating) {
      conditions.push(`rating >= $${idx}`);
      params.push(parseFloat(min_rating));
      idx++;
    }
    if (search) {
      conditions.push(`(business_name ILIKE $${idx} OR suburb ILIKE $${idx} OR primary_trade ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM hp_businesses ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const dataParams = [...params, clampedLimit, offset];
    const dataResult = await query(
      `SELECT * FROM hp_businesses ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}${nullsClause}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      dataParams
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: clampedLimit,
        total
      }
    });
  } catch (error) {
    console.error('[hp-businesses] Error fetching businesses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch businesses' });
  }
});

/**
 * GET /api/hp-businesses/businesses/:id - Single business detail
 */
router.get('/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM hp_businesses WHERE id = $1 OR hipages_profile_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hp-businesses] Error fetching business:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch business' });
  }
});

/**
 * PUT /api/hp-businesses/businesses/:id/status - Update lead_status
 */
router.put('/businesses/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { lead_status } = req.body;

    const allowed = ['NEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED'];
    if (!lead_status || !allowed.includes(lead_status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `lead_status must be one of: ${allowed.join(', ')}`
      });
    }

    const result = await query(
      `UPDATE hp_businesses
       SET lead_status = $1, last_updated = CURRENT_TIMESTAMP
       WHERE id = $2 OR hipages_profile_id = $2
       RETURNING *`,
      [lead_status.toUpperCase(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hp-businesses] Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead status' });
  }
});

/**
 * GET /api/hp-businesses/stats - Aggregate statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalResult,
      tradeResult,
      stateResult,
      ratingResult,
      newTodayResult,
      newWeekResult,
      suburbResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as total FROM hp_businesses'),
      query(`
        SELECT primary_trade, COUNT(*) as count
        FROM hp_businesses
        WHERE primary_trade IS NOT NULL
        GROUP BY primary_trade
        ORDER BY count DESC
        LIMIT 20
      `),
      query(`
        SELECT state, COUNT(*) as count
        FROM hp_businesses
        WHERE state IS NOT NULL
        GROUP BY state
        ORDER BY count DESC
      `),
      query(`
        SELECT ROUND(AVG(rating)::numeric, 2) as avg_rating
        FROM hp_businesses
        WHERE rating IS NOT NULL
      `),
      query(`
        SELECT COUNT(*) as count
        FROM hp_businesses
        WHERE scraped_at >= CURRENT_DATE
      `),
      query(`
        SELECT COUNT(*) as count
        FROM hp_businesses
        WHERE scraped_at >= CURRENT_DATE - INTERVAL '7 days'
      `),
      query(`
        SELECT suburb, COUNT(*) as count
        FROM hp_businesses
        WHERE suburb IS NOT NULL
        GROUP BY suburb
        ORDER BY count DESC
        LIMIT 20
      `)
    ]);

    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].total),
        newToday: parseInt(newTodayResult.rows[0].count),
        newThisWeek: parseInt(newWeekResult.rows[0].count),
        avgRating: parseFloat(ratingResult.rows[0].avg_rating) || null,
        byTrade: tradeResult.rows.map(r => ({
          trade: r.primary_trade,
          count: parseInt(r.count)
        })),
        byState: stateResult.rows.map(r => ({
          state: r.state,
          count: parseInt(r.count)
        })),
        topSuburbs: suburbResult.rows.map(r => ({
          suburb: r.suburb,
          count: parseInt(r.count)
        }))
      }
    });
  } catch (error) {
    console.error('[hp-businesses] Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/hp-businesses/sessions - List scrape sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const clampedLimit = Math.min(parseInt(limit) || 20, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * clampedLimit;

    const countResult = await query('SELECT COUNT(*) as total FROM hp_scrape_sessions');
    const total = parseInt(countResult.rows[0].total);

    const result = await query(
      `SELECT * FROM hp_scrape_sessions
       ORDER BY started_at DESC
       LIMIT $1 OFFSET $2`,
      [clampedLimit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: clampedLimit,
        total
      }
    });
  } catch (error) {
    console.error('[hp-businesses] Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scrape sessions' });
  }
});

/**
 * POST /api/hp-businesses/sessions - Create new scrape session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { trade_category, location, metadata } = req.body;

    const result = await query(
      `INSERT INTO hp_scrape_sessions (trade_category, location, metadata)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [trade_category || null, location || null, metadata ? JSON.stringify(metadata) : null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hp-businesses] Error creating session:', error);
    res.status(500).json({ success: false, error: 'Failed to create scrape session' });
  }
});

/**
 * PUT /api/hp-businesses/sessions/:id - Update session (mark complete/failed)
 */
router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      businesses_found,
      businesses_new,
      businesses_updated,
      error_message,
      metadata
    } = req.body;

    const allowedStatuses = ['running', 'completed', 'failed'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const setClauses = [];
    const params = [];
    let idx = 1;

    if (status !== undefined) {
      setClauses.push(`status = $${idx}`);
      params.push(status);
      idx++;
      if (status === 'completed' || status === 'failed') {
        setClauses.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    if (businesses_found !== undefined) {
      setClauses.push(`businesses_found = $${idx}`);
      params.push(parseInt(businesses_found) || 0);
      idx++;
    }
    if (businesses_new !== undefined) {
      setClauses.push(`businesses_new = $${idx}`);
      params.push(parseInt(businesses_new) || 0);
      idx++;
    }
    if (businesses_updated !== undefined) {
      setClauses.push(`businesses_updated = $${idx}`);
      params.push(parseInt(businesses_updated) || 0);
      idx++;
    }
    if (error_message !== undefined) {
      setClauses.push(`error_message = $${idx}`);
      params.push(error_message);
      idx++;
    }
    if (metadata !== undefined) {
      setClauses.push(`metadata = $${idx}`);
      params.push(JSON.stringify(metadata));
      idx++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE hp_scrape_sessions SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hp-businesses] Error updating session:', error);
    res.status(500).json({ success: false, error: 'Failed to update scrape session' });
  }
});

// POST /scrape/trigger
/**
 * POST /api/hp-businesses/scrape/trigger - Manually trigger a scrape run
 */
router.post('/scrape/trigger', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body || {});
    await query("SELECT pg_notify('hp_scrape_trigger', $1)", [payload]);
    res.json({
      success: true,
      message: 'Scrape triggered successfully'
    });
  } catch (error) {
    console.error('[hp-businesses] Error triggering scrape:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger scrape' });
  }
});

module.exports = router;
