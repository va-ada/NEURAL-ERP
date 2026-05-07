const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const ctrl = require('../controllers/analytics.controller');

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/attendance', ctrl.getAttendanceTrends);
router.get('/performance', ctrl.getPerformanceStats);
router.get('/placements', ctrl.getPlacementStats);
router.get('/departments', ctrl.getDepartmentComparison);

module.exports = router;
