const { body } = require('express-validator');

const createNotificationValidator = [
    body('userId').isUUID().withMessage('Valid user ID required.'),
    body('type')
        .optional()
        .isIn(['INFO', 'SUCCESS', 'WARNING', 'ALERT'])
        .withMessage('Type must be INFO, SUCCESS, WARNING, or ALERT.'),
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Text is required.')
        .isLength({ max: 5000 })
        .withMessage('Text must be at most 5000 characters.'),
    body('icon').optional().isString().isLength({ max: 100 }),
];

module.exports = { createNotificationValidator };
