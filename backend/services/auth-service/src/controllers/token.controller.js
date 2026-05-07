const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');
const { JWT_ISSUER, JWT_AUDIENCE } = require('../../../../shared/middleware/auth.middleware');
const {
    signAccessToken,
    signRefreshToken,
    JWT_REFRESH_SECRET,
} = require('./auth.helpers');

const refreshTokenHandler = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        let payload;
        try {
            payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE,
            });
        } catch (err) {
            const code = err.name === 'TokenExpiredError' ? 'REFRESH_EXPIRED' : 'REFRESH_INVALID';
            throw new AppError('Invalid or expired refresh token.', 401, code);
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.refreshToken) {
            throw new AppError('Invalid refresh token.', 401, 'REFRESH_INVALID');
        }

        const matches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!matches) {
            // Token reuse detected: someone is presenting an old (already-rotated)
            // refresh token. Treat the entire family as compromised and force
            // re-login on every device by clearing the stored refresh token.
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: null },
            });
            await auditLog(user.id, 'REFRESH_REUSE_DETECTED', 'User', user.id);
            throw new AppError(
                'Refresh token reuse detected. Please log in again.',
                401,
                'REFRESH_REUSE'
            );
        }

        const newTokenId = crypto.randomUUID();
        const newRefreshToken = signRefreshToken(user, newTokenId);
        const hashedNewRefresh = await bcrypt.hash(newRefreshToken, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedNewRefresh },
        });

        const newAccessToken = signAccessToken(user);

        res.json({ data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    } catch (err) {
        next(err);
    }
};

module.exports = { refreshTokenHandler };
