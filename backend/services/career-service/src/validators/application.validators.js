const { body } = require('express-validator');

const STATUS_VALUES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED'];

const applyValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('opportunityId').isUUID().withMessage('Valid opportunity ID required.'),
    body('status').optional().isString().isLength({ max: 500 }).withMessage('Status must be a string up to 500 chars.'),
    body('statusClass').optional().isString().isLength({ max: 100 }).withMessage('Status class must be a short string.'),
];

const updateStatusValidator = [
    body('status').isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}.`),
    body('statusClass').optional().isString().isLength({ max: 100 }),
];

module.exports = { applyValidator, updateStatusValidator };
