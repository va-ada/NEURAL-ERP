const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createOpportunityValidator } = require('../validators/opportunity.validators');
const { applyValidator } = require('../validators/application.validators');
const { createEventValidator } = require('../validators/event.validators');
const { addSkillValidator } = require('../validators/skill.validators');
const ctrl = require('../controllers/career.controller');

// Opportunities
router.get('/opportunities', authenticate, ctrl.getOpportunities);
router.post('/opportunities', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createOpportunityValidator, validateRequest, ctrl.createOpportunity);

// Events
router.get('/events', authenticate, ctrl.getEvents);
router.post('/events', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createEventValidator, validateRequest, ctrl.createEvent);

// Applications
router.get('/applications/:studentId', authenticate, ctrl.getApplications);
router.post('/applications', authenticate, applyValidator, validateRequest, ctrl.createApplication);

// Skills
router.get('/skills/:studentId', authenticate, ctrl.getSkills);
router.put('/skills/:studentId', authenticate, addSkillValidator, validateRequest, ctrl.updateSkills);

// Stats
router.get('/stats/:studentId', authenticate, ctrl.getStats);

// AI Recommendations
router.post('/recommendations/:studentId', authenticate, ctrl.getRecommendations);
router.put('/preferences/:studentId', authenticate, ctrl.updatePreference);

module.exports = router;
