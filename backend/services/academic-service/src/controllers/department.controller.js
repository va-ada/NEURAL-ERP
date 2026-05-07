const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');

const create = async (req, res, next) => {
    try {
        const { name, code, hodId } = req.body;
        const institutionId = req.user.institutionId;

        const dept = await prisma.department.create({
            data: { name, code, institutionId, hodId },
            include: { hod: { include: { user: { select: { name: true, email: true } } } } },
        });
        await cacheInvalidate('departments:*');
        res.status(201).json({ message: 'Department created.', department: dept });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const instId = req.user.institutionId;
        const departments = await cacheGet(`departments:all:${instId}`, () =>
            prisma.department.findMany({
                where: { institutionId: instId },
                include: {
                    hod: { include: { user: { select: { name: true, email: true } } } },
                    _count: { select: { students: true, faculty: true, subjects: true } },
                },
                orderBy: { name: 'asc' },
            })
        , 600);
        res.json({ departments });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const dept = await prisma.department.findUnique({
            where: { id: req.params.id },
            include: {
                hod: { include: { user: { select: { name: true, email: true } } } },
                subjects: true,
                batches: true,
                _count: { select: { students: true, faculty: true } },
            },
        });
        if (!dept) throw new AppError('Department not found.', 404);
        res.json({ department: dept });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, code, hodId } = req.body;
        const dept = await prisma.department.update({
            where: { id: req.params.id },
            data: { name, code, hodId },
        });
        await cacheInvalidate('departments:*');
        res.json({ message: 'Department updated.', department: dept });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        await prisma.department.delete({ where: { id: req.params.id } });
        await cacheInvalidate('departments:*');
        res.json({ message: 'Department deleted.' });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getAll, getById, update, remove };
