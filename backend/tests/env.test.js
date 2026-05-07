const { requireEnv } = require('../shared/utils/env');

describe('shared/utils/env :: requireEnv', () => {
    const original = { ...process.env };

    afterEach(() => {
        process.env = { ...original };
    });

    it('passes when all required vars are set to real-looking values', () => {
        process.env.FOO = 'a-real-value';
        process.env.BAR = '12345';
        expect(() => requireEnv(['FOO', 'BAR'])).not.toThrow();
    });

    it('throws when a required var is missing', () => {
        delete process.env.DOES_NOT_EXIST;
        expect(() => requireEnv(['DOES_NOT_EXIST'])).toThrow(/Missing: DOES_NOT_EXIST/);
    });

    it('throws when a required var is an empty string', () => {
        process.env.BLANK = '';
        expect(() => requireEnv(['BLANK'])).toThrow(/Missing: BLANK/);
    });

    it('rejects the known "change-in-production" placeholder', () => {
        process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
        expect(() => requireEnv(['JWT_SECRET'])).toThrow(/Placeholder values/);
    });

    it('rejects the "CHANGE_ME_DEV_PASSWORD" placeholder', () => {
        process.env.DATABASE_URL = 'postgresql://u:CHANGE_ME_DEV_PASSWORD@h/d';
        expect(() => requireEnv(['DATABASE_URL'])).toThrow(/Placeholder values/);
    });

    it('accepts a random-looking secret', () => {
        process.env.JWT_SECRET = 'a'.repeat(64);
        expect(() => requireEnv(['JWT_SECRET'])).not.toThrow();
    });
});
