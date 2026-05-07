const router = require('express').Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const {
    createSlotValidator,
    updateSlotValidator,
    bulkUpdateValidator,
    checkConflictsValidator,
} = require('../validators/timetable.validators');
const ctrl = require('../controllers/timetable.controller');

router.use(authenticate);

// Read — all authenticated
router.get('/batch/:batchId', ctrl.getByBatch);
router.get('/faculty/:facultyId', ctrl.getByFaculty);

// Write — admin only
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createSlotValidator, validateRequest, ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateSlotValidator, validateRequest, ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);

// Bulk operations — admin only (for timetable builder)
router.put('/batch/:batchId/bulk', authorize('SUPER_ADMIN', 'ADMIN'), bulkUpdateValidator, validateRequest, ctrl.bulkUpdate);
router.delete('/batch/:batchId/clear', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.clearBatch);
router.post('/conflicts', authorize('SUPER_ADMIN', 'ADMIN'), checkConflictsValidator, validateRequest, ctrl.checkConflicts);

module.exports = router;
