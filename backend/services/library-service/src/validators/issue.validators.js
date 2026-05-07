const { body } = require('express-validator');

const issueBookValidator = [
    body('bookId').isUUID().withMessage('Valid book ID required.'),
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('dueDate').isISO8601().withMessage('Valid ISO 8601 due date required.'),
];

const returnBookValidator = [
    body('returnedAt').optional().isISO8601().withMessage('Valid ISO 8601 return date required.'),
    body('fine').optional().isInt({ min: 0 }).withMessage('Fine must be a non-negative integer.'),
];

module.exports = { issueBookValidator, returnBookValidator };
