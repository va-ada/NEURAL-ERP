const { body } = require('express-validator');

const updateSettingsValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Institution name cannot be empty.')
        .isLength({ max: 200 })
        .withMessage('Institution name must be at most 200 characters.'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must be at most 500 characters.'),
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage('Phone must be at most 30 characters.'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Valid email required.'),
    body('logo')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Logo URL must be at most 500 characters.'),
];

module.exports = { updateSettingsValidator };
