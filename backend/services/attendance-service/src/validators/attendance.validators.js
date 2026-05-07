const { body } = require('express-validator');

const markAttendanceValidator = [
    body('subjectId').isUUID().withMessage('Valid subject ID required.'),
    body('batchId').isUUID().withMessage('Valid batch ID required.'),
    body('date').isISO8601().withMessage('Valid ISO 8601 date required.'),
    body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array.'),
    body('records.*.studentId').isUUID().withMessage('Valid student ID required for each record.'),
    body('records.*.status')
        .isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
        .withMessage('Status must be PRESENT, ABSENT, LATE, or EXCUSED.'),
];

module.exports = { markAttendanceValidator };
