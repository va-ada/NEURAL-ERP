// ============================================================
// Admin Data — 2 admins + dashboard payload
// ============================================================

export const admins = {
    ADM001: {
        id: 'ADM001',
        name: 'Dr. Vikram Desai',
        email: 'vikram.desai@sfit.edu',
        password: 'admin123',
        role: 'HOD, AI/ML Department',
        avatar: { initial: 'V', color: '#8B5CF6' },
    },
    ADM002: {
        id: 'ADM002',
        name: 'Prof. Meera Nair',
        email: 'meera.nair@sfit.edu',
        password: 'admin456',
        role: 'Admin Coordinator',
        avatar: { initial: 'M', color: '#EC4899' },
    },
}

export const adminDashboardData = {
    totalStudents: 245,
    totalFaculty: 12,
    placementRate: 87,
    systemUptime: 99.9,
    deptDistribution: {
        labels: ['AI/ML', 'Data Science', 'Cyber Security', 'Cloud Computing', 'IoT'],
        data: [35, 25, 18, 13, 9],
        backgroundColor: ['#2563EB', '#60A5FA', '#22C55E', '#F59E0B', '#EC4899'],
    },
    placementStats: {
        labels: ['2023', '2024', '2025', '2026'],
        data: [72, 78, 83, 87],
    },
    topFaculty: [
        { name: 'Dr. Priya Sharma', dept: 'AI/ML', classes: 42, rating: 4.9, type: 'd' },
        { name: 'Prof. Amit Verma', dept: 'AI/ML', classes: 45, rating: 4.8, type: 'p' },
        { name: 'Dr. Sarah Johnson', dept: 'AI/ML', classes: 38, rating: 4.7, type: 'd' },
        { name: 'Prof. Neha Singh', dept: 'AI/ML', classes: 36, rating: 4.7, type: 'p' },
        { name: 'Dr. Rahul Mehta', dept: 'AI/ML', classes: 34, rating: 4.5, type: 'd' },
    ],
    atRiskStudents: [
        { id: 'STU003', name: 'Rohit Patel', issue: 'Low Attendance — 78% (below 80% threshold)' },
        { id: 'STU003', name: 'Rohit Patel', issue: 'Multiple Overdue Assignments — 4 pending' },
        { id: 'STU004', name: 'Sneha Gupta', issue: 'CV Attendance Warning — 82%' },
    ],
    recentActivity: [
        { text: 'Ananya Sharma received offer from Google', time: '30 min ago', type: 'success' },
        { text: 'Machine Learning assignment posted', time: '2 hours ago', type: 'info' },
        { text: 'Rohit Patel attendance flagged', time: '5 hours ago', type: 'warning' },
        { text: 'Semester 6 results published', time: '1 day ago', type: 'info' },
        { text: 'NVIDIA campus drive scheduled', time: '2 days ago', type: 'info' },
    ],
}
