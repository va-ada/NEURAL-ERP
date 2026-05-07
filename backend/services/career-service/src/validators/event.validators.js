const { body } = require('express-validator');

const createEventValidator = [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 500 }).withMessage('Name must be 500 chars or fewer.'),
    body('date').isISO8601().withMessage('Valid ISO 8601 date required.'),
    body('time').isString().notEmpty().withMessage('Time is required.').isLength({ max: 50 }),
    body('venue').trim().notEmpty().withMessage('Venue is required.').isLength({ max: 500 }),
    body('eventDate').optional().isISO8601().withMessage('Valid ISO 8601 event date required.'),
    body('startDate').optional().isISO8601().withMessage('Valid ISO 8601 start date required.'),
    body('endDate').optional().isISO8601().withMessage('Valid ISO 8601 end date required.'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be 500 chars or fewer.'),
];

const updateEventValidator = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 500 }),
    body('date').optional().isISO8601().withMessage('Valid ISO 8601 date required.'),
    body('time').optional().isString().notEmpty().isLength({ max: 50 }),
    body('venue').optional().trim().notEmpty().isLength({ max: 500 }),
    body('eventDate').optional().isISO8601(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('description').optional().trim().isLength({ max: 500 }),
];

module.exports = { createEventValidator, updateEventValidator };
