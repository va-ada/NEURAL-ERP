const prisma = require('../../../../shared/utils/prisma');
const { uploadToS3 } = require('../../../../shared/utils/s3');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');
const auditLog = require('../../../../shared/utils/auditLog');

// ─── Create Assignment (Faculty) ───────────────────────
const createAssignment = async (req, res, next) => {
    try {
        const { title, description, subjectId, batchId, dueDate, maxMarks } = req.body;
        let fileUrl = null;

        if (req.file) {
            const ext = req.file.originalname.split('.').pop();
            const key = `assignments/${batchId}/${Date.now()}.${ext}`;
            const upload = await uploadToS3(req.file, key);
            fileUrl = upload.Location;
        }

        const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
        if (!faculty) throw new AppError('Faculty profile not found.', 403);

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                subjectId,
                facultyId: faculty.id,
                batchId,
                dueDate: new Date(dueDate),
                maxMarks: parseInt(maxMarks || 100),
                fileUrl,
                status: 'PUBLISHED',
            },
        });

        if (batchId) await cacheInvalidate(`assignments:batch:${batchId}:*`);
        await cacheInvalidate('assignments:*');
        await auditLog(req.user?.id, 'CREATE', 'Assignment', assignment.id, { subjectId, batchId, dueDate });
        res.status(201).json({ message: 'Assignment created.', assignment });
    } catch (err) {
        next(err);
    }
};

// ─── Get Assignments by Batch ──────────────────────────
const getAssignments = async (req, res, next) => {
    try {
        const { batchId } = req.query;
        const where = {};
        if (batchId) where.batchId = batchId;

        const fetchAssignments = () => prisma.assignment.findMany({
            where,
            include: {
                subject: { select: { name: true, code: true } },
                faculty: { include: { user: { select: { name: true } } } },
                _count: { select: { submissions: true } },
            },
            orderBy: { dueDate: 'asc' },
        });

        const assignments = batchId
            ? await cacheGet(`assignments:batch:${batchId}`, fetchAssignments, 300)
            : await fetchAssignments();

        res.json({ assignments });
    } catch (err) {
        next(err);
    }
};

// ─── Submit Assignment (Student) ───────────────────────
const submitAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const { remarks } = req.body;

        if (!req.file) throw new AppError('Submission file is required.', 400);

        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!student) throw new AppError('Student profile not found.', 403);

        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) throw new AppError('Assignment not found.', 404);

        if (new Date() > new Date(assignment.dueDate)) {
            throw new AppError('Deadline has passed.', 400);
        }

        // Check if already submitted
        const existing = await prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
        });
        if (existing) throw new AppError('You have already submitted this assignment.', 400);

        // Upload to S3
        const ext = req.file.originalname.split('.').pop();
        const key = `submissions/${assignmentId}/${student.id}-${Date.now()}.${ext}`;
        const upload = await uploadToS3(req.file, key);

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: student.id,
                fileUrl: upload.Location,
                remarks,
            },
            include: { student: { include: { user: { select: { name: true } } } } },
        });

        if (assignment.batchId) await cacheInvalidate(`assignments:batch:${assignment.batchId}:*`);
        await cacheInvalidate('assignments:*');
        await auditLog(req.user?.id, 'CREATE', 'Submission', submission.id, { assignmentId, studentId: student.id });
        res.status(201).json({ message: 'Assignment submitted successfully.', submission });
    } catch (err) {
        next(err);
    }
};

// ─── Grade Submission (Faculty) ────────────────────────
const gradeSubmission = async (req, res, next) => {
    try {
        const { marks, feedback } = req.body;

        const submission = await prisma.submission.update({
            where: { id: req.params.submissionId },
            data: { marks: parseInt(marks), feedback, gradedAt: new Date() },
            include: { student: { include: { user: { select: { name: true, email: true } } } } },
        });

        await cacheInvalidate('assignments:*');
        await auditLog(req.user?.id, 'GRADE', 'Submission', submission.id, { marks, feedback: !!feedback });
        res.json({ message: 'Submission graded.', submission });
    } catch (err) {
        next(err);
    }
};

// ─── List Submissions for an Assignment ────────────────
const getSubmissions = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;

        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
            include: {
                student: { include: { user: { select: { name: true, email: true } } } },
            },
            orderBy: { submittedAt: 'desc' },
        });

        res.json({ submissions });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    submitAssignment,
    gradeSubmission,
    getSubmissions,
};
