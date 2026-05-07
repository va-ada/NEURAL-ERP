const { body } = require('express-validator');

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('role').isIn(['ADMIN', 'FACULTY', 'STUDENT']).withMessage('Role must be ADMIN, FACULTY, or STUDENT.'),
    body('institutionId').isUUID().withMessage('Valid institution ID required.'),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.'),
];

const verifyOtpValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
];

const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required.'),
];

const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
];

const resetPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain a number.'),
];

module.exports = {
    registerValidation,
    loginValidation,
    verifyOtpValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
};
