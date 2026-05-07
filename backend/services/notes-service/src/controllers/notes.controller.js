const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const getFolders = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const folders = await prisma.noteFolder.findMany({
            where: { studentId },
            include: { notes: { select: { id: true } } },
            orderBy: { updatedAt: 'desc' },
        });

        const result = folders.map(f => ({
            id: f.id,
            name: f.name,
            icon: f.icon,
            count: f.notes.length,
            updated: f.updatedAt,
        }));

        res.json({ folders: result });
    } catch (err) { next(err); }
};

const createFolder = async (req, res, next) => {
    try {
        const { studentId, name, icon } = req.body;
        const folder = await prisma.noteFolder.create({ data: { studentId, name, icon } });
        await auditLog(req.user?.id, 'CREATE', 'NoteFolder', folder.id);
        res.status(201).json({ message: 'Folder created.', folder });
    } catch (err) { next(err); }
};

const getNotes = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { folderId, subject } = req.query;
        const where = {};
        if (folderId) where.folderId = folderId;
        if (subject) where.subject = subject;

        // Only filter by student through folder ownership
        const folders = await prisma.noteFolder.findMany({ where: { studentId }, select: { id: true } });
        const folderIds = folders.map(f => f.id);
        where.folderId = folderId ? folderId : { in: folderIds };

        const notes = await prisma.note.findMany({
            where,
            include: { folder: { select: { name: true } } },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ notes, total: notes.length });
    } catch (err) { next(err); }
};

const getRecent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const folders = await prisma.noteFolder.findMany({ where: { studentId }, select: { id: true } });
        const folderIds = folders.map(f => f.id);

        const notes = await prisma.note.findMany({
            where: { folderId: { in: folderIds } },
            orderBy: { updatedAt: 'desc' },
            take: 5,
        });

        res.json({ notes });
    } catch (err) { next(err); }
};

const getBookmarked = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const folders = await prisma.noteFolder.findMany({ where: { studentId }, select: { id: true } });
        const folderIds = folders.map(f => f.id);

        const notes = await prisma.note.findMany({
            where: { folderId: { in: folderIds }, bookmarked: true },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ notes });
    } catch (err) { next(err); }
};

const getShared = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const shared = await prisma.sharedNote.findMany({
            where: { sharedWithId: studentId },
            include: { note: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            shared: shared.map(s => ({
                id: s.id,
                title: s.note.title,
                subject: s.note.subject,
                sharedBy: s.sharedByName,
                initial: s.sharedByInitial,
                color: s.sharedByColor,
                date: s.createdAt,
            })),
        });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { folderId, title, content, subject } = req.body;
        const note = await prisma.note.create({ data: { folderId, title, content, subject } });
        await auditLog(req.user?.id, 'CREATE', 'Note', note.id, { folderId, hasContent: !!content });
        res.status(201).json({ message: 'Note created.', note });
    } catch (err) { next(err); }
};

const toggleBookmark = async (req, res, next) => {
    try {
        const { id } = req.params;
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note) throw new AppError('Note not found.', 404);

        const updated = await prisma.note.update({
            where: { id },
            data: { bookmarked: !note.bookmarked },
        });
        await auditLog(req.user?.id, 'UPDATE', 'Note', updated.id, { bookmarked: updated.bookmarked });
        res.json({ message: 'Bookmark toggled.', bookmarked: updated.bookmarked });
    } catch (err) { next(err); }
};

const share = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sharedWithId, sharedByName, sharedByInitial, sharedByColor } = req.body;

        const shared = await prisma.sharedNote.create({
            data: {
                noteId: id,
                sharedById: req.user.id,
                sharedWithId,
                sharedByName,
                sharedByInitial,
                sharedByColor,
            },
        });
        const recipientCount = Array.isArray(sharedWithId) ? sharedWithId.length : (sharedWithId ? 1 : 0);
        await auditLog(req.user?.id, 'SHARE', 'Note', id, { sharedWith: recipientCount });
        res.status(201).json({ message: 'Note shared.', shared });
    } catch (err) { next(err); }
};

// ─── Smartboard Notes ────────────────────────────────────

const uploadSmartboardNote = async (req, res, next) => {
    try {
        if (!req.file) throw new AppError('No file uploaded.', 400);
        const { title, subject, batchId, uploadedBy } = req.body;
        if (!title || !subject || !uploadedBy) throw new AppError('title, subject, and uploadedBy are required.', 400);

        const fileUrl = `/api/notes/smartboard/uploads/${req.file.filename}`;
        const note = await prisma.smartboardNote.create({
            data: {
                title,
                subject,
                batchId: batchId || null,
                uploadedBy,
                fileName: req.file.originalname,
                fileUrl,
                fileSize: req.file.size,
            },
        });

        res.status(201).json({ message: 'Smartboard note uploaded.', note });
    } catch (err) { next(err); }
};

const getSmartboardNotes = async (req, res, next) => {
    try {
        const { batchId, subject } = req.query;
        const where = {};
        if (batchId) where.batchId = batchId;
        if (subject) where.subject = subject;

        const notes = await prisma.smartboardNote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({ notes });
    } catch (err) { next(err); }
};

// ─── Smartboard Note from QR URL ─────────────────────────

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const saveSmartboardNoteFromUrl = async (req, res, next) => {
    try {
        const { qrUrl, title, subject, batchId, uploadedBy } = req.body;
        if (!qrUrl || !title || !subject || !uploadedBy) {
            throw new AppError('qrUrl, title, subject, and uploadedBy are required.', 400);
        }

        // Validate URL
        let parsedUrl;
        try { parsedUrl = new URL(qrUrl); } catch {
            throw new AppError('Invalid QR URL.', 400);
        }

        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
        const destPath = path.join(uploadsDir, uniqueName);

        // Fetch PDF from QR URL and save to disk
        await new Promise((resolve, reject) => {
            const client = parsedUrl.protocol === 'https:' ? https : http;
            const fileStream = fs.createWriteStream(destPath);
            client.get(qrUrl, (response) => {
                // Follow redirects (up to 5)
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    fileStream.close();
                    fs.unlink(destPath, () => {});
                    // Re-call with redirected URL
                    saveSmartboardNoteFromUrl({ body: { qrUrl: response.headers.location, title, subject, batchId, uploadedBy } }, res, next);
                    resolve('redirect');
                    return;
                }
                if (response.statusCode !== 200) {
                    fileStream.close();
                    fs.unlink(destPath, () => {});
                    reject(new AppError(`Failed to fetch PDF from QR URL (status ${response.statusCode}).`, 502));
                    return;
                }
                response.pipe(fileStream);
                fileStream.on('finish', () => fileStream.close(resolve));
                fileStream.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
            }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
        });

        const stat = fs.statSync(destPath);
        const fileUrl = `/api/notes/smartboard/uploads/${uniqueName}`;
        const originalName = path.basename(parsedUrl.pathname) || `${title}.pdf`;

        const note = await prisma.smartboardNote.create({
            data: {
                title,
                subject,
                batchId: batchId || null,
                uploadedBy,
                fileName: originalName.endsWith('.pdf') ? originalName : `${originalName}.pdf`,
                fileUrl,
                fileSize: stat.size,
            },
        });

        res.status(201).json({ message: 'Smartboard note saved from QR.', note });
    } catch (err) { next(err); }
};

module.exports = { getFolders, createFolder, getNotes, getRecent, getBookmarked, getShared, create, toggleBookmark, share, uploadSmartboardNote, getSmartboardNotes, saveSmartboardNoteFromUrl };
