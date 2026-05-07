const { body } = require('express-validator');

const createNoteValidator = [
    body('folderId').isUUID().withMessage('Valid folder ID required.'),
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required.')
        .isLength({ max: 50000 })
        .withMessage('Content must be at most 50000 characters.'),
    body('subject').optional().isString().withMessage('Subject must be a string.'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('isBookmarked').optional().isBoolean().withMessage('isBookmarked must be a boolean.'),
];

const updateNoteValidator = [
    body('folderId').optional().isUUID().withMessage('Valid folder ID required.'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
    body('content')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Content cannot be empty.')
        .isLength({ max: 50000 })
        .withMessage('Content must be at most 50000 characters.'),
    body('subject').optional().isString().withMessage('Subject must be a string.'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('isBookmarked').optional().isBoolean().withMessage('isBookmarked must be a boolean.'),
];

module.exports = { createNoteValidator, updateNoteValidator };
