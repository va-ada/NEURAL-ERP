const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const getByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const fees = await prisma.fee.findMany({
            where: { studentId },
            include: { payments: true },
            orderBy: [{ semester: 'desc' }, { createdAt: 'desc' }],
        });
        res.json({ fees, total: fees.length });
    } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const fees = await prisma.fee.findMany({
            where: { studentId },
            include: { payments: true },
        });

        const totalFees = fees.reduce((s, f) => s + f.amount, 0);
        const totalPaid = fees.reduce((s, f) => s + f.payments.reduce((ps, p) => ps + p.amount, 0), 0);
        const pending = fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE');
        const overdue = fees.filter(f => f.status === 'OVERDUE');

        res.json({
            totalFees,
            totalPaid,
            balance: totalFees - totalPaid,
            pendingCount: pending.length,
            overdueCount: overdue.length,
            fees,
        });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { studentId, type, label, amount, semester, dueDate } = req.body;
        const fee = await prisma.fee.create({
            data: { studentId, type, label, amount, semester, dueDate: new Date(dueDate) },
        });
        await auditLog(req.user?.id, 'CREATE', 'Fee', fee.id, { studentId, amount, type });
        res.status(201).json({ message: 'Fee created.', fee });
    } catch (err) { next(err); }
};

const pay = async (req, res, next) => {
    try {
        const { feeId } = req.params;
        const { amount, method, transactionId } = req.body;

        const fee = await prisma.fee.findUnique({ where: { id: feeId }, include: { payments: true } });
        if (!fee) throw new AppError('Fee not found.', 404);

        const payment = await prisma.payment.create({
            data: { feeId, amount, method, transactionId },
        });
        await auditLog(req.user?.id, 'CREATE', 'Payment', payment.id, { feeId, amount, method });

        const totalPaid = fee.payments.reduce((s, p) => s + p.amount, 0) + amount;
        if (totalPaid >= fee.amount) {
            await prisma.fee.update({ where: { id: feeId }, data: { status: 'PAID' } });
            await auditLog(req.user?.id, 'UPDATE', 'Fee', feeId, { status: 'PAID' });
        }

        res.status(201).json({ message: 'Payment recorded.', payment });
    } catch (err) { next(err); }
};

module.exports = { getByStudent, getSummary, create, pay };
