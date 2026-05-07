const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const timetableRoutes = require('./routes/timetable.routes');

const serviceName = 'timetable-service';
const port = process.env.TIMETABLE_SERVICE_PORT || 3004;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/timetable', timetableRoutes);
    },
});

startApp(app, { serviceName, port });
