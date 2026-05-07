const { body } = require('express-validator');

const createStudentValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('rollNumber').trim().notEmpty().withMessage('Roll number is required.'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
    body('departmentId').isUUID().withMessage('Valid department ID required.'),
    body('batchId').isUUID().withMessage('Valid batch ID required.'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
];

const updateStudentValidator = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('rollNumber').optional().trim().notEmpty().withMessage('Roll number cannot be empty.'),
    body('semester').optional().isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
    body('departmentId').optional().isUUID().withMessage('Valid department ID required.'),
    body('batchId').optional().isUUID().withMessage('Valid batch ID required.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
];

const updateProfileValidator = [
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    body('section').optional().trim().notEmpty().withMessage('Section cannot be empty.'),
    body('semester').optional().isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
    body('avatarInitial').optional().trim().notEmpty().withMessage('Avatar initial cannot be empty.'),
    body('avatarColor').optional().trim().notEmpty().withMessage('Avatar color cannot be empty.'),
];

module.exports = { createStudentValidator, updateStudentValidator, updateProfileValidator };
