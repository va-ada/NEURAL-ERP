const bcrypt = require('bcryptjs');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');
const {
    generateOTP,
    clearOtpAttempts,
    storeOtp,
    deliverOtp,
} = require('./auth.helpers');

const register = async (req, res, next) => {
    try {
        const { email, password, name, role, institutionId } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) throw new AppError('Email already registered.', 409, 'EMAIL_TAKEN');

        const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
        if (!institution) throw new AppError('Institution not found.', 404, 'INSTITUTION_NOT_FOUND');

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role, institutionId },
            select: { id: true, email: true, name: true, role: true, institutionId: true, createdAt: true },
        });

        await auditLog(user.id, 'CREATE', 'User', user.id, 'User registered');

        res.status(201).json({
            data: { message: 'User registered successfully.', user },
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        if (!user.isActive) throw new AppError('Account is deactivated.', 403, 'ACCOUNT_DEACTIVATED');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            await auditLog(user.id, 'LOGIN_FAILED', 'User', user.id, 'Invalid password');
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        await clearOtpAttempts(email);

        const otp = generateOTP();
        await storeOtp(user.id, otp);
        await deliverOtp(user, otp, 'verify');

        res.json({ data: { message: 'OTP sent to your email.', email: user.email } });
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
            await auditLog(userId, 'LOGOUT', 'User', userId);
        }
        res.json({ data: { message: 'Logged out.' } });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, logout };
