const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

// ─── Mark Attendance (Bulk — for a batch + subject) ────
const markAttendance = async (req, res, next) => {
    try {
        const { subjectId, batchId, date, records } = req.body;
        // records = [{ studentId, status, remarks? }]

        // Get faculty profile from authenticated user
        const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
        if (!faculty) throw new AppError('Faculty profile not found.', 403);

        const attendanceDate = new Date(date);

        // Upsert each record (create or update if already marked)
        const results = await prisma.$transaction(
            records.map((r) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_subjectId_date: {
                            studentId: r.studentId,
                            subjectId,
                            date: attendanceDate,
                        },
                    },
                    update: { status: r.status, remarks: r.remarks || null, facultyId: faculty.id },
                    create: {
                        studentId: r.studentId,
                        subjectId,
                        facultyId: faculty.id,
                        batchId,
                        date: attendanceDate,
                        status: r.status,
                        remarks: r.remarks || null,
                    },
                })
            )
        );

        await auditLog(req.user.id, 'CREATE', 'Attendance', batchId, `Attendance marked for ${results.length} students`);
        res.status(201).json({ message: `Attendance marked for ${results.length} students.`, count: results.length });
    } catch (err) {
        next(err);
    }
};

// ─── Get Attendance by Batch + Subject + Date ──────────
const getByBatch = async (req, res, next) => {
    try {
        const { batchId, subjectId, date, startDate, endDate } = req.query;

        const where = {};
        if (batchId) where.batchId = batchId;
        if (subjectId) where.subjectId = subjectId;

        if (date) {
            where.date = new Date(date);
        } else if (startDate && endDate) {
            where.date = { gte: new Date(startDate), lte: new Date(endDate) };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                student: { include: { user: { select: { name: true } } } },
                subject: { select: { name: true, code: true } },
                faculty: { include: { user: { select: { name: true } } } },
            },
            orderBy: [{ date: 'desc' }, { student: { rollNumber: 'asc' } }],
        });

        res.json({ attendance: records, total: records.length });
    } catch (err) {
        next(err);
    }
};

// ─── Get Attendance by Student ─────────────────────────
const getByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { subjectId, startDate, endDate } = req.query;

        const where = { studentId };
        if (subjectId) where.subjectId = subjectId;
        if (startDate && endDate) {
            where.date = { gte: new Date(startDate), lte: new Date(endDate) };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                subject: { select: { name: true, code: true } },
            },
            orderBy: { date: 'desc' },
        });

        res.json({ attendance: records, total: records.length });
    } catch (err) {
        next(err);
    }
};

// ─── Attendance Stats ──────────────────────────────────
const getStats = async (req, res, next) => {
    try {
        const { studentId, subjectId, batchId, startDate, endDate } = req.query;

        const where = {};
        if (studentId) where.studentId = studentId;
        if (subjectId) where.subjectId = subjectId;
        if (batchId) where.batchId = batchId;
        if (startDate && endDate) {
            where.date = { gte: new Date(startDate), lte: new Date(endDate) };
        }

        const [total, present, absent, late, excused] = await Promise.all([
            prisma.attendance.count({ where }),
            prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
            prisma.attendance.count({ where: { ...where, status: 'EXCUSED' } }),
        ]);

        const percentage = total > 0 ? ((present + late + excused) / total * 100).toFixed(2) : 0;

        res.json({
            stats: { total, present, absent, late, excused, percentage: parseFloat(percentage) },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { markAttendance, getByBatch, getByStudent, getStats };
