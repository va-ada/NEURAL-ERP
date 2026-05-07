const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const notificationRoutes = require('./routes/notification.routes');
const announcementRoutes = require('./routes/announcement.routes');

const serviceName = 'notification-service';
const port = process.env.NOTIFICATION_SERVICE_PORT || 3012;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/notifications', notificationRoutes);
        app.use('/api/announcements', announcementRoutes);
    },
});

startApp(app, { serviceName, port });
