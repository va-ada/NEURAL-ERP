const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticate } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createFolderValidator } = require('../validators/folder.validators');
const { createNoteValidator } = require('../validators/note.validators');
const { shareNoteValidator } = require('../validators/share.validators');
const ctrl = require('../controllers/notes.controller');

// ─── Multer setup for smartboard PDF uploads ─────────────
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed.'));
    },
});

// ─── Smartboard Notes (must be before /:studentId param routes) ──
router.post('/smartboard', authenticate, upload.single('pdf'), ctrl.uploadSmartboardNote);
router.post('/smartboard/from-url', authenticate, ctrl.saveSmartboardNoteFromUrl);
router.get('/smartboard', authenticate, ctrl.getSmartboardNotes);

// ─── Regular Notes ───────────────────────────────────────
router.get('/folders/:studentId', authenticate, ctrl.getFolders);
router.post('/folders', authenticate, createFolderValidator, validateRequest, ctrl.createFolder);
router.get('/:studentId', authenticate, ctrl.getNotes);
router.get('/:studentId/recent', authenticate, ctrl.getRecent);
router.get('/:studentId/bookmarked', authenticate, ctrl.getBookmarked);
router.get('/:studentId/shared', authenticate, ctrl.getShared);
router.post('/', authenticate, createNoteValidator, validateRequest, ctrl.create);
router.put('/:id/bookmark', authenticate, ctrl.toggleBookmark);
router.post('/:id/share', authenticate, shareNoteValidator, validateRequest, ctrl.share);

module.exports = router;
