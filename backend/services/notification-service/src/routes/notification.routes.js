const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createNotificationValidator } = require('../validators/notification.validators');
const ctrl = require('../controllers/notification.controller');

router.get('/:userId', authenticate, ctrl.getByUser);
router.post('/', authenticate, createNotificationValidator, validateRequest, ctrl.create);
router.put('/:id/read', authenticate, ctrl.markRead);
router.put('/read-all/:userId', authenticate, ctrl.markAllRead);

module.exports = router;
