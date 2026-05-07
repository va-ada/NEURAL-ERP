const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');
const {
    signAccessToken,
    signRefreshToken,
    consumeOtpAttempt,
    clearOtpAttempts,
    buildUserResponse,
} = require('./auth.helpers');

const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        await consumeOtpAttempt(email);

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                student: {
                    include: {
                        department: { select: { name: true, code: true } },
                        batch: { select: { id: true, name: true, currentSemester: true } },
                    },
                },
                faculty: { include: { department: { select: { name: true, code: true } } } },
            },
        });
        if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

        if (!user.twoFactorCode || !user.twoFactorExpiry) {
            throw new AppError('No OTP requested. Please login first.', 400, 'NO_OTP_PENDING');
        }

        if (new Date() > user.twoFactorExpiry) {
            throw new AppError('OTP has expired. Please login again.', 401, 'OTP_EXPIRED');
        }

        const matches = await bcrypt.compare(otp, user.twoFactorCode);
        if (!matches) {
            await auditLog(user.id, 'OTP_FAILED', 'User', user.id, 'Wrong OTP');
            throw new AppError('Wrong OTP', 401, 'OTP_INVALID');
        }

        await clearOtpAttempts(email);

        const tokenId = crypto.randomUUID();
        const refreshToken = signRefreshToken(user, tokenId);
        const hashedRefresh = await bcrypt.hash(refreshToken, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorExpiry: null, refreshToken: hashedRefresh },
        });

        const accessToken = signAccessToken(user);

        await auditLog(user.id, 'LOGIN_SUCCESS', 'User', user.id);

        res.json({
            data: {
                message: 'Login successful.',
                accessToken,
                refreshToken,
                user: buildUserResponse(user),
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { verifyOtp };
