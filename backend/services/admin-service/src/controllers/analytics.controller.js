const prisma = require('../../../../shared/utils/prisma');

// ─── Attendance Trends (last 6 months, grouped by department) ───

const getAttendanceTrends = async (req, res, next) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const departments = await prisma.department.findMany({
            select: { id: true, name: true, code: true },
        });

        const attendances = await prisma.attendance.findMany({
            where: { date: { gte: sixMonthsAgo } },
            select: {
                date: true,
                status: true,
                student: { select: { departmentId: true } },
            },
        });

        // Group by month + department
        const grouped = {};
        for (const a of attendances) {
            const month = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}`;
            const deptId = a.student.departmentId;
            const key = `${month}::${deptId}`;

            if (!grouped[key]) grouped[key] = { present: 0, total: 0 };
            grouped[key].total += 1;
            if (a.status === 'PRESENT' || a.status === 'LATE') {
                grouped[key].present += 1;
            }
        }

        // Build response: per-department trends array
        const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));
        const trends = {};

        for (const [key, counts] of Object.entries(grouped)) {
            const [month, deptId] = key.split('::');
            const deptCode = deptMap[deptId] || deptId;
            if (!trends[deptCode]) trends[deptCode] = [];
            trends[deptCode].push({
                month,
                percentage: counts.total > 0
                    ? Math.round((counts.present / counts.total) * 10000) / 100
                    : 0,
                present: counts.present,
                total: counts.total,
            });
        }

        // Sort each department's months chronologically
        for (const dept of Object.keys(trends)) {
            trends[dept].sort((a, b) => a.month.localeCompare(b.month));
        }

        res.json({ trends });
    } catch (err) { next(err); }
};

// ─── Performance Stats (grade distribution + avg CGPA per dept) ───

const getPerformanceStats = async (req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            select: { id: true, name: true, code: true },
        });

        // Grade distribution from Grade model
        const grades = await prisma.grade.findMany({
            select: {
                grade: true,
                student: { select: { departmentId: true } },
            },
        });

        const gradeLabels = ['A+', 'A', 'B+', 'B', 'C'];
        const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));
        const distribution = {};

        for (const g of grades) {
            const deptCode = deptMap[g.student.departmentId] || g.student.departmentId;
            if (!distribution[deptCode]) {
                distribution[deptCode] = Object.fromEntries(gradeLabels.map(l => [l, 0]));
            }
            if (gradeLabels.includes(g.grade)) {
                distribution[deptCode][g.grade] += 1;
            }
        }

        // Avg CGPA per department from SemesterResult (latest per student)
        const semesterResults = await prisma.semesterResult.findMany({
            select: {
                studentId: true,
                semester: true,
                cgpa: true,
                student: { select: { departmentId: true } },
            },
            orderBy: { semester: 'desc' },
        });

        // Keep only the latest semester result per student
        const latestByStudent = {};
        for (const sr of semesterResults) {
            if (!latestByStudent[sr.studentId]) {
                latestByStudent[sr.studentId] = sr;
            }
        }

        const deptCgpa = {};
        for (const sr of Object.values(latestByStudent)) {
            const deptCode = deptMap[sr.student.departmentId] || sr.student.departmentId;
            if (!deptCgpa[deptCode]) deptCgpa[deptCode] = { sum: 0, count: 0 };
            deptCgpa[deptCode].sum += sr.cgpa;
            deptCgpa[deptCode].count += 1;
        }

        const avgCgpa = {};
        for (const [dept, data] of Object.entries(deptCgpa)) {
            avgCgpa[dept] = data.count > 0
                ? Math.round((data.sum / data.count) * 100) / 100
                : 0;
        }

        res.json({ gradeDistribution: distribution, avgCgpa });
    } catch (err) { next(err); }
};

// ─── Placement Stats (funnel + company-wise) ───

const getPlacementStats = async (req, res, next) => {
    try {
        const applications = await prisma.careerApplication.findMany({
            include: {
                opportunity: { select: { company: true } },
            },
        });

        const funnel = {
            applied: applications.length,
            interviewScheduled: 0,
            offerReceived: 0,
            accepted: 0,
        };

        const companyWise = {};

        for (const app of applications) {
            // Funnel counts (cumulative — higher stages also count lower)
            if (app.status === 'Interview Scheduled') funnel.interviewScheduled += 1;
            if (app.status === 'Offer Received') {
                funnel.interviewScheduled += 1;
                funnel.offerReceived += 1;
            }
            if (app.status === 'Accepted') {
                funnel.interviewScheduled += 1;
                funnel.offerReceived += 1;
                funnel.accepted += 1;
            }

            // Company-wise counts
            const company = app.opportunity.company;
            if (!companyWise[company]) {
                companyWise[company] = { applied: 0, interviewScheduled: 0, offerReceived: 0, accepted: 0 };
            }
            companyWise[company].applied += 1;
            if (['Interview Scheduled', 'Offer Received', 'Accepted'].includes(app.status)) {
                companyWise[company].interviewScheduled += 1;
            }
            if (['Offer Received', 'Accepted'].includes(app.status)) {
                companyWise[company].offerReceived += 1;
            }
            if (app.status === 'Accepted') {
                companyWise[company].accepted += 1;
            }
        }

        res.json({ funnel, companyWise });
    } catch (err) { next(err); }
};

// ─── Department Comparison ───

const getDepartmentComparison = async (req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            select: { id: true, name: true, code: true },
        });

        const students = await prisma.student.findMany({
            select: {
                id: true,
                departmentId: true,
                attendances: { select: { status: true } },
                semesterResults: { orderBy: { semester: 'desc' }, take: 1, select: { cgpa: true } },
                careerApplications: { select: { status: true } },
            },
        });

        const deptStats = {};

        for (const dept of departments) {
            deptStats[dept.code] = {
                name: dept.name,
                studentCount: 0,
                cgpaSum: 0,
                cgpaCount: 0,
                attendancePresent: 0,
                attendanceTotal: 0,
                offers: 0,
            };
        }

        const deptMap = Object.fromEntries(departments.map(d => [d.id, d.code]));

        for (const s of students) {
            const deptCode = deptMap[s.departmentId];
            if (!deptCode || !deptStats[deptCode]) continue;

            const stat = deptStats[deptCode];
            stat.studentCount += 1;

            // Latest CGPA
            if (s.semesterResults.length > 0) {
                stat.cgpaSum += s.semesterResults[0].cgpa;
                stat.cgpaCount += 1;
            }

            // Attendance
            for (const a of s.attendances) {
                stat.attendanceTotal += 1;
                if (a.status === 'PRESENT' || a.status === 'LATE') {
                    stat.attendancePresent += 1;
                }
            }

            // Placement offers
            const hasOffer = s.careerApplications.some(
                ca => ca.status === 'Offer Received' || ca.status === 'Accepted'
            );
            if (hasOffer) stat.offers += 1;
        }

        const comparison = Object.entries(deptStats).map(([code, stat]) => ({
            department: code,
            name: stat.name,
            studentCount: stat.studentCount,
            avgCgpa: stat.cgpaCount > 0
                ? Math.round((stat.cgpaSum / stat.cgpaCount) * 100) / 100
                : null,
            avgAttendance: stat.attendanceTotal > 0
                ? Math.round((stat.attendancePresent / stat.attendanceTotal) * 10000) / 100
                : null,
            placementRate: stat.studentCount > 0
                ? Math.round((stat.offers / stat.studentCount) * 10000) / 100
                : 0,
        }));

        res.json({ comparison });
    } catch (err) { next(err); }
};

module.exports = { getAttendanceTrends, getPerformanceStats, getPlacementStats, getDepartmentComparison };
