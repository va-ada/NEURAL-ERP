const { body } = require('express-validator');

const PROFICIENCY_VALUES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const addSkillValidator = [
    body('skills').isArray({ min: 1 }).withMessage('Skills must be a non-empty array.'),
    body('skills.*.name').trim().notEmpty().withMessage('Skill name is required.').isLength({ max: 500 }),
    body('skills.*.percentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100.'),
    body('skills.*.level').isString().notEmpty().withMessage('Level is required.'),
    body('skills.*.proficiency').optional().isIn(PROFICIENCY_VALUES).withMessage(`Proficiency must be one of: ${PROFICIENCY_VALUES.join(', ')}.`),
];

const updateSkillValidator = [
    body('skills').optional().isArray().withMessage('Skills must be an array.'),
    body('skills.*.name').optional().trim().notEmpty().isLength({ max: 500 }),
    body('skills.*.percentage').optional().isInt({ min: 0, max: 100 }),
    body('skills.*.level').optional().isString().notEmpty(),
    body('skills.*.proficiency').optional().isIn(PROFICIENCY_VALUES).withMessage(`Proficiency must be one of: ${PROFICIENCY_VALUES.join(', ')}.`),
];

module.exports = { addSkillValidator, updateSkillValidator };
