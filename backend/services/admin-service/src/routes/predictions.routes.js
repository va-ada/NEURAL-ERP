const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const ctrl = require('../controllers/predictions.controller');

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/dropout-risk', ctrl.getDropoutRisk);
router.get('/placement-funnel', ctrl.getPlacementFunnel);

module.exports = router;
