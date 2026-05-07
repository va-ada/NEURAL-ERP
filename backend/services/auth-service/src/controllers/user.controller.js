const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');

// ─── Get Current User ──────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, email: true, name: true, role: true, institutionId: true,
                isActive: true, createdAt: true, updatedAt: true,
                student: { include: { department: true, batch: true } },
                faculty: { include: { department: true } },
            },
        });
        if (!user) throw new AppError('User not found.', 404);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// ─── Update Current User ───────────────────────────────
const updateMe = async (req, res, next) => {
    try {
        const { name } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name },
            select: { id: true, email: true, name: true, role: true, institutionId: true },
        });
        res.json({ message: 'Profile updated.', user });
    } catch (err) {
        next(err);
    }
};

// ─── Get User by ID (Admin) ────────────────────────────
const getUserById = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, email: true, name: true, role: true, institutionId: true,
                isActive: true, createdAt: true,
                student: { include: { department: true, batch: true } },
                faculty: { include: { department: true } },
            },
        });
        if (!user) throw new AppError('User not found.', 404);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// ─── List Users (Admin) ────────────────────────────────
const listUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        const where = { institutionId: req.user.institutionId };

        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
                skip: (page - 1) * limit,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        next(err);
    }
};

// ─── Toggle User Active Status (Admin) ─────────────────
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) throw new AppError('User not found.', 404);

        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive },
            select: { id: true, email: true, name: true, isActive: true },
        });

        res.json({ message: `User ${updated.isActive ? 'activated' : 'deactivated'}.`, user: updated });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMe, updateMe, getUserById, listUsers, toggleUserStatus };
