const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const departmentRoutes = require('./routes/department.routes');
const subjectRoutes = require('./routes/subject.routes');
const batchRoutes = require('./routes/batch.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');

const serviceName = 'academic-service';
const port = process.env.ACADEMIC_SERVICE_PORT || 3002;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/departments', departmentRoutes);
        app.use('/api/subjects', subjectRoutes);
        app.use('/api/batches', batchRoutes);
        app.use('/api/students', studentRoutes);
        app.use('/api/faculty', facultyRoutes);
    },
});

startApp(app, { serviceName, port });
