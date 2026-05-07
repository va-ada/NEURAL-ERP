const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');

const create = async (req, res, next) => {
    try {
        const { name, code, credits, semester, departmentId } = req.body;
        const subject = await prisma.subject.create({
            data: { name, code, credits, semester, departmentId },
        });
        await cacheInvalidate('subjects:*');
        res.status(201).json({ message: 'Subject created.', subject });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const { departmentId, semester } = req.query;
        const where = {};
        if (departmentId) where.departmentId = departmentId;
        if (semester) where.semester = parseInt(semester);

        const cacheKey = `subjects:all:${departmentId || ''}:${semester || ''}`;
        const subjects = await cacheGet(cacheKey, () =>
            prisma.subject.findMany({
                where,
                include: { department: { select: { name: true, code: true } } },
                orderBy: { name: 'asc' },
            })
        , 600);
        res.json({ subjects });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const subject = await prisma.subject.findUnique({
            where: { id: req.params.id },
            include: {
                department: { select: { name: true, code: true } },
                facultySubjects: { include: { faculty: { include: { user: { select: { name: true } } } }, batch: { select: { name: true } } } },
            },
        });
        if (!subject) throw new AppError('Subject not found.', 404);
        res.json({ subject });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, code, credits, semester } = req.body;
        const subject = await prisma.subject.update({
            where: { id: req.params.id },
            data: { name, code, credits, semester },
        });
        await cacheInvalidate('subjects:*');
        res.json({ message: 'Subject updated.', subject });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        await prisma.subject.delete({ where: { id: req.params.id } });
        await cacheInvalidate('subjects:*');
        res.json({ message: 'Subject deleted.' });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getAll, getById, update, remove };
