/**
 * SEKALARUPA STUDIO - Backend Server Entrypoint
 * PRD Reference: Section 10 (Database), 11 (Technical Architecture), 12 (Security)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { seedDatabase } = require('./db/seed');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists (supporting Vercel /tmp)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless ? '/tmp/uploads' : path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.warn('[Uploads Warning] mkdir failed:', e.message);
  }
}

// Ensure database is seeded with initial data
let seedPromise = null;
function getSeedPromise() {
  if (!seedPromise) {
    seedPromise = seedDatabase().catch(err => {
      console.error('[Seeder Failed]', err);
    });
  }
  return seedPromise;
}
getSeedPromise();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Await database seeding for incoming requests
app.use(async (req, res, next) => {
  try {
    await getSeedPromise();
  } catch (e) {
    // continue
  }
  next();
});

// Static file serving
app.use('/uploads', express.static(uploadsDir));
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));
app.use('/css', express.static(path.resolve(__dirname, '../css')));
app.use('/js', express.static(path.resolve(__dirname, '../js')));
app.use('/admin', express.static(path.resolve(__dirname, '../admin')));

// API Routes (mounted on both /api/* and root prefixes to support Vercel serverless rewrites)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/public', '/public'], publicRoutes);
app.use(['/api/admin', '/admin/api'], adminRoutes);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SEKALARUPA STUDIO Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve Public Website Homepage
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

// Admin fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../admin/index.html'));
});

// 404 handler for API routes (always returns JSON, never HTML)
app.use((req, res, next) => {
  const isApi = req.url.startsWith('/api') ||
                req.url.startsWith('/auth') ||
                req.url.startsWith('/public') ||
                req.url.startsWith('/admin/api');
  if (isApi) {
    return res.status(404).json({
      success: false,
      error: `API endpoint ${req.method} ${req.originalUrl || req.url} tidak ditemukan.`
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`   SEKALARUPA STUDIO - BACKEND SERVER ACTIVE`);
    console.log(`   Port: http://localhost:${PORT}`);
    console.log(`   Admin CMS: http://localhost:${PORT}/admin/`);
    console.log(`   Public Website: http://localhost:${PORT}/`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
