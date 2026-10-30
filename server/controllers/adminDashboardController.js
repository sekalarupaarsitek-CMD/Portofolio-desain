/**
 * SEKALARUPA STUDIO - Admin Dashboard Controller
 * PRD Reference: Section 7.1 (Dashboard Overview) & Section 18 (Analytics)
 */

const { get, all } = require('../db');
const { getRecentLogs } = require('../services/activityLog');

function getDashboardStats(req, res) {
  try {
    const totalProjects = get('SELECT count(*) as count FROM projects')?.count || 0;
    const publishedProjects = get('SELECT count(*) as count FROM projects WHERE is_published = 1')?.count || 0;
    const draftProjects = get('SELECT count(*) as count FROM projects WHERE is_published = 0')?.count || 0;
    const totalCategories = get('SELECT count(*) as count FROM categories WHERE is_active = 1')?.count || 0;
    const totalServices = get('SELECT count(*) as count FROM services WHERE is_active = 1')?.count || 0;
    const totalJournal = get('SELECT count(*) as count FROM journal_posts')?.count || 0;
    const totalMedia = get('SELECT count(*) as count FROM media_assets')?.count || 0;
    const totalInquiries = get('SELECT count(*) as count FROM project_inquiries')?.count || 0;
    const pendingInquiries = get("SELECT count(*) as count FROM project_inquiries WHERE status = 'pending'")?.count || 0;

    const recentLogs = getRecentLogs(10);
    const recentInquiries = all('SELECT * FROM project_inquiries ORDER BY created_at DESC LIMIT 5');

    return res.json({
      success: true,
      stats: {
        totalProjects,
        publishedProjects,
        draftProjects,
        totalCategories,
        totalServices,
        totalJournal,
        totalMedia,
        totalInquiries,
        pendingInquiries,
        systemStatus: 'Operational',
        uptime: process.uptime()
      },
      recentLogs,
      recentInquiries
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardStats
};
