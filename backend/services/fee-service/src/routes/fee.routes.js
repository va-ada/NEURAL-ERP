const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createFeeValidator, payFeeValidator } = require('../validators/fee.validators');
const ctrl = require('../controllers/fee.controller');

router.get('/:studentId', authenticate, ctrl.getByStudent);
router.get('/:studentId/summary', authenticate, ctrl.getSummary);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createFeeValidator, validateRequest, ctrl.create);
router.post('/:feeId/pay', authenticate, payFeeValidator, validateRequest, ctrl.pay);

module.exports = router;
