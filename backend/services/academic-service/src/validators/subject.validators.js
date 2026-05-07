const { body } = require('express-validator');

const createSubjectValidator = [
    body('name').trim().notEmpty().withMessage('Subject name is required.'),
    body('code').trim().notEmpty().withMessage('Subject code is required.'),
    body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
    body('departmentId').isUUID().withMessage('Valid department ID required.'),
];

const updateSubjectValidator = [
    body('name').optional().trim().notEmpty().withMessage('Subject name cannot be empty.'),
    body('code').optional().trim().notEmpty().withMessage('Subject code cannot be empty.'),
    body('credits').optional().isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
    body('semester').optional().isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
];

module.exports = { createSubjectValidator, updateSubjectValidator };
