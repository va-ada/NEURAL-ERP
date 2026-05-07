const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const {
    createBatchValidator,
    updateBatchValidator,
} = require('../validators/batch.validators');
const ctrl = require('../controllers/batch.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createBatchValidator, validateRequest, ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateBatchValidator, validateRequest, ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);

module.exports = router;
