const { createLogger, format, transports } = require('winston');

// Dedicated logger for critical 5xx errors
const criticalLogger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: 'logs/errors-critical.log',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Middleware that intercepts 5xx responses and logs them as critical alerts.
 * Optionally sends error details to a webhook URL if ERROR_WEBHOOK_URL is set.
 */
function errorAlertMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      const errorDetails = {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        message: res.statusMessage || 'Internal Server Error',
        timestamp: new Date().toISOString(),
      };

      criticalLogger.error('Critical server error', errorDetails);

      const webhookUrl = process.env.ERROR_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorDetails),
          }).catch(() => {
            // Silently ignore webhook delivery failures
          });
        } catch {
          // Silently ignore webhook call failures
        }
      }
    }
  });

  next();
}

module.exports = { errorAlertMiddleware };
