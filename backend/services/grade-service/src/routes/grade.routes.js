const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createGradeValidator } = require('../validators/grade.validators');
const ctrl = require('../controllers/grade.controller');

router.get('/student/:studentId', authenticate, ctrl.getByStudent);
router.get('/student/:studentId/semester/:semester', authenticate, ctrl.getBySemester);
router.get('/student/:studentId/stats', authenticate, ctrl.getStats);
router.post('/', authenticate, authorize('FACULTY', 'ADMIN', 'SUPER_ADMIN'), createGradeValidator, validateRequest, ctrl.create);

module.exports = router;
