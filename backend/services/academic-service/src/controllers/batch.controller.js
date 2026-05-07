const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');

const create = async (req, res, next) => {
    try {
        const { name, year, currentSemester, departmentId } = req.body;
        const institutionId = req.user.institutionId;
        const batch = await prisma.batch.create({
            data: { name, year, currentSemester, departmentId, institutionId },
        });
        await cacheInvalidate('batches:*');
        res.status(201).json({ message: 'Batch created.', batch });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const { departmentId } = req.query;
        const where = { institutionId: req.user.institutionId };
        if (departmentId) where.departmentId = departmentId;

        const instId = req.user.institutionId;
        const cacheKey = `batches:all:${instId}:${departmentId || ''}`;
        const batches = await cacheGet(cacheKey, () =>
            prisma.batch.findMany({
                where,
                include: {
                    department: { select: { name: true, code: true } },
                    _count: { select: { students: true } },
                },
                orderBy: { year: 'desc' },
            })
        , 600);
        res.json({ batches });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const batch = await prisma.batch.findUnique({
            where: { id: req.params.id },
            include: {
                department: { select: { name: true, code: true } },
                students: { include: { user: { select: { name: true, email: true } } } },
                _count: { select: { students: true } },
            },
        });
        if (!batch) throw new AppError('Batch not found.', 404);
        res.json({ batch });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, year, currentSemester } = req.body;
        const batch = await prisma.batch.update({
            where: { id: req.params.id },
            data: { name, year, currentSemester },
        });
        await cacheInvalidate('batches:*');
        res.json({ message: 'Batch updated.', batch });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        await prisma.batch.delete({ where: { id: req.params.id } });
        await cacheInvalidate('batches:*');
        res.json({ message: 'Batch deleted.' });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getAll, getById, update, remove };
