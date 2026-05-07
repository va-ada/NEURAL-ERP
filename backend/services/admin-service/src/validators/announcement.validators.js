const { body } = require('express-validator');

const createAnnouncementValidator = [
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
    body('priority')
        .optional()
        .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
        .withMessage('Priority must be LOW, NORMAL, HIGH, or URGENT.'),
    body('audience')
        .optional()
        .isIn(['ALL', 'STUDENT', 'FACULTY', 'ADMIN'])
        .withMessage('Audience must be ALL, STUDENT, FACULTY, or ADMIN.'),
    body('expiresAt').optional().isISO8601().withMessage('Valid ISO 8601 expiry required.'),
];

module.exports = { createAnnouncementValidator };
