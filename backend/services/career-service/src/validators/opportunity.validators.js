const { body } = require('express-validator');

// Career opportunity `type` is a free-form string in the current Prisma schema
// (existing seed uses "Internship", "Full Time" etc.). Validation kept permissive
// here; ROADMAP item: migrate to a proper Prisma enum so this can be tightened.
const createOpportunityValidator = [
    body('company').trim().notEmpty().withMessage('Company is required.').isLength({ max: 500 }).withMessage('Company must be 500 chars or fewer.'),
    body('role').trim().notEmpty().withMessage('Role is required.').isLength({ max: 500 }).withMessage('Role must be 500 chars or fewer.'),
    body('location').trim().notEmpty().withMessage('Location is required.').isLength({ max: 500 }).withMessage('Location must be 500 chars or fewer.'),
    body('type').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('Type is required.'),
    body('deadline').isISO8601().withMessage('Valid ISO 8601 deadline required.'),
    body('initial').optional().isString().isLength({ max: 5 }).withMessage('Initial must be a short string.'),
    body('color').optional().isString().isLength({ max: 50 }).withMessage('Color must be a short string.'),
    body('matchScore').optional().isInt({ min: 0, max: 100 }).withMessage('Match score must be 0-100.'),
    body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number.'),
    body('stipend').optional().isFloat({ min: 0 }).withMessage('Stipend must be a positive number.'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be 500 chars or fewer.'),
    body('applicationDeadline').optional().isISO8601().withMessage('Valid ISO 8601 application deadline required.'),
    body('requiredSkills').optional().isArray().withMessage('requiredSkills must be an array.'),
];

const updateOpportunityValidator = [
    body('company').optional().trim().notEmpty().withMessage('Company cannot be empty.').isLength({ max: 500 }),
    body('role').optional().trim().notEmpty().withMessage('Role cannot be empty.').isLength({ max: 500 }),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty.').isLength({ max: 500 }),
    body('type').optional().isString().trim().notEmpty().isLength({ max: 100 }),
    body('deadline').optional().isISO8601().withMessage('Valid ISO 8601 deadline required.'),
    body('initial').optional().isString().isLength({ max: 5 }),
    body('color').optional().isString().isLength({ max: 50 }),
    body('matchScore').optional().isInt({ min: 0, max: 100 }),
    body('salary').optional().isFloat({ min: 0 }),
    body('stipend').optional().isFloat({ min: 0 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('applicationDeadline').optional().isISO8601(),
    body('requiredSkills').optional().isArray(),
];

module.exports = { createOpportunityValidator, updateOpportunityValidator };
