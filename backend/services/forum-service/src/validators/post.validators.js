const { body } = require('express-validator');

const createPostValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required.')
        .isLength({ max: 5000 })
        .withMessage('Title must be at most 5000 characters.'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required.')
        .isLength({ max: 5000 })
        .withMessage('Content must be at most 5000 characters.'),
    body('category')
        .optional()
        .isString()
        .withMessage('Category must be a string.'),
];

const updatePostValidator = [
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty.')
        .isLength({ max: 5000 })
        .withMessage('Title must be at most 5000 characters.'),
    body('content')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Content cannot be empty.')
        .isLength({ max: 5000 })
        .withMessage('Content must be at most 5000 characters.'),
    body('category')
        .optional()
        .isString()
        .withMessage('Category must be a string.'),
];

module.exports = { createPostValidator, updatePostValidator };
