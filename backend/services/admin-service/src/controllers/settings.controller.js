const prisma = require('../../../../shared/utils/prisma');

const getSettings = async (req, res, next) => {
    try {
        const institution = await prisma.institution.findFirst({
            where: { id: req.user.institutionId },
        });
        res.json({ institution });
    } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
    try {
        const { name, address, phone, email, logo } = req.body;
        const institution = await prisma.institution.update({
            where: { id: req.user.institutionId },
            data: { name, address, phone, email, logo },
        });
        res.json({ message: 'Settings updated.', institution });
    } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
