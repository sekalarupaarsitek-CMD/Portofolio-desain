/**
 * SEKALARUPA STUDIO - Admin API Routes (Protected)
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const dashboardController = require('../controllers/adminDashboardController');
const projectsController = require('../controllers/adminProjectsController');
const servicesController = require('../controllers/adminServicesController');
const deliverablesController = require('../controllers/adminDeliverablesController');
const mediaController = require('../controllers/adminMediaController');
const journalController = require('../controllers/adminJournalController');
const navigationController = require('../controllers/adminNavigationController');
const pageBuilderController = require('../controllers/adminPageBuilderController');
const settingsController = require('../controllers/adminSettingsController');
const inquiriesController = require('../controllers/adminInquiriesController');
const backupController = require('../controllers/adminBackupController');

// All routes require authenticated admin
router.use(requireAuth);

// 1. Dashboard
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// 2. Projects
router.get('/projects', projectsController.getAllProjects);
router.get('/projects/:id', projectsController.getProjectById);
router.post('/projects', projectsController.createProject);
router.put('/projects/:id', projectsController.updateProject);
router.delete('/projects/:id', projectsController.deleteProject);
router.post('/projects/:id/duplicate', projectsController.duplicateProject);
router.patch('/projects/:id/status', projectsController.toggleStatus);

// 3. Services
router.get('/services', servicesController.getAllServices);
router.get('/services/:id', servicesController.getServiceById);
router.post('/services', servicesController.createService);
router.put('/services/:id', servicesController.updateService);
router.delete('/services/:id', servicesController.deleteService);

// 4. Deliverables
router.get('/deliverables', deliverablesController.getAllDeliverables);
router.post('/deliverables', deliverablesController.createDeliverable);
router.put('/deliverables/:id', deliverablesController.updateDeliverable);
router.delete('/deliverables/:id', deliverablesController.deleteDeliverable);

// 5. Media Library
router.get('/media', mediaController.getAllMedia);
router.post('/media/upload', upload.array('files', 12), mediaController.uploadMedia);
router.put('/media/:id', mediaController.updateMedia);
router.delete('/media/:id', mediaController.deleteMedia);
router.get('/media-folders', mediaController.getFolders);
router.post('/media-folders', mediaController.createFolder);
router.delete('/media-folders/:id', mediaController.deleteFolder);

// 6. Journal
router.get('/journal', journalController.getAllJournal);
router.get('/journal/:id', journalController.getJournalById);
router.post('/journal', journalController.createJournal);
router.put('/journal/:id', journalController.updateJournal);
router.delete('/journal/:id', journalController.deleteJournal);

// 7. Navigation
router.get('/navigation', navigationController.getNavigation);
router.post('/navigation/items', navigationController.createNavItem);
router.put('/navigation/items/:id', navigationController.updateNavItem);
router.delete('/navigation/items/:id', navigationController.deleteNavItem);

// 8. Visual Page Builder
router.get('/pages', pageBuilderController.getPages);
router.get('/pages/:id/builder', pageBuilderController.getPageBuilderData);
router.post('/pages', pageBuilderController.createPage);
router.put('/pages/:id/builder', pageBuilderController.saveBuilderContent);
router.post('/pages/:id/versions/:versionId/restore', pageBuilderController.restoreVersion);
router.post('/pages/:id/reset-default', pageBuilderController.resetDefaultTemplate);

// 9. Settings & Theme
router.get('/settings', settingsController.getSettings);
router.put('/settings/site', settingsController.updateSiteSettings);
router.put('/settings/theme', settingsController.updateThemeSettings);

// 10. Inquiries
router.get('/inquiries', inquiriesController.getAllInquiries);
router.put('/inquiries/:id/status', inquiriesController.updateInquiryStatus);
router.delete('/inquiries/:id', inquiriesController.deleteInquiry);

// 11. Backup
router.get('/backup/export', backupController.exportDatabase);
router.post('/backup/import', backupController.importDatabase);

module.exports = router;
