const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const forumRoutes = require('./routes/forum.routes');

const serviceName = 'forum-service';
const port = process.env.FORUM_SERVICE_PORT || 3011;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/forum', forumRoutes);
    },
});

startApp(app, { serviceName, port });
