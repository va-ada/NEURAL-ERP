const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const auditLog = require('../../../../shared/utils/auditLog');

// Get all grades for a student
const getByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const grades = await prisma.grade.findMany({
            where: { studentId },
            include: { subject: { select: { name: true, code: true, shortName: true } } },
            orderBy: [{ semester: 'asc' }, { subject: { name: 'asc' } }],
        });

        const semesterResults = await prisma.semesterResult.findMany({
            where: { studentId },
            orderBy: { semester: 'asc' },
        });

        // Group grades by semester
        const semesters = {};
        for (const g of grades) {
            if (!semesters[g.semester]) semesters[g.semester] = [];
            semesters[g.semester].push(g);
        }

        res.json({ grades, semesterResults, semesters });
    } catch (err) {
        next(err);
    }
};

// Get grades for a specific semester
const getBySemester = async (req, res, next) => {
    try {
        const { studentId, semester } = req.params;

        const grades = await prisma.grade.findMany({
            where: { studentId, semester: parseInt(semester) },
            include: { subject: { select: { name: true, code: true, shortName: true } } },
        });

        const result = await prisma.semesterResult.findUnique({
            where: { studentId_semester: { studentId, semester: parseInt(semester) } },
        });

        res.json({ grades, semesterResult: result });
    } catch (err) {
        next(err);
    }
};

// Get grade stats (CGPA, rank, distribution)
const getStats = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const semesterResults = await prisma.semesterResult.findMany({
            where: { studentId },
            orderBy: { semester: 'asc' },
        });

        const grades = await prisma.grade.findMany({
            where: { studentId },
        });

        // Calculate grade distribution
        const distribution = {};
        for (const g of grades) {
            distribution[g.grade] = (distribution[g.grade] || 0) + 1;
        }

        const latestResult = semesterResults[semesterResults.length - 1];
        const highestSgpa = semesterResults.reduce((max, r) => r.sgpa > max.sgpa ? r : max, semesterResults[0]);

        const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);

        res.json({
            cgpa: latestResult?.cgpa || 0,
            currentSgpa: latestResult?.sgpa || 0,
            highestSgpa: highestSgpa?.sgpa || 0,
            highestSem: highestSgpa?.semester || 1,
            creditsCompleted: totalCredits,
            rank: latestResult?.rank,
            totalStudents: latestResult?.totalStudents,
            deptRank: latestResult?.deptRank,
            deptTotal: latestResult?.deptTotal,
            cgpaTrend: semesterResults.map(r => r.sgpa),
            gradeDistribution: distribution,
            semesterResults,
        });
    } catch (err) {
        next(err);
    }
};

// Create a grade (for faculty/admin)
const create = async (req, res, next) => {
    try {
        const { studentId, subjectId, semester, grade, points, credits } = req.body;

        const result = await prisma.grade.upsert({
            where: { studentId_subjectId_semester: { studentId, subjectId, semester } },
            update: { grade, points, credits },
            create: { studentId, subjectId, semester, grade, points, credits },
        });

        await auditLog(req.user.id, 'CREATE', 'Grade', result.id, `Grade recorded for student ${studentId}`);
        res.status(201).json({ message: 'Grade recorded.', grade: result });
    } catch (err) {
        next(err);
    }
};

module.exports = { getByStudent, getBySemester, getStats, create };
