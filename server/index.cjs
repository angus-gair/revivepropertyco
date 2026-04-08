const dotenv = require('dotenv');
// Try to load .env.production, but don't fail if it's missing (env vars might be passed directly)
try {
  dotenv.config({ path: '.env.production' });
} catch (e) {
  // Silent ignore
}
console.log('🔧 Environment configuration:');
console.log('  - DATABASE_URL hostname:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1]?.split(':')[0] : 'NOT SET');
console.log('  - RESEND_FROM:', process.env.RESEND_FROM || 'NOT SET');
const express = require('express');
const cors = require('cors');

// Import routes (use .cjs extension)
const bookingsRouter = require('./api/bookings.cjs');
const availabilityRouter = require('./api/availability.cjs');
const authRouter = require('./api/auth.cjs');
const touchpointsRouter = require('./api/touchpoints.cjs');
const quotesRouter = require('./api/quotes.cjs');
const queueRouter = require('./api/queue.cjs');
const notificationsRouter = require('./api/notifications.cjs');
const crmRouter = require('./api/crm.cjs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://revivepropertyco.au'
    : '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/auth', authRouter);
app.use('/api/touchpoints', touchpointsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/crm', crmRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API base URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
