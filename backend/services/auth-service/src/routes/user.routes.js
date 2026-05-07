const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { getMe, updateMe, getUserById, listUsers, toggleUserStatus } = require('../controllers/user.controller');

// Protected routes — require JWT
router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);

// Admin-only routes
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), listUsers);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), getUserById);
router.patch('/:id/toggle-status', authorize('SUPER_ADMIN', 'ADMIN'), toggleUserStatus);

module.exports = router;
