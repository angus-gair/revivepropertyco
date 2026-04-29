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
const customerRouter = require('./api/customer.cjs');
const customerDocumentsRouter = require('./api/customerDocuments.cjs');
const customerQuotesRouter = require('./api/customerQuotes.cjs');
const hipagesRouter = require('./api/hipages.cjs');
const platformRouter = require('./api/platform.cjs');
const authPlatformRouter = require('./api/auth-platform.cjs');
const invitationsRouter = require('./api/invitations.cjs');
const twentyWebhooksRouter = require('./api/twenty-webhooks.cjs');
const { subscribeToHipagesUpdates } = require('./lib/hipages-sync.cjs');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const PORT = process.env.PORT || 8080;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://revivepropertyco.au'
      : '*',
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Ensure uploads directory exists
const uploadsDir = require('path').join(process.cwd(), 'uploads', 'customers');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  console.log('✓ Created uploads directory:', uploadsDir);
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://revivepropertyco.au'
    : '*',
  credentials: true
}));

// Raw body parser for webhook signature verification (must be before express.json)
app.use('/api/twenty/webhooks', express.raw({ type: 'application/json' }));

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
app.use('/api/customer', customerRouter);
app.use('/api/customer', customerDocumentsRouter);
app.use('/api/customer', customerQuotesRouter);
app.use('/api/hipages', hipagesRouter);
// Platform API routes (multi-tenant)
app.use('/api/platform', platformRouter);
app.use('/api/auth/platform', authPlatformRouter);
// Team invitations API
app.use('/api/invitations', invitationsRouter);
// Twenty CRM webhooks
app.use('/api/twenty', twentyWebhooksRouter);

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
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API base URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO initialized for real-time updates`);

  // Subscribe to hipages updates after server starts
  subscribeToHipagesUpdates(io).catch((error) => {
    console.error('[sync] Failed to subscribe to hipages updates:', error);
  });
});

module.exports = app;
