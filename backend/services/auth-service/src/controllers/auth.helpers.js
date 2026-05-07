const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../../../shared/utils/prisma');
const { sendEmailOTP } = require('../../../../shared/utils/mailer');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const rateLimiter = require('../../../../shared/utils/rateLimiter');
const { JWT_ISSUER, JWT_AUDIENCE } = require('../../../../shared/middleware/auth.middleware');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const OTP_MAX_ATTEMPTS = 5;
const OTP_WINDOW_SEC = 15 * 60;
const OTP_TTL_MS = 10 * 60 * 1000;

const isProd = () => process.env.NODE_ENV === 'production';

const generateOTP = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

const signAccessToken = (user) =>
    jwt.sign(
        { sub: user.id, role: user.role, institutionId: user.institutionId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

const signRefreshToken = (user, tokenId) =>
    jwt.sign(
        { sub: user.id, tid: tokenId },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN, issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

const otpKey = (email) => `otp:attempts:${email.toLowerCase()}`;

async function consumeOtpAttempt(email) {
    const { limited, resetIn } = await rateLimiter.hit(otpKey(email), {
        max: OTP_MAX_ATTEMPTS,
        windowSec: OTP_WINDOW_SEC,
    });
    if (limited) {
        throw new AppError(
            `Too many OTP attempts. Try again in ${Math.ceil(resetIn / 60)} minute(s).`,
            429,
            'OTP_RATE_LIMITED',
            { retryAfterSec: resetIn }
        );
    }
}

async function clearOtpAttempts(email) {
    await rateLimiter.reset(otpKey(email));
}

function buildUserResponse(user) {
    const data = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
    };

    if (user.student) {
        data.studentId = user.student.id;
        data.rollNumber = user.student.rollNumber;
        data.semester = user.student.semester;
        data.section = user.student.section;
        data.department = user.student.department;
        data.batch = user.student.batch;
        data.avatarInitial = user.student.avatarInitial;
        data.avatarColor = user.student.avatarColor;
    }

    if (user.faculty) {
        data.facultyId = user.faculty.id;
        data.employeeId = user.faculty.employeeId;
        data.designation = user.faculty.designation;
        data.department = user.faculty.department;
    }

    return data;
}

async function storeOtp(userId, otp) {
    const expiry = new Date(Date.now() + OTP_TTL_MS);
    const hashed = await bcrypt.hash(otp, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorCode: hashed, twoFactorExpiry: expiry },
    });
}

async function deliverOtp(user, otp, purpose) {
    try {
        await sendEmailOTP(user.email, user.name, otp, purpose);
        return { sent: true };
    } catch (emailErr) {
        if (!isProd()) {
            // eslint-disable-next-line no-console
            console.log(`📧 [dev] OTP for ${user.email}: ${otp}`);
            return { sent: false, reason: 'email_unavailable_dev' };
        }
        throw new AppError('Unable to send OTP email. Please try again later.', 503, 'OTP_DELIVERY_FAILED');
    }
}

module.exports = {
    generateOTP,
    signAccessToken,
    signRefreshToken,
    consumeOtpAttempt,
    clearOtpAttempts,
    buildUserResponse,
    storeOtp,
    deliverOtp,
    JWT_REFRESH_SECRET,
};
