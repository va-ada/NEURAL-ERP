const { body } = require('express-validator');

const createReplyValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required.')
        .isLength({ max: 5000 })
        .withMessage('Content must be at most 5000 characters.'),
];

module.exports = { createReplyValidator };
