const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { updateSettingsValidator } = require('../validators/settings.validators');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', getSettings);
router.put('/', updateSettingsValidator, validateRequest, updateSettings);

module.exports = router;
