const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const {
    createStudentValidator,
    updateStudentValidator,
    updateProfileValidator,
} = require('../validators/student.validators');
const ctrl = require('../controllers/student.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createStudentValidator, validateRequest, ctrl.create);
router.put('/:id/profile', updateProfileValidator, validateRequest, ctrl.updateStudent);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateStudentValidator, validateRequest, ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);

module.exports = router;
