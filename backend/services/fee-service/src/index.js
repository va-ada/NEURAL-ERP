const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const feeRoutes = require('./routes/fee.routes');

const serviceName = 'fee-service';
const port = process.env.FEE_SERVICE_PORT || 3009;

const app = createApp({
    serviceName,
    port,
    registerRoutes: (app) => {
        app.use('/api/fees', feeRoutes);
    },
});

startApp(app, { serviceName, port });
