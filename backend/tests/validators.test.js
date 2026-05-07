describe('Shared Utilities', () => {
    it('should export auditLog function', () => {
        const auditLog = require('../shared/utils/auditLog');
        expect(typeof auditLog).toBe('function');
    });

    it('should export cache utilities', () => {
        const { cacheGet, cacheInvalidate } = require('../shared/utils/cache');
        expect(typeof cacheGet).toBe('function');
        expect(typeof cacheInvalidate).toBe('function');
    });

    it('should export auth middleware', () => {
        const { authenticate, authorize } = require('../shared/middleware/auth.middleware');
        expect(typeof authenticate).toBe('function');
        expect(typeof authorize).toBe('function');
    });

    it('should export error handler', () => {
        const { errorHandler, AppError } = require('../shared/middleware/errorHandler');
        expect(typeof errorHandler).toBe('function');
        expect(AppError).toBeDefined();
    });
});
