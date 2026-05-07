const bcrypt = require('bcryptjs');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');
const auditLog = require('../../../../shared/utils/auditLog');

const create = async (req, res, next) => {
    try {
        const { email, name, password, rollNumber, phone, semester, departmentId, batchId } = req.body;
        const institutionId = req.user.institutionId;

        // Create user + student profile in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const hashedPassword = await bcrypt.hash(password || 'Student@123', 12);

            const user = await tx.user.create({
                data: { email, name, password: hashedPassword, role: 'STUDENT', institutionId },
            });

            const student = await tx.student.create({
                data: { userId: user.id, rollNumber, phone, semester, departmentId, batchId },
                include: { user: { select: { id: true, email: true, name: true } }, department: true, batch: true },
            });

            return student;
        });

        await cacheInvalidate('students:*');
        res.status(201).json({ message: 'Student created.', student: result });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const { departmentId, batchId, page = 1, limit = 20, search } = req.query;
        const where = {};
        if (departmentId) where.departmentId = departmentId;
        if (batchId) where.batchId = batchId;
        if (search) {
            where.OR = [
                { rollNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const cacheKey = `students:all:${departmentId || ''}:${batchId || ''}:${search || ''}:${page}:${limit}`;
        const result = await cacheGet(cacheKey, async () => {
            const [students, total] = await Promise.all([
                prisma.student.findMany({
                    where,
                    include: {
                        user: { select: { id: true, email: true, name: true, isActive: true } },
                        department: { select: { name: true, code: true } },
                        batch: { select: { name: true, year: true } },
                    },
                    skip: (parseInt(page) - 1) * parseInt(limit),
                    take: parseInt(limit),
                    orderBy: { rollNumber: 'asc' },
                }),
                prisma.student.count({ where }),
            ]);
            return { students, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
        }, 600);

        res.json(result);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
                department: true,
                batch: true,
            },
        });
        if (!student) throw new AppError('Student not found.', 404);
        res.json({ student });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { rollNumber, phone, semester, departmentId, batchId, name } = req.body;

        const student = await prisma.student.findUnique({ where: { id: req.params.id } });
        if (!student) throw new AppError('Student not found.', 404);

        await prisma.$transaction(async (tx) => {
            if (name) {
                await tx.user.update({ where: { id: student.userId }, data: { name } });
            }
            await tx.student.update({
                where: { id: req.params.id },
                data: { rollNumber, phone, semester, departmentId, batchId },
            });
        });

        const updated = await prisma.student.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { name: true, email: true } }, department: true, batch: true },
        });

        await cacheInvalidate('students:*');
        res.json({ message: 'Student updated.', student: updated });
    } catch (err) {
        next(err);
    }
};

const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { phone, section, semester, avatarInitial, avatarColor } = req.body;
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (section !== undefined) updateData.section = section;
        if (semester !== undefined) updateData.semester = semester;
        if (avatarInitial !== undefined) updateData.avatarInitial = avatarInitial;
        if (avatarColor !== undefined) updateData.avatarColor = avatarColor;

        const student = await prisma.student.update({
            where: { id },
            data: updateData,
            include: { user: { select: { name: true, email: true } }, department: true, batch: true },
        });
        await cacheInvalidate('students:*');
        await auditLog(req.user.id, 'UPDATE', 'Student', id, 'Student profile updated');
        res.json({ message: 'Student updated.', student });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({ where: { id: req.params.id } });
        if (!student) throw new AppError('Student not found.', 404);

        await prisma.$transaction(async (tx) => {
            await tx.student.delete({ where: { id: req.params.id } });
            await tx.user.delete({ where: { id: student.userId } });
        });

        await cacheInvalidate('students:*');
        res.json({ message: 'Student deleted.' });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getAll, getById, update, updateStudent, remove };
