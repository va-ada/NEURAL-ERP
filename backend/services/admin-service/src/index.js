const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const settingsRoutes = require('./routes/settings.routes');
const predictionsRoutes = require('./routes/predictions.routes');

const serviceName = 'admin-service';
const port = process.env.ADMIN_SERVICE_PORT || 3013;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/admin', adminRoutes);
        app.use('/api/admin/analytics', analyticsRoutes);
        app.use('/api/admin/settings', settingsRoutes);
        app.use('/api/admin/predictions', predictionsRoutes);
    },
});

startApp(app, { serviceName, port });
