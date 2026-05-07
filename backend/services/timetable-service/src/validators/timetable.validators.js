const { body } = require('express-validator');

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const SLOT_TYPES = ['LECTURE', 'LAB', 'TUTORIAL', 'LUNCH', 'FREE'];
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const createSlotValidator = [
    body('batchId').isUUID().withMessage('Valid batch ID required.'),
    body('subjectId').isUUID().withMessage('Valid subject ID required.'),
    body('facultyId').isUUID().withMessage('Valid faculty ID required.'),
    body('day').isIn(DAYS).withMessage('Day must be MONDAY..SUNDAY.'),
    body('startTime').matches(TIME_REGEX).withMessage('startTime must be HH:MM (00:00-23:59).'),
    body('endTime').matches(TIME_REGEX).withMessage('endTime must be HH:MM (00:00-23:59).'),
    body('room')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Room cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('Room must be at most 50 characters.'),
    body('type').optional().isIn(SLOT_TYPES).withMessage('type must be LECTURE, LAB, TUTORIAL, LUNCH, or FREE.'),
];

const updateSlotValidator = [
    body('subjectId').optional().isUUID().withMessage('Valid subject ID required.'),
    body('facultyId').optional().isUUID().withMessage('Valid faculty ID required.'),
    body('day').optional().isIn(DAYS).withMessage('Day must be MONDAY..SUNDAY.'),
    body('startTime').optional().matches(TIME_REGEX).withMessage('startTime must be HH:MM.'),
    body('endTime').optional().matches(TIME_REGEX).withMessage('endTime must be HH:MM.'),
    body('room')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Room cannot be empty.')
        .isLength({ max: 50 })
        .withMessage('Room must be at most 50 characters.'),
    body('type').optional().isIn(SLOT_TYPES).withMessage('type must be LECTURE, LAB, TUTORIAL, LUNCH, or FREE.'),
];

const bulkUpdateValidator = [
    body('slots').isArray({ min: 1 }).withMessage('slots must be a non-empty array.'),
    body('slots.*.subjectId').isUUID().withMessage('Valid subject ID required for each slot.'),
    body('slots.*.facultyId').isUUID().withMessage('Valid faculty ID required for each slot.'),
    body('slots.*.day').isIn(DAYS).withMessage('Each slot day must be MONDAY..SUNDAY.'),
    body('slots.*.startTime').matches(TIME_REGEX).withMessage('Each slot startTime must be HH:MM.'),
    body('slots.*.endTime').matches(TIME_REGEX).withMessage('Each slot endTime must be HH:MM.'),
    body('slots.*.room')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Room must be at most 50 characters.'),
    body('slots.*.type').optional().isIn(SLOT_TYPES).withMessage('Each slot type must be LECTURE, LAB, TUTORIAL, LUNCH, or FREE.'),
];

const checkConflictsValidator = [
    body('batchId').isUUID().withMessage('Valid batch ID required.'),
    body('slots').isArray({ min: 1 }).withMessage('slots must be a non-empty array.'),
    body('slots.*.facultyId').isUUID().withMessage('Valid faculty ID required for each slot.'),
    body('slots.*.day').isIn(DAYS).withMessage('Each slot day must be MONDAY..SUNDAY.'),
    body('slots.*.startTime').matches(TIME_REGEX).withMessage('Each slot startTime must be HH:MM.'),
    body('slots.*.room').optional().trim().isLength({ max: 50 }).withMessage('Room must be at most 50 characters.'),
];

module.exports = {
    createSlotValidator,
    updateSlotValidator,
    bulkUpdateValidator,
    checkConflictsValidator,
};
