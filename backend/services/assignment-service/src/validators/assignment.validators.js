const { body } = require('express-validator');

const createAssignmentValidator = [
    body('title').notEmpty().isLength({ max: 200 }).withMessage('Title is required and must be at most 200 characters.'),
    body('subjectId').isUUID().withMessage('Valid subject ID required.'),
    body('batchId').isUUID().withMessage('Valid batch ID required.'),
    body('dueDate').isISO8601().withMessage('Valid ISO 8601 due date required.'),
    body('maxMarks')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Max marks must be an integer between 1 and 1000.'),
];

module.exports = { createAssignmentValidator };
