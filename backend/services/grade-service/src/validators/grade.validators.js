const { body } = require('express-validator');

const createGradeValidator = [
    body('studentId').isUUID().withMessage('Valid student ID required.'),
    body('subjectId').isUUID().withMessage('Valid subject ID required.'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be an integer between 1 and 8.'),
    body('grade')
        .isIn(['A+', 'A', 'B+', 'B', 'C', 'D', 'F'])
        .withMessage('Grade must be one of A+, A, B+, B, C, D, F.'),
    body('points').isInt({ min: 0, max: 10 }).withMessage('Points must be an integer between 0 and 10.'),
    body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be an integer between 1 and 6.'),
];

module.exports = { createGradeValidator };
