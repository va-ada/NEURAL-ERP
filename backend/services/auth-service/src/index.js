const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const serviceName = 'auth-service';
const port = process.env.AUTH_SERVICE_PORT || 3001;

const app = createApp({
    serviceName,
    port,
    requiredEnv: ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'],
    registerRoutes: (app) => {
        app.use('/api/auth', authRoutes);
        app.use('/api/users', userRoutes);
    },
});

startApp(app, { serviceName, port });
