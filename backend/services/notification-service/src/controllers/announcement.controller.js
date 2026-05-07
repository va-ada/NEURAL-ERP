const prisma = require('../../../../shared/utils/prisma');

const getAll = async (req, res, next) => {
    try {
        const announcements = await prisma.announcement.findMany({
            include: { author: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ announcements, total: announcements.length });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { title, content, priority } = req.body;
        const announcement = await prisma.announcement.create({
            data: { title, content, priority, createdBy: req.user.id },
        });
        res.status(201).json({ message: 'Announcement created.', announcement });
    } catch (err) { next(err); }
};

module.exports = { getAll, create };
