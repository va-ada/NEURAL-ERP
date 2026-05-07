const { body } = require('express-validator');

const createFeeValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('type')
        .isIn(['TUITION', 'EXAM', 'LIBRARY', 'LAB', 'OTHER'])
        .withMessage('Type must be TUITION, EXAM, LIBRARY, LAB, or OTHER.'),
    body('label').isString().notEmpty().withMessage('Label is required.'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number.'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be an integer between 1 and 8.'),
    body('dueDate').isISO8601().withMessage('Valid ISO 8601 due date required.'),
];

const payFeeValidator = [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number.'),
    body('method')
        .optional()
        .isIn(['UPI', 'Card', 'Net Banking', 'NEFT'])
        .withMessage('Method must be UPI, Card, Net Banking, or NEFT.'),
];

module.exports = { createFeeValidator, payFeeValidator };
