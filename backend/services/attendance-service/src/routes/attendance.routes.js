const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { markAttendanceValidator } = require('../validators/attendance.validators');
const ctrl = require('../controllers/attendance.controller');

router.use(authenticate);

// Faculty marks attendance (bulk)
router.post('/', authorize('FACULTY', 'ADMIN', 'SUPER_ADMIN'), markAttendanceValidator, validateRequest, ctrl.markAttendance);

// Get attendance records
router.get('/', ctrl.getByBatch);
router.get('/student/:studentId', ctrl.getByStudent);
router.get('/stats', ctrl.getStats);

module.exports = router;
