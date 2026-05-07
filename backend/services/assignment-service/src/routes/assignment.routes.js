const router = require('express').Router();
const multer = require('multer');
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createAssignmentValidator } = require('../validators/assignment.validators');
const ctrl = require('../controllers/assignment.controller');

// Use memory storage for Multer since we upload directly to S3
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

router.use(authenticate);

// Faculty routes
router.post('/', authorize('FACULTY', 'ADMIN'), upload.single('file'), createAssignmentValidator, validateRequest, ctrl.createAssignment);
router.get('/:assignmentId/submissions', authorize('FACULTY', 'ADMIN'), ctrl.getSubmissions);
router.patch('/submissions/:submissionId/grade', authorize('FACULTY', 'ADMIN'), ctrl.gradeSubmission);

// Student routes
router.post('/:assignmentId/submit', authorize('STUDENT'), upload.single('file'), ctrl.submitAssignment);

// Shared
router.get('/', ctrl.getAssignments);

module.exports = router;
