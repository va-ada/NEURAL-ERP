const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const {
    createDepartmentValidator,
    updateDepartmentValidator,
} = require('../validators/department.validators');
const ctrl = require('../controllers/department.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createDepartmentValidator, validateRequest, ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateDepartmentValidator, validateRequest, ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);

module.exports = router;
