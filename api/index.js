/**
 * Vercel Serverless Function Adapter for SEKALARUPA STUDIO Backend
 */

let app;
let initError = null;

try {
  app = require('../server/index');
} catch (err) {
  initError = err;
  console.error('[Vercel Serverless Init Error]', err);
}

module.exports = async (req, res) => {
  // If top-level module load failed, return JSON error rather than crashing Lambda with HTML
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: `Serverless Initialization Error: ${initError.message}`,
      nodeVersion: process.version,
      details: initError.stack
    }));
  }

  // Ensure database initialization and seeding is complete before handling request
  try {
    if (typeof app.getSeedPromise === 'function') {
      await app.getSeedPromise();
    }
  } catch (seedErr) {
    console.warn('[Vercel Seed Warning]', seedErr.message);
  }

  if (req.url) {
    // Strip redundant serverless prefix if forwarded by Vercel
    if (req.url.startsWith('/api/index.js')) {
      req.url = req.url.replace('/api/index.js', '') || '/';
    } else if (req.url.startsWith('/index.js')) {
      req.url = req.url.replace('/index.js', '') || '/';
    }

    // Ensure /api prefix is present so Express routes match predictably
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  return app(req, res);
};
