const bcrypt = require('bcryptjs');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const create = async (req, res, next) => {
    try {
        const { email, name, password, employeeId, phone, designation, departmentId } = req.body;
        const institutionId = req.user.institutionId;

        const result = await prisma.$transaction(async (tx) => {
            const hashedPassword = await bcrypt.hash(password || 'Faculty@123', 12);

            const user = await tx.user.create({
                data: { email, name, password: hashedPassword, role: 'FACULTY', institutionId },
            });

            const faculty = await tx.faculty.create({
                data: { userId: user.id, employeeId, phone, designation, departmentId },
                include: { user: { select: { id: true, email: true, name: true } }, department: true },
            });

            return faculty;
        });

        await auditLog(req.user.id, 'CREATE', 'Faculty', result.id, 'Faculty created');
        res.status(201).json({ message: 'Faculty created.', faculty: result });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const { departmentId, page = 1, limit = 20, search } = req.query;
        const where = {};
        if (departmentId) where.departmentId = departmentId;
        if (search) {
            where.OR = [
                { employeeId: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [facultyList, total] = await Promise.all([
            prisma.faculty.findMany({
                where,
                include: {
                    user: { select: { id: true, email: true, name: true, isActive: true } },
                    department: { select: { name: true, code: true } },
                },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { employeeId: 'asc' },
            }),
            prisma.faculty.count({ where }),
        ]);

        res.json({ faculty: facultyList, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const faculty = await prisma.faculty.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
                department: true,
                facultySubjects: { include: { subject: true, batch: true } },
            },
        });
        if (!faculty) throw new AppError('Faculty not found.', 404);
        res.json({ faculty });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { employeeId, phone, designation, departmentId, name } = req.body;

        const faculty = await prisma.faculty.findUnique({ where: { id: req.params.id } });
        if (!faculty) throw new AppError('Faculty not found.', 404);

        await prisma.$transaction(async (tx) => {
            if (name) {
                await tx.user.update({ where: { id: faculty.userId }, data: { name } });
            }
            await tx.faculty.update({
                where: { id: req.params.id },
                data: { employeeId, phone, designation, departmentId },
            });
        });

        const updated = await prisma.faculty.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { name: true, email: true } }, department: true },
        });

        await auditLog(req.user.id, 'UPDATE', 'Faculty', req.params.id, 'Faculty updated');
        res.json({ message: 'Faculty updated.', faculty: updated });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const faculty = await prisma.faculty.findUnique({ where: { id: req.params.id } });
        if (!faculty) throw new AppError('Faculty not found.', 404);

        await prisma.$transaction(async (tx) => {
            await tx.faculty.delete({ where: { id: req.params.id } });
            await tx.user.delete({ where: { id: faculty.userId } });
        });

        await auditLog(req.user.id, 'DELETE', 'Faculty', req.params.id, 'Faculty deleted');
        res.json({ message: 'Faculty deleted.' });
    } catch (err) {
        next(err);
    }
};

// ─── Assign Subject to Faculty ─────────────────────────
const assignSubject = async (req, res, next) => {
    try {
        const { subjectId, batchId } = req.body;
        const facultyId = req.params.id;

        const assignment = await prisma.facultySubject.create({
            data: { facultyId, subjectId, batchId },
            include: { subject: true, batch: true },
        });

        await auditLog(req.user.id, 'CREATE', 'FacultySubject', assignment.id, 'Subject assigned to faculty');
        res.status(201).json({ message: 'Subject assigned to faculty.', assignment });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getAll, getById, update, remove, assignSubject };
