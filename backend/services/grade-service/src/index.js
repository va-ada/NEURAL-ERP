const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const gradeRoutes = require('./routes/grade.routes');
const examRoutes = require('./routes/exam.routes');

const serviceName = 'grade-service';
const port = process.env.GRADE_SERVICE_PORT || 3006;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/grades', gradeRoutes);
        app.use('/api/exams', examRoutes);
    },
});

startApp(app, { serviceName, port });
