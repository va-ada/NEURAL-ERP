const prisma = require('../../../../shared/utils/prisma');
const { cacheGet } = require('../../../../shared/utils/cache');

const getDashboard = async (req, res, next) => {
    try {
        const dashboard = await cacheGet('admin:dashboard', async () => {
            const [totalStudents, totalFaculty, departments, batches] = await Promise.all([
                prisma.student.count(),
                prisma.faculty.count(),
                prisma.department.findMany({ select: { name: true, code: true, students: { select: { id: true } } } }),
                prisma.batch.findMany({ select: { name: true, currentSemester: true } }),
            ]);

            // Department distribution
            const deptDistribution = {
                labels: departments.map(d => d.code),
                data: departments.map(d => d.students.length),
            };

            // Get top faculty by rating
            const topFaculty = await prisma.faculty.findMany({
                include: { user: { select: { name: true } }, department: { select: { code: true } } },
                orderBy: { rating: 'desc' },
                take: 5,
            });

            // Placement stats (from career applications)
            const offers = await prisma.careerApplication.count({ where: { status: 'Offer Received' } });
            const placementRate = totalStudents > 0 ? Math.round((offers / totalStudents) * 100) : 0;

            return {
                totalStudents,
                totalFaculty,
                placementRate,
                systemUptime: 99.9,
                deptDistribution,
                topFaculty: topFaculty.map(f => ({
                    name: f.user.name,
                    dept: f.department.code,
                    rating: f.rating,
                    designation: f.designation,
                })),
            };
        }, 120);

        res.json(dashboard);
    } catch (err) { next(err); }
};

const getAtRisk = async (req, res, next) => {
    try {
        // Students with low attendance or overdue assignments
        const students = await prisma.student.findMany({
            include: {
                user: { select: { name: true } },
                attendances: true,
                submissions: { include: { assignment: true } },
            },
        });

        const atRisk = [];
        for (const s of students) {
            const total = s.attendances.length;
            const present = s.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
            const pct = total > 0 ? (present / total) * 100 : 100;

            if (pct < 80) {
                atRisk.push({ id: s.id, name: s.user.name, issue: `Low Attendance — ${pct.toFixed(0)}% (below 80% threshold)` });
            }

            // Check overdue assignments
            const overdue = s.submissions.filter(sub => {
                return !sub.submittedAt && new Date() > sub.assignment.dueDate;
            });
            if (overdue.length > 2) {
                atRisk.push({ id: s.id, name: s.user.name, issue: `Multiple Overdue Assignments — ${overdue.length} pending` });
            }
        }

        res.json({ atRiskStudents: atRisk });
    } catch (err) { next(err); }
};

const getActivity = async (req, res, next) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const recent = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        res.json({ auditLogs: logs, recentActivity: recent });
    } catch (err) { next(err); }
};

const getStudentReport = async (req, res, next) => {
    try {
        const students = await prisma.student.findMany({
            include: {
                user: { select: { name: true, email: true } },
                department: { select: { name: true, code: true } },
                batch: { select: { name: true } },
                semesterResults: { orderBy: { semester: 'desc' }, take: 1 },
                attendances: true,
            },
        });

        const report = students.map(s => {
            const total = s.attendances.length;
            const present = s.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
            const latestResult = s.semesterResults[0];

            return {
                id: s.id,
                name: s.user.name,
                email: s.user.email,
                rollNumber: s.rollNumber,
                department: s.department.code,
                batch: s.batch.name,
                semester: s.semester,
                cgpa: latestResult?.cgpa || 'N/A',
                attendance: total > 0 ? `${((present / total) * 100).toFixed(1)}%` : 'N/A',
            };
        });

        res.json({ students: report, total: report.length });
    } catch (err) { next(err); }
};

const getAuditLog = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                include: { user: { select: { name: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
            }),
            prisma.auditLog.count(),
        ]);
        res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) { next(err); }
};

const createAuditLog = async (req, res, next) => {
    try {
        const { action, entity, entityId, details } = req.body;
        const log = await prisma.auditLog.create({
            data: { userId: req.user.id, action, entity, entityId, details },
        });
        res.status(201).json({ log });
    } catch (err) { next(err); }
};

module.exports = { getDashboard, getAtRisk, getActivity, getStudentReport, getAuditLog, createAuditLog };
