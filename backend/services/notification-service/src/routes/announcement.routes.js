const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createAnnouncementValidator } = require('../validators/announcement.validators');
const ctrl = require('../controllers/announcement.controller');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createAnnouncementValidator, validateRequest, ctrl.create);

module.exports = router;
