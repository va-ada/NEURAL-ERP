const path = require('path');
const express = require('express');
const { createApp, startApp } = require('../../../shared/bootstrap/createApp');

const notesRoutes = require('./routes/notes.routes');

const serviceName = 'notes-service';
const port = process.env.NOTES_SERVICE_PORT || 3008;

const app = createApp({
    serviceName,
    port,
    beforeRoutes: (app) => {
        // Serve uploaded smartboard PDFs as static files
        app.use(
            '/api/notes/smartboard/uploads',
            express.static(path.join(__dirname, '../uploads'))
        );
    },
    registerRoutes: (app) => {
        app.use('/api/notes', notesRoutes);
    },
});

startApp(app, { serviceName, port });
