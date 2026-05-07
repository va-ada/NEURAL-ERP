const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const ctrl = require('../controllers/exam.controller');

router.get('/', authenticate, ctrl.getAll);
router.get('/batch/:batchId', authenticate, ctrl.getByBatch);
router.post('/', authenticate, authorize('FACULTY', 'ADMIN', 'SUPER_ADMIN'), ctrl.create);

module.exports = router;
