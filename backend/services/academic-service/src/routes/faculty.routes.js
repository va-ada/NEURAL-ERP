const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const {
    createFacultyValidator,
    updateFacultyValidator,
} = require('../validators/faculty.validators');
const ctrl = require('../controllers/faculty.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createFacultyValidator, validateRequest, ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateFacultyValidator, validateRequest, ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);
router.post('/:id/assign-subject', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.assignSubject);

module.exports = router;
