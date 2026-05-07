const { body } = require('express-validator');

const createBatchValidator = [
    body('name').trim().notEmpty().withMessage('Batch name is required.'),
    body('year').isInt({ min: 1900, max: 3000 }).withMessage('Valid year required.'),
    body('currentSemester').isInt({ min: 1, max: 12 }).withMessage('Current semester must be between 1 and 12.'),
    body('departmentId').isUUID().withMessage('Valid department ID required.'),
];

const updateBatchValidator = [
    body('name').optional().trim().notEmpty().withMessage('Batch name cannot be empty.'),
    body('year').optional().isInt({ min: 1900, max: 3000 }).withMessage('Valid year required.'),
    body('currentSemester').optional().isInt({ min: 1, max: 12 }).withMessage('Current semester must be between 1 and 12.'),
];

module.exports = { createBatchValidator, updateBatchValidator };
