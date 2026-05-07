const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const ctrl = require('../controllers/admin.controller');

const adminOnly = [authenticate, authorize('ADMIN', 'SUPER_ADMIN')];

router.get('/dashboard', ...adminOnly, ctrl.getDashboard);
router.get('/at-risk', ...adminOnly, ctrl.getAtRisk);
router.get('/activity', ...adminOnly, ctrl.getActivity);
router.get('/reports/students', ...adminOnly, ctrl.getStudentReport);
router.get('/audit-log', ...adminOnly, ctrl.getAuditLog);
router.post('/audit-log', authenticate, ctrl.createAuditLog);

module.exports = router;
