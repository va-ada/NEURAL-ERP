const router = require('express').Router();
const { validateRequest } = require('../../../../shared/middleware/validate');
const { authenticate } = require('../../../../shared/middleware/auth.middleware');
const {
    registerValidation,
    loginValidation,
    verifyOtpValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} = require('../validators/auth.validators');
const { register, login, logout } = require('../controllers/auth.controller');
const { verifyOtp } = require('../controllers/otp.controller');
const { refreshTokenHandler } = require('../controllers/token.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/verify-otp', verifyOtpValidation, validateRequest, verifyOtp);
router.post('/refresh-token', refreshTokenValidation, validateRequest, refreshTokenHandler);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/logout', authenticate, logout);

module.exports = router;
