const bcrypt = require('bcryptjs');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');
const {
    generateOTP,
    consumeOtpAttempt,
    clearOtpAttempts,
    storeOtp,
    deliverOtp,
} = require('./auth.helpers');

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        // Opaque response — don't leak account existence
        const responseBody = {
            data: { message: 'If that email exists, an OTP has been sent.' },
        };
        if (!user) return res.json(responseBody);

        const otp = generateOTP();
        await storeOtp(user.id, otp);
        await deliverOtp(user, otp, 'reset');

        res.json(responseBody);
    } catch (err) {
        next(err);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        await consumeOtpAttempt(email);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

        if (!user.twoFactorCode || !user.twoFactorExpiry) {
            throw new AppError('No OTP requested.', 400, 'NO_OTP_PENDING');
        }
        if (new Date() > user.twoFactorExpiry) {
            throw new AppError('OTP has expired.', 401, 'OTP_EXPIRED');
        }

        const matches = await bcrypt.compare(otp, user.twoFactorCode);
        if (!matches) throw new AppError('Wrong OTP', 401, 'OTP_INVALID');

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Invalidate every existing refresh token on reset.
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                twoFactorCode: null,
                twoFactorExpiry: null,
                refreshToken: null,
            },
        });

        await clearOtpAttempts(email);
        await auditLog(user.id, 'PASSWORD_RESET', 'User', user.id);

        res.json({
            data: { message: 'Password reset successfully. Please login again.' },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { forgotPassword, resetPassword };
