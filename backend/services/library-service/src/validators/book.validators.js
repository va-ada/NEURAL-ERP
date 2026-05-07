const { body } = require('express-validator');

const createBookValidator = [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('author').trim().notEmpty().withMessage('Author is required.'),
    body('isbn')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('ISBN cannot be empty.')
        .isLength({ min: 10, max: 17 })
        .withMessage('ISBN must be between 10 and 17 characters.'),
    body('category').optional().isString().withMessage('Category must be a string.'),
    body('publisher').optional().isString().withMessage('Publisher must be a string.'),
    body('year').optional().isInt({ min: 0 }).withMessage('Year must be a non-negative integer.'),
    body('copies').optional().isInt({ min: 0 }).withMessage('Copies must be a non-negative integer.'),
    body('totalCopies').optional().isInt({ min: 0 }).withMessage('Total copies must be a non-negative integer.'),
    body('availableCopies').optional().isInt({ min: 0 }).withMessage('Available copies must be a non-negative integer.'),
    body('status')
        .optional()
        .isIn(['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST'])
        .withMessage('Status must be AVAILABLE, ISSUED, RESERVED, or LOST.'),
];

const updateBookValidator = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty.'),
    body('isbn')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('ISBN cannot be empty.')
        .isLength({ min: 10, max: 17 })
        .withMessage('ISBN must be between 10 and 17 characters.'),
    body('category').optional().isString().withMessage('Category must be a string.'),
    body('publisher').optional().isString().withMessage('Publisher must be a string.'),
    body('year').optional().isInt({ min: 0 }).withMessage('Year must be a non-negative integer.'),
    body('copies').optional().isInt({ min: 0 }).withMessage('Copies must be a non-negative integer.'),
    body('totalCopies').optional().isInt({ min: 0 }).withMessage('Total copies must be a non-negative integer.'),
    body('availableCopies').optional().isInt({ min: 0 }).withMessage('Available copies must be a non-negative integer.'),
    body('status')
        .optional()
        .isIn(['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST'])
        .withMessage('Status must be AVAILABLE, ISSUED, RESERVED, or LOST.'),
];

module.exports = { createBookValidator, updateBookValidator };
