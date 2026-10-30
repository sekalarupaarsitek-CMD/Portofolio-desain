/**
 * Vercel Serverless Function Adapter for SEKALARUPA STUDIO Backend
 */

const app = require('../server/index');

module.exports = (req, res) => {
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
