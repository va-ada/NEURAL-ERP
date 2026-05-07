const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const attendanceRoutes = require('./routes/attendance.routes');

const serviceName = 'attendance-service';
const port = process.env.ATTENDANCE_SERVICE_PORT || 3003;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/attendance', attendanceRoutes);
    },
});

startApp(app, { serviceName, port });
