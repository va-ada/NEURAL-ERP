const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');
const auditLog = require('../../../../shared/utils/auditLog');

// ─── Create Timetable Slot ─────────────────────────────
const create = async (req, res, next) => {
    try {
        const { batchId, subjectId, facultyId, day, startTime, endTime, room } = req.body;

        const slot = await prisma.timetableSlot.create({
            data: { batchId, subjectId, facultyId, day, startTime, endTime, room },
            include: {
                subject: { select: { name: true, code: true } },
                faculty: { include: { user: { select: { name: true } } } },
                batch: { select: { name: true } },
            },
        });

        await cacheInvalidate(`timetable:batch:${batchId}:*`);
        await auditLog(req.user?.id, 'CREATE', 'TimetableSlot', slot.id, { batchId, day, startTime });
        res.status(201).json({ message: 'Timetable slot created.', slot });
    } catch (err) {
        next(err);
    }
};

// ─── Get Timetable by Batch ────────────────────────────
const getByBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const { day } = req.query;

        const where = { batchId };
        if (day) where.day = day;

        const cacheKey = `timetable:batch:${batchId}:${day || ''}`;
        const slots = await cacheGet(cacheKey, () =>
            prisma.timetableSlot.findMany({
                where,
                include: {
                    subject: { select: { name: true, code: true } },
                    faculty: { include: { user: { select: { name: true } } } },
                },
                orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
            })
        , 300);

        // Group by day
        const grouped = {};
        for (const slot of slots) {
            if (!grouped[slot.day]) grouped[slot.day] = [];
            grouped[slot.day].push(slot);
        }

        res.json({ timetable: grouped, total: slots.length });
    } catch (err) {
        next(err);
    }
};

// ─── Get Timetable by Faculty ──────────────────────────
const getByFaculty = async (req, res, next) => {
    try {
        const { facultyId } = req.params;
        const { day } = req.query;

        const where = { facultyId };
        if (day) where.day = day;

        const slots = await prisma.timetableSlot.findMany({
            where,
            include: {
                subject: { select: { name: true, code: true } },
                batch: { select: { name: true } },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        });

        const grouped = {};
        for (const slot of slots) {
            if (!grouped[slot.day]) grouped[slot.day] = [];
            grouped[slot.day].push(slot);
        }

        res.json({ timetable: grouped, total: slots.length });
    } catch (err) {
        next(err);
    }
};

// ─── Update Slot ───────────────────────────────────────
const update = async (req, res, next) => {
    try {
        const { subjectId, facultyId, day, startTime, endTime, room } = req.body;

        const slot = await prisma.timetableSlot.update({
            where: { id: req.params.id },
            data: { subjectId, facultyId, day, startTime, endTime, room },
            include: {
                subject: { select: { name: true, code: true } },
                faculty: { include: { user: { select: { name: true } } } },
                batch: { select: { name: true } },
            },
        });

        await cacheInvalidate(`timetable:batch:${slot.batchId}:*`);
        await auditLog(req.user?.id, 'UPDATE', 'TimetableSlot', slot.id);
        res.json({ message: 'Timetable slot updated.', slot });
    } catch (err) {
        next(err);
    }
};

// ─── Delete Slot ───────────────────────────────────────
const remove = async (req, res, next) => {
    try {
        const slotToDelete = await prisma.timetableSlot.findUnique({ where: { id: req.params.id }, select: { batchId: true } });
        await prisma.timetableSlot.delete({ where: { id: req.params.id } });
        if (slotToDelete) await cacheInvalidate(`timetable:batch:${slotToDelete.batchId}:*`);
        await auditLog(req.user?.id, 'DELETE', 'TimetableSlot', req.params.id);
        res.json({ message: 'Timetable slot deleted.' });
    } catch (err) {
        next(err);
    }
};

// ─── Bulk Update (replace all slots for a batch) ──────
const bulkUpdate = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const { slots } = req.body; // Array of { subjectId, facultyId, day, startTime, endTime, room, type }

        if (!Array.isArray(slots)) {
            return res.status(400).json({ error: 'slots must be an array' });
        }

        // Transaction: delete existing, create new
        await prisma.$transaction(async (tx) => {
            await tx.timetableSlot.deleteMany({ where: { batchId } });

            if (slots.length > 0) {
                await tx.timetableSlot.createMany({
                    data: slots.map(s => ({
                        batchId,
                        subjectId: s.subjectId,
                        facultyId: s.facultyId,
                        day: s.day,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        room: s.room || 'TBD',
                        type: s.type || 'LECTURE',
                    })),
                });
            }
        });

        // Return the new timetable
        const newSlots = await prisma.timetableSlot.findMany({
            where: { batchId },
            include: {
                subject: { select: { name: true, code: true, shortName: true } },
                faculty: { include: { user: { select: { name: true } } } },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        });

        await cacheInvalidate(`timetable:batch:${batchId}:*`);
        await auditLog(req.user?.id, 'BULK_UPDATE', 'TimetableSlot', null, { batchId, slotsCount: newSlots.length });
        res.json({ message: `Timetable updated: ${newSlots.length} slots.`, slots: newSlots });
    } catch (err) {
        next(err);
    }
};

// ─── Clear Batch Timetable ────────────────────────────
const clearBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const { count } = await prisma.timetableSlot.deleteMany({ where: { batchId } });
        await cacheInvalidate(`timetable:batch:${batchId}:*`);
        await auditLog(req.user?.id, 'CLEAR', 'TimetableSlot', null, { batchId });
        res.json({ message: `Cleared ${count} timetable slots.` });
    } catch (err) {
        next(err);
    }
};

// ─── Check Conflicts ─────────────────────────────────
const checkConflicts = async (req, res, next) => {
    try {
        const { batchId, slots } = req.body;
        // slots: [{ facultyId, day, startTime, room }]

        if (!Array.isArray(slots)) {
            return res.status(400).json({ error: 'slots must be an array' });
        }

        const conflicts = [];

        for (const slot of slots) {
            // Check faculty conflicts (same faculty, same day, same time, different batch)
            const facultyConflict = await prisma.timetableSlot.findFirst({
                where: {
                    facultyId: slot.facultyId,
                    day: slot.day,
                    startTime: slot.startTime,
                    batchId: { not: batchId },
                },
                include: {
                    batch: { select: { name: true } },
                    subject: { select: { name: true } },
                },
            });

            if (facultyConflict) {
                conflicts.push({
                    type: 'FACULTY',
                    day: slot.day,
                    time: slot.startTime,
                    message: `Faculty already teaching ${facultyConflict.subject.name} for ${facultyConflict.batch.name}`,
                });
            }

            // Check room conflicts
            if (slot.room && slot.room !== 'TBD') {
                const roomConflict = await prisma.timetableSlot.findFirst({
                    where: {
                        room: slot.room,
                        day: slot.day,
                        startTime: slot.startTime,
                        batchId: { not: batchId },
                    },
                    include: {
                        batch: { select: { name: true } },
                        subject: { select: { name: true } },
                    },
                });

                if (roomConflict) {
                    conflicts.push({
                        type: 'ROOM',
                        day: slot.day,
                        time: slot.startTime,
                        room: slot.room,
                        message: `Room ${slot.room} used by ${roomConflict.batch.name} for ${roomConflict.subject.name}`,
                    });
                }
            }
        }

        res.json({ conflicts, hasConflicts: conflicts.length > 0 });
    } catch (err) {
        next(err);
    }
};

module.exports = { create, getByBatch, getByFaculty, update, remove, bulkUpdate, clearBatch, checkConflicts };

