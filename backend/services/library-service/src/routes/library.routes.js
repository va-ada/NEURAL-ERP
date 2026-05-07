const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createBookValidator } = require('../validators/book.validators');
const { issueBookValidator, returnBookValidator } = require('../validators/issue.validators');
const ctrl = require('../controllers/library.controller');

router.get('/books', authenticate, ctrl.getBooks);
router.post('/books', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createBookValidator, validateRequest, ctrl.addBook);
router.post('/issue', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), issueBookValidator, validateRequest, ctrl.issueBook);
router.put('/return/:issueId', authenticate, returnBookValidator, validateRequest, ctrl.returnBook);
router.get('/issued/:studentId', authenticate, ctrl.getIssued);

module.exports = router;
