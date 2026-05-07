const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const assignmentRoutes = require('./routes/assignment.routes');

const serviceName = 'assignment-service';
const port = process.env.ASSIGNMENT_SERVICE_PORT || 3005;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/assignments', assignmentRoutes);
    },
});

startApp(app, { serviceName, port });
