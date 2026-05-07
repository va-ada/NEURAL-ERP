const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

const getByUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const unread = notifications.filter(n => !n.read).length;
        res.json({ notifications, total: notifications.length, unread });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { userId, icon, type, text } = req.body;
        const notification = await prisma.notification.create({
            data: { userId, icon, type, text },
        });
        await auditLog(req.user?.id, 'CREATE', 'Notification', notification.id, { recipientId: userId, type });
        res.status(201).json({ message: 'Notification created.', notification });
    } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({ where: { id }, data: { read: true } });
        res.json({ message: 'Marked as read.' });
    } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
    try {
        const { userId } = req.params;
        await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
        await auditLog(req.user?.id, 'UPDATE', 'Notification', null, { userId, action: 'mark_all_read' });
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) { next(err); }
};

module.exports = { getByUser, create, markRead, markAllRead };
