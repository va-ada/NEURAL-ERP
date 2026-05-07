const { body } = require('express-validator');

const createFacultyValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required.'),
    body('departmentId').isUUID().withMessage('Valid department ID required.'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty.'),
];

const updateFacultyValidator = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('employeeId').optional().trim().notEmpty().withMessage('Employee ID cannot be empty.'),
    body('departmentId').optional().isUUID().withMessage('Valid department ID required.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty.'),
];

module.exports = { createFacultyValidator, updateFacultyValidator };
