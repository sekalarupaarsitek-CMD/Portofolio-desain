/**
 * SEKALARUPA STUDIO - Public API Routes
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/site', publicController.getSiteInfo);
router.get('/projects', publicController.getProjects);
router.get('/projects/:slug', publicController.getProjectBySlug);
router.get('/services', publicController.getServices);
router.get('/categories', publicController.getCategories);
router.get('/deliverables', publicController.getDeliverables);
router.get('/journal', publicController.getJournal);
router.get('/pages/:slug', publicController.getPageBySlug);
router.post('/inquiries', publicController.submitInquiry);

module.exports = router;
