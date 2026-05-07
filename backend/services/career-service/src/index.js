const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const careerRoutes = require('./routes/career.routes');

const serviceName = 'career-service';
const port = process.env.CAREER_SERVICE_PORT || 3007;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/career', careerRoutes);
    },
});

startApp(app, { serviceName, port });
