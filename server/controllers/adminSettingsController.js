/**
 * SEKALARUPA STUDIO - Admin Settings & Theme Controller
 * PRD Reference: Section 7.9 (Theme & Branding) & Section 7.10 (General Settings)
 */

const crypto = require('crypto');
const { all, run } = require('../db');
const { logActivity } = require('../services/activityLog');

function getSettings(req, res) {
  try {
    const siteRows = all('SELECT setting_key, setting_value FROM site_settings');
    const siteSettings = {};
    for (const r of siteRows) {
      try {
        siteSettings[r.setting_key] = JSON.parse(r.setting_value);
      } catch (e) {
        siteSettings[r.setting_key] = r.setting_value;
      }
    }

    const themeRows = all('SELECT theme_key, theme_value FROM theme_settings');
    const themeSettings = {};
    for (const r of themeRows) {
      try {
        themeSettings[r.theme_key] = JSON.parse(r.theme_value);
      } catch (e) {
        themeSettings[r.theme_key] = r.theme_value;
      }
    }

    return res.json({
      success: true,
      data: {
        site: siteSettings,
        theme: themeSettings
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateSiteSettings(req, res) {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload.' });
    }

    for (const [k, v] of Object.entries(settings)) {
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const existing = all('SELECT id FROM site_settings WHERE setting_key = ?', [k]);
      if (existing.length > 0) {
        run('UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [valStr, k]);
      } else {
        const id = `set_${crypto.randomBytes(8).toString('hex')}`;
        run('INSERT INTO site_settings (id, setting_key, setting_value) VALUES (?, ?, ?)', [id, k, valStr]);
      }
    }

    logActivity(req.user?.id, 'UPDATE_SITE_SETTINGS', 'site_settings', null, settings);

    return res.json({ success: true, message: 'General settings updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function updateThemeSettings(req, res) {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid theme settings payload.' });
    }

    for (const [k, v] of Object.entries(settings)) {
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      const existing = all('SELECT id FROM theme_settings WHERE theme_key = ?', [k]);
      if (existing.length > 0) {
        run('UPDATE theme_settings SET theme_value = ?, updated_at = CURRENT_TIMESTAMP WHERE theme_key = ?', [valStr, k]);
      } else {
        const id = `thm_${crypto.randomBytes(8).toString('hex')}`;
        run('INSERT INTO theme_settings (id, theme_key, theme_value) VALUES (?, ?, ?)', [id, k, valStr]);
      }
    }

    logActivity(req.user?.id, 'UPDATE_THEME_SETTINGS', 'theme_settings', null, settings);

    return res.json({ success: true, message: 'Theme & branding settings updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSettings,
  updateSiteSettings,
  updateThemeSettings
};
