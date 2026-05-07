const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');

const getAll = async (req, res, next) => {
    try {
        const { batchId, subjectId, startDate, endDate } = req.query;
        const where = {};
        if (batchId) where.batchId = batchId;
        if (subjectId) where.subjectId = subjectId;
        if (startDate && endDate) {
            where.date = { gte: new Date(startDate), lte: new Date(endDate) };
        }

        const exams = await prisma.exam.findMany({
            where,
            include: {
                subject: { select: { name: true, code: true, shortName: true } },
                batch: { select: { name: true } },
            },
            orderBy: { date: 'asc' },
        });

        res.json({ exams, total: exams.length });
    } catch (err) {
        next(err);
    }
};

const getByBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const exams = await prisma.exam.findMany({
            where: { batchId },
            include: {
                subject: { select: { name: true, code: true, shortName: true } },
            },
            orderBy: { date: 'asc' },
        });

        res.json({ exams, total: exams.length });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { subjectId, batchId, type, date, startTime, endTime, room, maxMarks } = req.body;

        const exam = await prisma.exam.create({
            data: { subjectId, batchId, type, date: new Date(date), startTime, endTime, room, maxMarks },
        });

        res.status(201).json({ message: 'Exam created.', exam });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getByBatch, create };
