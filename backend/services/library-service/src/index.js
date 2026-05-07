const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const libraryRoutes = require('./routes/library.routes');

const serviceName = 'library-service';
const port = process.env.LIBRARY_SERVICE_PORT || 3010;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/library', libraryRoutes);
    },
});

startApp(app, { serviceName, port });
