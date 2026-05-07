const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Creates an Express middleware that logs every request with timing info.
 * @param {string} serviceName - Name of the microservice (e.g. 'auth-service')
 */
function requestLogger(serviceName) {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info({
                service: serviceName,
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
            });
        });
        next();
    };
}

module.exports = { logger, requestLogger };