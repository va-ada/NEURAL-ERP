const { body } = require('express-validator');

const createDepartmentValidator = [
    body('name').trim().notEmpty().withMessage('Department name is required.'),
    body('code').trim().notEmpty().withMessage('Department code is required.'),
    body('hodId').optional().isUUID().withMessage('Valid HOD ID required.'),
];

const updateDepartmentValidator = [
    body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty.'),
    body('code').optional().trim().notEmpty().withMessage('Department code cannot be empty.'),
    body('hodId').optional().isUUID().withMessage('Valid HOD ID required.'),
];

module.exports = { createDepartmentValidator, updateDepartmentValidator };
