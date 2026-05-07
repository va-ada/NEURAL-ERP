const { body } = require('express-validator');

const shareNoteValidator = [
    body('sharedWithId').optional().isUUID().withMessage('Valid recipient student ID required.'),
    body('sharedWith')
        .optional()
        .isArray()
        .withMessage('sharedWith must be an array.'),
    body('sharedWith.*').optional().isUUID().withMessage('Each sharedWith entry must be a valid UUID.'),
    body('sharedByName').optional().isString().withMessage('sharedByName must be a string.'),
    body('sharedByInitial').optional().isString().withMessage('sharedByInitial must be a string.'),
    body('sharedByColor').optional().isString().withMessage('sharedByColor must be a string.'),
];

module.exports = { shareNoteValidator };
