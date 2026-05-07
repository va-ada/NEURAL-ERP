const { body } = require('express-validator');

const createFolderValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('name').trim().notEmpty().withMessage('Folder name is required.'),
    body('icon').optional().isString().withMessage('Icon must be a string.'),
];

const updateFolderValidator = [
    body('name').optional().trim().notEmpty().withMessage('Folder name cannot be empty.'),
    body('icon').optional().isString().withMessage('Icon must be a string.'),
];

module.exports = { createFolderValidator, updateFolderValidator };
