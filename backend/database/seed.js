const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Name Pools ─────────────────────────────────────────
const firstNames = [
    'Aarav', 'Aditi', 'Aditya', 'Akshay', 'Amit', 'Amrita', 'Ananya', 'Aniket', 'Anjali', 'Arjun',
    'Aryan', 'Bhavya', 'Chaitanya', 'Deepak', 'Devika', 'Dhruv', 'Divya', 'Esha', 'Gaurav', 'Gauri',
    'Harsh', 'Ishaan', 'Ishita', 'Jatin', 'Juhi', 'Karan', 'Kavya', 'Khushi', 'Krish', 'Lavanya',
    'Manav', 'Manisha', 'Meera', 'Mihir', 'Mira', 'Mohit', 'Nandini', 'Neha', 'Nikhil', 'Nisha',
    'Omkar', 'Pallavi', 'Parth', 'Pooja', 'Pranav', 'Prashant', 'Priya', 'Rahul', 'Rajat', 'Rashi',
    'Ravi', 'Rhea', 'Riya', 'Rohan', 'Rohit', 'Sakshi', 'Sameer', 'Sanaya', 'Sanjay', 'Sara',
    'Shreya', 'Shubham', 'Simran', 'Sneha', 'Sonal', 'Tanvi', 'Tejas', 'Varun', 'Vedant', 'Vihaan',
    'Vikram', 'Vinay', 'Vivek', 'Yash', 'Yukta', 'Zara', 'Abhinav', 'Aishwarya', 'Arnav', 'Daksh',
    'Dia', 'Gautam', 'Ira', 'Kabir', 'Lakshmi', 'Neeraj', 'Ojas', 'Pihu', 'Reyansh', 'Saanvi',
    'Siddharth', 'Tara', 'Uday', 'Vansh', 'Yashika', 'Akash', 'Bhumi', 'Chinmay', 'Disha', 'Ekta',
];
const lastNames = [
    'Kumar', 'Sharma', 'Patel', 'Gupta', 'Singh', 'Verma', 'Mehta', 'Joshi', 'Shah', 'Reddy',
    'Nair', 'Iyer', 'Rao', 'Desai', 'Kulkarni', 'Thakur', 'Chauhan', 'Mishra', 'Dubey', 'Pandey',
    'Kapoor', 'Malhotra', 'Chopra', 'Banerjee', 'Mukherjee', 'Das', 'Roy', 'Ghosh', 'Bose', 'Sen',
    'Agarwal', 'Saxena', 'Tiwari', 'Srivastava', 'Chawla', 'Bhatt', 'Pillai', 'Menon', 'Hegde', 'Kamath',
];
const colors = ['#2563EB', '#22C55E', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444', '#0891B2', '#EA580C', '#6366F1', '#14B8A6', '#D946EF', '#F97316'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(randBetween(a, b + 1)); }
function weightedGrade() {
    const r = Math.random();
    if (r < 0.10) return 'A+';
    if (r < 0.35) return 'A';
    if (r < 0.65) return 'B+';
    if (r < 0.90) return 'B';
    return 'C';
}
const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6 };

// ─── Departments & Subjects ─────────────────────────────
const DEPARTMENTS = [
    {
        name: 'Computer Science & Engineering', code: 'CS',
        subjects: [
            { name: 'Operating Systems', code: 'CS301', shortName: 'OS', credits: 4 },
            { name: 'Database Management Systems', code: 'CS302', shortName: 'DBMS', credits: 4 },
            { name: 'Computer Networks', code: 'CS303', shortName: 'CN', credits: 3 },
            { name: 'Software Engineering', code: 'CS304', shortName: 'SE', credits: 4 },
            { name: 'Theory of Computation', code: 'CS305', shortName: 'TOC', credits: 4 },
            { name: 'Web Technologies', code: 'CS306', shortName: 'WT', credits: 3 },
        ],
        faculty: [
            { name: 'Prof. Ramesh Iyer', designation: 'Professor', rating: 4.8 },
            { name: 'Dr. Sunita Kulkarni', designation: 'Associate Professor', rating: 4.7 },
            { name: 'Dr. Ajay Thakur', designation: 'Assistant Professor', rating: 4.5 },
            { name: 'Prof. Kavita Desai', designation: 'Professor', rating: 4.6 },
            { name: 'Dr. Manish Saxena', designation: 'Assistant Professor', rating: 4.4 },
            { name: 'Prof. Deepa Menon', designation: 'Associate Professor', rating: 4.7 },
            { name: 'Dr. Suresh Pandey', designation: 'Assistant Professor', rating: 4.3 },
        ],
    },
    {
        name: 'Information Technology', code: 'IT',
        subjects: [
            { name: 'Cloud Computing', code: 'IT301', shortName: 'CC', credits: 4 },
            { name: 'Information Security', code: 'IT302', shortName: 'IS', credits: 4 },
            { name: 'Data Warehousing & Mining', code: 'IT303', shortName: 'DWM', credits: 3 },
            { name: 'Mobile Application Development', code: 'IT304', shortName: 'MAD', credits: 4 },
            { name: 'Internet of Things', code: 'IT305', shortName: 'IoT', credits: 4 },
            { name: 'Big Data Analytics', code: 'IT306', shortName: 'BDA', credits: 3 },
        ],
        faculty: [
            { name: 'Prof. Sanjay Kapoor', designation: 'Professor', rating: 4.7 },
            { name: 'Dr. Anita Roy', designation: 'Associate Professor', rating: 4.8 },
            { name: 'Dr. Vikrant Mishra', designation: 'Assistant Professor', rating: 4.5 },
            { name: 'Prof. Prerna Sen', designation: 'Professor', rating: 4.6 },
            { name: 'Dr. Rajiv Banerjee', designation: 'Assistant Professor', rating: 4.4 },
            { name: 'Prof. Smita Das', designation: 'Associate Professor', rating: 4.6 },
            { name: 'Dr. Hemant Ghosh', designation: 'Assistant Professor', rating: 4.3 },
        ],
    },
    {
        name: 'Artificial Intelligence & Machine Learning', code: 'AI/ML',
        subjects: [
            { name: 'Machine Learning', code: 'AIML301', shortName: 'ML', credits: 4 },
            { name: 'Deep Learning', code: 'AIML302', shortName: 'DL', credits: 4 },
            { name: 'Natural Language Processing', code: 'AIML303', shortName: 'NLP', credits: 3 },
            { name: 'Computer Vision', code: 'AIML304', shortName: 'CV', credits: 4 },
            { name: 'Data Structures & Algorithms', code: 'AIML305', shortName: 'DSA', credits: 4 },
            { name: 'Probability & Statistics', code: 'AIML306', shortName: 'P&S', credits: 3 },
        ],
        faculty: [
            { name: 'Prof. Amit Verma', designation: 'Professor', rating: 4.8 },
            { name: 'Dr. Priya Sharma', designation: 'Associate Professor', rating: 4.9 },
            { name: 'Dr. Sarah Johnson', designation: 'Assistant Professor', rating: 4.7 },
            { name: 'Prof. Rajesh Kumar', designation: 'Professor', rating: 4.6 },
            { name: 'Dr. Rahul Mehta', designation: 'Assistant Professor', rating: 4.5 },
            { name: 'Prof. Neha Singh', designation: 'Professor', rating: 4.7 },
            { name: 'Dr. Karthik Hegde', designation: 'Assistant Professor', rating: 4.4 },
        ],
    },
    {
        name: 'Electronics & Telecommunication', code: 'EXTC',
        subjects: [
            { name: 'Digital Signal Processing', code: 'EXTC301', shortName: 'DSP', credits: 4 },
            { name: 'Microprocessors & Microcontrollers', code: 'EXTC302', shortName: 'MM', credits: 4 },
            { name: 'Electromagnetic Theory', code: 'EXTC303', shortName: 'EMT', credits: 3 },
            { name: 'Control Systems', code: 'EXTC304', shortName: 'CS', credits: 4 },
            { name: 'VLSI Design', code: 'EXTC305', shortName: 'VLSI', credits: 4 },
            { name: 'Communication Systems', code: 'EXTC306', shortName: 'COMM', credits: 3 },
        ],
        faculty: [
            { name: 'Prof. Manoj Bhatt', designation: 'Professor', rating: 4.6 },
            { name: 'Dr. Rekha Pillai', designation: 'Associate Professor', rating: 4.7 },
            { name: 'Dr. Ashish Chawla', designation: 'Assistant Professor', rating: 4.5 },
            { name: 'Prof. Sunanda Kamath', designation: 'Professor', rating: 4.8 },
            { name: 'Dr. Nitin Agarwal', designation: 'Assistant Professor', rating: 4.4 },
            { name: 'Prof. Geeta Tiwari', designation: 'Associate Professor', rating: 4.6 },
            { name: 'Dr. Alok Srivastava', designation: 'Assistant Professor', rating: 4.3 },
        ],
    },
    {
        name: 'Mechanical Engineering', code: 'MECH',
        subjects: [
            { name: 'Thermodynamics', code: 'MECH301', shortName: 'TD', credits: 4 },
            { name: 'Fluid Mechanics', code: 'MECH302', shortName: 'FM', credits: 4 },
            { name: 'Manufacturing Processes', code: 'MECH303', shortName: 'MP', credits: 3 },
            { name: 'Machine Design', code: 'MECH304', shortName: 'MD', credits: 4 },
            { name: 'Heat Transfer', code: 'MECH305', shortName: 'HT', credits: 4 },
            { name: 'Engineering Materials', code: 'MECH306', shortName: 'EM', credits: 3 },
        ],
        faculty: [
            { name: 'Prof. Harish Chopra', designation: 'Professor', rating: 4.7 },
            { name: 'Dr. Meena Malhotra', designation: 'Associate Professor', rating: 4.6 },
            { name: 'Dr. Pradeep Dubey', designation: 'Assistant Professor', rating: 4.5 },
            { name: 'Prof. Anjana Chauhan', designation: 'Professor', rating: 4.7 },
            { name: 'Dr. Rajan Mukherjee', designation: 'Assistant Professor', rating: 4.4 },
            { name: 'Prof. Swati Bose', designation: 'Associate Professor', rating: 4.6 },
            { name: 'Dr. Tarun Shah', designation: 'Assistant Professor', rating: 4.3 },
        ],
    },
];

// ─── Historical subjects for semesters 1-5 ──────────────
const HISTORICAL = {
    1: [
        { name: 'Engineering Mathematics I', code: 'EM101', credits: 4 },
        { name: 'Engineering Physics', code: 'EP101', credits: 4 },
        { name: 'Basic Electrical Engineering', code: 'BE101', credits: 3 },
        { name: 'Engineering Mechanics', code: 'EM102', credits: 4 },
        { name: 'Programming Fundamentals', code: 'PF101', credits: 4 },
        { name: 'Engineering Drawing', code: 'ED101', credits: 3 },
    ],
    2: [
        { name: 'Engineering Mathematics II', code: 'EM201', credits: 4 },
        { name: 'Engineering Chemistry', code: 'EC201', credits: 4 },
        { name: 'Object Oriented Programming', code: 'OO201', credits: 3 },
        { name: 'Digital Logic Design', code: 'DL201', credits: 4 },
        { name: 'Environmental Science', code: 'ES201', credits: 3 },
        { name: 'Workshop Practice', code: 'WP201', credits: 4 },
    ],
    3: [
        { name: 'Linear Algebra', code: 'LA301', credits: 4 },
        { name: 'Discrete Mathematics', code: 'DM301', credits: 4 },
        { name: 'Data Structures', code: 'DS301', credits: 4 },
        { name: 'Introduction to Computing', code: 'IC301', credits: 4 },
        { name: 'Computer Organization', code: 'CO301', credits: 4 },
        { name: 'Statistics', code: 'ST301', credits: 4 },
    ],
    4: [
        { name: 'Analysis of Algorithms', code: 'AA401', credits: 4 },
        { name: 'Database Fundamentals', code: 'DF401', credits: 4 },
        { name: 'Operating Systems Basics', code: 'OSB401', credits: 3 },
        { name: 'Networking Basics', code: 'NB401', credits: 4 },
        { name: 'Theory of Computation', code: 'TC401', credits: 4 },
        { name: 'Software Engineering Basics', code: 'SEB401', credits: 3 },
    ],
    5: [
        { name: 'Advanced Algorithms', code: 'AA501', credits: 4 },
        { name: 'System Design', code: 'SD501', credits: 4 },
        { name: 'Cloud Fundamentals', code: 'CF501', credits: 3 },
        { name: 'Cryptography', code: 'CR501', credits: 4 },
        { name: 'Data Mining', code: 'DM501', credits: 4 },
        { name: 'Elective I', code: 'EL501', credits: 3 },
    ],
};

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIME_SLOTS = [
    { start: '9:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    // 12:00-1:00 = lunch (skip)
    { start: '1:00', end: '2:00' },
    { start: '2:00', end: '3:00' },
    { start: '3:00', end: '4:00' },
    { start: '4:00', end: '5:00' },
];

const ROOMS = [
    'Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202', 'Room 203',
    'Room 301', 'Room 302', 'Room 303', 'Room 305', 'Room 401', 'Room 402',
    'Lab 101', 'Lab 102', 'Lab 201', 'Lab 202', 'Lab 301', 'Lab 401',
];

// Keep track of faculty/room bookings globally for conflict-free generation
const facultyBookings = {}; // key: `${facultyId}_${day}_${slotIdx}` → true
const roomBookings = {};    // key: `${room}_${day}_${slotIdx}` → true

function isSlotFree(facultyId, room, day, slotIdx) {
    return !facultyBookings[`${facultyId}_${day}_${slotIdx}`] && !roomBookings[`${room}_${day}_${slotIdx}`];
}
function bookSlot(facultyId, room, day, slotIdx) {
    facultyBookings[`${facultyId}_${day}_${slotIdx}`] = true;
    roomBookings[`${room}_${day}_${slotIdx}`] = true;
}

// ─── Main Seed Function ─────────────────────────────────
async function main() {
    console.log('🌱 Starting Neural ERP database seed (600 students)...\n');

    // Clear all data in reverse dependency order
    await prisma.$transaction([
        prisma.sharedNote.deleteMany(),
        prisma.note.deleteMany(),
        prisma.noteFolder.deleteMany(),
        prisma.forumReply.deleteMany(),
        prisma.forumPost.deleteMany(),
        prisma.bookIssue.deleteMany(),
        prisma.libraryBook.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.fee.deleteMany(),
        prisma.studentSkill.deleteMany(),
        prisma.careerApplication.deleteMany(),
        prisma.careerEvent.deleteMany(),
        prisma.careerOpportunity.deleteMany(),
        prisma.submission.deleteMany(),
        prisma.assignment.deleteMany(),
        prisma.semesterResult.deleteMany(),
        prisma.grade.deleteMany(),
        prisma.exam.deleteMany(),
        prisma.timetableSlot.deleteMany(),
        prisma.attendance.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.announcement.deleteMany(),
        prisma.auditLog.deleteMany(),
        prisma.facultySubject.deleteMany(),
        prisma.subject.deleteMany(),
        prisma.student.deleteMany(),
        prisma.faculty.deleteMany(),
        prisma.batch.deleteMany(),
        prisma.department.deleteMany(),
        prisma.user.deleteMany(),
        prisma.institution.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');

    // ─── 1. Institution ─────────────────────────────────
    const inst = await prisma.institution.create({
        data: { name: 'St. Francis Institute of Technology', code: 'SFIT', address: 'SFIT Campus, Mumbai', email: 'info@sfit.edu' },
    });
    console.log('✅ Institution: SFIT');

    // ─── 2. Admin Users ─────────────────────────────────
    const adminPass = await bcrypt.hash('Admin@123', 12);
    await prisma.user.create({
        data: { email: 'vikram.desai@sfit.edu', password: adminPass, name: 'Dr. Vikram Desai', role: 'ADMIN', institutionId: inst.id },
    });
    await prisma.user.create({
        data: { email: 'meera.nair@sfit.edu', password: adminPass, name: 'Prof. Meera Nair', role: 'ADMIN', institutionId: inst.id },
    });
    console.log('✅ Admins: 2 admin users created');

    const hashedFacultyPass = await bcrypt.hash('Faculty@123', 12);
    const hashedStudentPass = await bcrypt.hash('Student@123', 12);

    const allDeptData = []; // store { dept, batches[], faculty[], subjects[] }
    let globalFacultyNum = 0;
    let globalStudentNum = 0;
    const usedEmails = new Set();

    function makeEmail(name, domain = 'sfit.edu') {
        let base = name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).join('.');
        if (base.startsWith('prof.') || base.startsWith('dr.')) base = base.replace(/^(prof|dr)\./, '');
        base = base.replace(/^\./, '');
        let email = `${base}@${domain}`;
        let i = 2;
        while (usedEmails.has(email)) { email = `${base}${i}@${domain}`; i++; }
        usedEmails.add(email);
        return email;
    }

    // Reserve admin + mock user emails so auto-generation never collides
    usedEmails.add('vikram.desai@sfit.edu');
    usedEmails.add('meera.nair@sfit.edu');
    usedEmails.add('vikram.kapoor@sfit.edu');
    usedEmails.add('rhea.joshi@sfit.edu');
    usedEmails.add('prashant.nair@sfit.edu');
    usedEmails.add('neha.singh2@sfit.edu');
    usedEmails.add('dr.sharma@sfit.edu');

    // ─── Mock users to inject into AI/ML department ─────────
    // These must match the MOCK_USERS in AuthContext.jsx exactly
    const MOCK_STUDENTS = [
        { email: 'vikram.kapoor@sfit.edu', name: 'Vikram Kapoor', roll: 'AIML001', section: 'A', phone: '+91 98765 43210', initial: 'V', color: '#EA580C' },
        { email: 'rhea.joshi@sfit.edu', name: 'Rhea Joshi', roll: 'AIML002', section: 'A', phone: '+91 98765 43211', initial: 'R', color: '#2563EB' },
        { email: 'prashant.nair@sfit.edu', name: 'Prashant Nair', roll: 'AIML003', section: 'A', phone: '+91 98765 43212', initial: 'P', color: '#D946EF' },
        { email: 'neha.singh2@sfit.edu', name: 'Neha Singh', roll: 'AIML004', section: 'A', phone: '+91 98765 43213', initial: 'N', color: '#EC4899' },
    ];
    const MOCK_FACULTY = { email: 'dr.sharma@sfit.edu', name: 'Dr. Amit Sharma', designation: 'Associate Professor', room: 'Room 305', phone: '+91 98765 00001', rating: 4.7, employeeId: 'FAC001' };

    // ─── 3. Create Departments, Faculty, Subjects, Batches, Students ───
    // Historical subjects will be created per-department (departmentId is required)
    for (const deptDef of DEPARTMENTS) {
        const dept = await prisma.department.create({
            data: { name: deptDef.name, code: deptDef.code, institutionId: inst.id },
        });

        // Create Faculty
        const deptFaculty = [];
        for (let fi = 0; fi < deptDef.faculty.length; fi++) {
            globalFacultyNum++;
            const fd = deptDef.faculty[fi];
            const email = makeEmail(fd.name);
            const user = await prisma.user.create({
                data: { email, password: hashedFacultyPass, name: fd.name, role: 'FACULTY', institutionId: inst.id },
            });
            const fac = await prisma.faculty.create({
                data: {
                    userId: user.id,
                    employeeId: `F${String(globalFacultyNum).padStart(3, '0')}`,
                    designation: fd.designation,
                    room: ROOMS[fi % ROOMS.length],
                    rating: fd.rating,
                    departmentId: dept.id,
                },
            });
            deptFaculty.push(fac);
        }

        // For AI/ML department, inject the mock faculty (dr.sharma@sfit.edu)
        if (deptDef.code === 'AI/ML') {
            const mockFacUser = await prisma.user.create({
                data: { email: MOCK_FACULTY.email, password: hashedFacultyPass, name: MOCK_FACULTY.name, role: 'FACULTY', institutionId: inst.id },
            });
            const mockFac = await prisma.faculty.create({
                data: {
                    userId: mockFacUser.id,
                    employeeId: MOCK_FACULTY.employeeId,
                    designation: MOCK_FACULTY.designation,
                    room: MOCK_FACULTY.room,
                    phone: MOCK_FACULTY.phone,
                    rating: MOCK_FACULTY.rating,
                    departmentId: dept.id,
                },
            });
            deptFaculty.push(mockFac);
        }

        // Set HOD (first faculty)
        await prisma.department.update({ where: { id: dept.id }, data: { hodId: deptFaculty[0].id } });

        // Create Subjects for semester 6
        const deptSubjects = [];
        for (let si = 0; si < deptDef.subjects.length; si++) {
            const sd = deptDef.subjects[si];
            const subj = await prisma.subject.create({
                data: { name: sd.name, code: sd.code, shortName: sd.shortName, credits: sd.credits, semester: 6, departmentId: dept.id },
            });
            deptSubjects.push(subj);
        }

        // Create Historical Subjects for semesters 1-5 (per-department, since departmentId is required)
        const histSubjects = {}; // key: code -> subject record
        for (const [sem, subjects] of Object.entries(HISTORICAL)) {
            histSubjects[sem] = [];
            for (const s of subjects) {
                const subj = await prisma.subject.create({
                    data: { name: s.name, code: s.code, credits: s.credits, semester: parseInt(sem), departmentId: dept.id },
                });
                histSubjects[sem].push(subj);
            }
        }

        // Create 2 Batches (A, B)
        const deptBatches = [];
        for (const section of ['A', 'B']) {
            const batch = await prisma.batch.create({
                data: {
                    name: `${deptDef.code} ${section} 2024`,
                    year: 2024,
                    currentSemester: 6,
                    departmentId: dept.id,
                    institutionId: inst.id,
                },
            });
            deptBatches.push({ batch, section });

            // Faculty-Subject assignments for this batch
            for (let si = 0; si < deptSubjects.length; si++) {
                await prisma.facultySubject.create({
                    data: { facultyId: deptFaculty[si % deptFaculty.length].id, subjectId: deptSubjects[si].id, batchId: batch.id },
                });
            }
        }

        // For AI/ML dept, inject mock students into first batch (section A) first
        const deptStudents = [];
        if (deptDef.code === 'AI/ML' && deptBatches.length > 0) {
            const firstBatch = deptBatches[0].batch;
            for (const ms of MOCK_STUDENTS) {
                const user = await prisma.user.create({
                    data: { email: ms.email, password: hashedStudentPass, name: ms.name, role: 'STUDENT', institutionId: inst.id },
                });
                const student = await prisma.student.create({
                    data: {
                        userId: user.id,
                        rollNumber: ms.roll,
                        phone: ms.phone,
                        section: ms.section,
                        semester: 6,
                        departmentId: dept.id,
                        batchId: firstBatch.id,
                        avatarInitial: ms.initial,
                        avatarColor: ms.color,
                    },
                });
                deptStudents.push({ student, user, roll: ms.roll, batch: firstBatch, section: ms.section });
            }
        }

        // Create 60 Students per batch (random)
        for (const { batch, section } of deptBatches) {
            for (let si = 0; si < 60; si++) {
                globalStudentNum++;
                const fName = firstNames[(globalStudentNum - 1) % firstNames.length];
                const lName = lastNames[Math.floor((globalStudentNum - 1 + si) / 3) % lastNames.length];
                const fullName = `${fName} ${lName}`;
                const email = makeEmail(fullName);
                const rollNum = `${deptDef.code.replace('/', '')}${String(globalStudentNum).padStart(3, '0')}`;
                const color = colors[globalStudentNum % colors.length];

                const user = await prisma.user.create({
                    data: { email, password: hashedStudentPass, name: fullName, role: 'STUDENT', institutionId: inst.id },
                });
                const student = await prisma.student.create({
                    data: {
                        userId: user.id,
                        rollNumber: rollNum,
                        phone: `+91 9${randInt(1000, 9999)}0 ${randInt(10000, 99999)}`,
                        section,
                        semester: 6,
                        departmentId: dept.id,
                        batchId: batch.id,
                        avatarInitial: fName[0],
                        avatarColor: color,
                    },
                });
                deptStudents.push({ student, user, roll: rollNum, batch, section });
            }
        }

        allDeptData.push({ dept, faculty: deptFaculty, subjects: deptSubjects, batches: deptBatches, students: deptStudents, histSubjects });
        console.log(`✅ ${deptDef.code}: ${deptFaculty.length} faculty, ${deptSubjects.length} subjects, ${deptStudents.length} students`);
    }

    // ─── 5. Timetable (Mon-Fri 9-5 for all batches) ─────
    console.log('📅 Generating timetables...');
    for (const dd of allDeptData) {
        for (const { batch } of dd.batches) {
            // Each batch needs ~30 slots/week (6 subjects × ~5 classes)
            const subjectSlots = dd.subjects.map((s, i) => ({
                subject: s,
                faculty: dd.faculty[i % dd.faculty.length],
                needed: 5, // each subject ~5 slots/week
            }));

            for (const day of DAYS) {
                for (let slotIdx = 0; slotIdx < TIME_SLOTS.length; slotIdx++) {
                    // Find a subject that still needs slots
                    const available = subjectSlots.filter(ss => ss.needed > 0);
                    if (available.length === 0) break;

                    // Try each available subject until one fits (no conflict)
                    let placed = false;
                    for (const ss of available.sort(() => Math.random() - 0.5)) {
                        const room = ROOMS[randInt(0, ROOMS.length - 1)];
                        if (isSlotFree(ss.faculty.id, room, day, slotIdx)) {
                            const slotType = slotIdx % 3 === 2 ? 'LAB' : slotIdx % 5 === 4 ? 'TUTORIAL' : 'LECTURE';
                            await prisma.timetableSlot.create({
                                data: {
                                    batchId: batch.id,
                                    subjectId: ss.subject.id,
                                    facultyId: ss.faculty.id,
                                    day,
                                    startTime: TIME_SLOTS[slotIdx].start,
                                    endTime: TIME_SLOTS[slotIdx].end,
                                    room,
                                    type: slotType,
                                },
                            });
                            bookSlot(ss.faculty.id, room, day, slotIdx);
                            ss.needed--;
                            placed = true;
                            break;
                        }
                    }
                    // If nothing fits, leave slot empty (free period)
                }
            }
        }
    }
    console.log('✅ Timetable: Mon-Fri 9-5 schedules for all 10 batches');

    // ─── 6. Grades for all semesters ─────────────────────
    console.log('📊 Generating grades (this takes a moment)...');
    for (const dd of allDeptData) {
        for (const sd of dd.students) {
            let cumCredits = 0, cumPoints = 0;
            for (let sem = 1; sem <= 6; sem++) {
                const subjects = sem === 6 ? dd.subjects : (dd.histSubjects[sem] || []);
                const creditsList = sem === 6 ? dd.subjects.map(s => s.credits) : HISTORICAL[sem].map(s => s.credits);
                let semCredits = 0, semPoints = 0;

                for (let si = 0; si < subjects.length; si++) {
                    if (!subjects[si]) continue;
                    const g = weightedGrade();
                    const pts = gradePoints[g];
                    const cr = creditsList[si];
                    await prisma.grade.create({
                        data: { studentId: sd.student.id, subjectId: subjects[si].id, semester: sem, grade: g, points: pts, credits: cr },
                    });
                    semCredits += cr;
                    semPoints += pts * cr;
                }
                cumCredits += semCredits;
                cumPoints += semPoints;

                const sgpa = semCredits > 0 ? parseFloat((semPoints / semCredits).toFixed(1)) : 7.0;
                const cgpa = cumCredits > 0 ? parseFloat((cumPoints / cumCredits).toFixed(1)) : 7.0;

                await prisma.semesterResult.create({
                    data: {
                        studentId: sd.student.id,
                        semester: sem,
                        sgpa,
                        cgpa,
                        creditsEarned: semCredits,
                        ...(sem === 6 ? { rank: randInt(1, 600), totalStudents: 600, deptRank: randInt(1, 120), deptTotal: 120 } : {}),
                    },
                });
            }
        }
    }
    console.log('✅ Grades: 6 semesters × 600 students × 6 subjects');

    // ─── 7. Assignments ──────────────────────────────────
    console.log('📝 Generating assignments...');
    for (const dd of allDeptData) {
        const assignmentList = [];
        for (const { batch } of dd.batches) {
            for (let ai = 0; ai < 10; ai++) {
                const subj = dd.subjects[ai % dd.subjects.length];
                const fac = dd.faculty[ai % dd.faculty.length];
                const dueDate = new Date('2026-03-01');
                dueDate.setDate(dueDate.getDate() - ai * 3);
                const a = await prisma.assignment.create({
                    data: {
                        title: `${subj.shortName || subj.name.split(' ')[0]} Assignment ${ai + 1}`,
                        description: `Complete the ${subj.name} assignment.`,
                        subjectId: subj.id,
                        facultyId: fac.id,
                        batchId: batch.id,
                        dueDate,
                        status: 'PUBLISHED',
                    },
                });
                assignmentList.push({ assignment: a, batchId: batch.id });
            }
        }

        // Submissions
        for (const sd of dd.students) {
            const studentAssignments = assignmentList.filter(al => al.batchId === sd.batch.id);
            for (const al of studentAssignments) {
                if (Math.random() > 0.3) { // 70% submission rate
                    const submDate = new Date(al.assignment.dueDate);
                    submDate.setDate(submDate.getDate() - randInt(1, 3));
                    await prisma.submission.create({
                        data: { assignmentId: al.assignment.id, studentId: sd.student.id, submittedAt: submDate },
                    });
                }
            }
        }
    }
    console.log('✅ Assignments: 10 per batch with submissions');

    // ─── 8. Career Data ──────────────────────────────────
    const opportunities = [
        { company: 'Google', initial: 'G', color: '#4285F4', role: 'ML Engineer Intern', location: 'Bangalore', type: 'Internship', deadline: '2026-03-15', matchScore: 92 },
        { company: 'Microsoft', initial: 'M', color: '#0078D4', role: 'AI Research Intern', location: 'Hyderabad', type: 'Internship', deadline: '2026-03-20', matchScore: 87 },
        { company: 'Amazon', initial: 'A', color: '#FF9900', role: 'Data Scientist', location: 'Mumbai', type: 'Full Time', deadline: '2026-03-10', matchScore: 85 },
        { company: 'NVIDIA', initial: 'N', color: '#76B900', role: 'Deep Learning Engineer', location: 'Pune', type: 'Full Time', deadline: '2026-03-25', matchScore: 90 },
        { company: 'OpenAI', initial: 'O', color: '#412991', role: 'Research Engineer', location: 'Remote', type: 'Internship', deadline: '2026-04-01', matchScore: 88 },
        { company: 'Flipkart', initial: 'F', color: '#2874F0', role: 'ML Platform Eng', location: 'Bangalore', type: 'Full Time', deadline: '2026-03-30', matchScore: 80 },
        { company: 'Razorpay', initial: 'R', color: '#2D68FF', role: 'AI/ML Intern', location: 'Bangalore', type: 'Internship', deadline: '2026-03-12', matchScore: 83 },
        { company: 'TCS', initial: 'T', color: '#0066B3', role: 'Digital Engineer', location: 'Multiple', type: 'Full Time', deadline: '2026-04-05', matchScore: 75 },
        { company: 'Infosys', initial: 'I', color: '#007CC3', role: 'Systems Engineer', location: 'Multiple', type: 'Full Time', deadline: '2026-04-10', matchScore: 72 },
        { company: 'Wipro', initial: 'W', color: '#3A1078', role: 'Project Engineer', location: 'Multiple', type: 'Full Time', deadline: '2026-04-15', matchScore: 70 },
    ];
    const oppMap = {};
    for (const o of opportunities) {
        const opp = await prisma.careerOpportunity.create({
            data: { company: o.company, initial: o.initial, color: o.color, role: o.role, location: o.location, type: o.type, deadline: new Date(o.deadline), matchScore: o.matchScore },
        });
        oppMap[o.company] = opp;
    }

    const events = [
        { name: 'Google AI On-Campus Drive', date: '2026-03-05', time: '10:00 AM', venue: 'Auditorium' },
        { name: 'Resume Building Workshop', date: '2026-03-08', time: '2:00 PM', venue: 'Room 301' },
        { name: 'Mock Interview Session', date: '2026-03-12', time: '11:00 AM', venue: 'Lab 201' },
        { name: 'NVIDIA Tech Talk: GPU Computing', date: '2026-03-18', time: '3:00 PM', venue: 'Seminar Hall' },
        { name: 'TCS CodeVita Contest', date: '2026-03-22', time: '9:00 AM', venue: 'Lab 301' },
    ];
    for (const e of events) {
        await prisma.careerEvent.create({ data: { name: e.name, date: new Date(e.date), time: e.time, venue: e.venue } });
    }

    const statuses = ['Under Review', 'Interview Scheduled', 'Offer Received', 'Rejected'];
    const statusClasses = ['review', 'interview', 'offer', 'rejected'];
    const companies = Object.keys(oppMap);

    // Give ~30% of students career applications
    for (const dd of allDeptData) {
        for (const sd of dd.students) {
            if (Math.random() > 0.7) continue; // skip 30%
            const numApps = randInt(1, 4);
            const chosenCompanies = companies.sort(() => Math.random() - 0.5).slice(0, numApps);
            for (const company of chosenCompanies) {
                const si = randInt(0, 3);
                await prisma.careerApplication.create({
                    data: { studentId: sd.student.id, opportunityId: oppMap[company].id, status: statuses[si], statusClass: statusClasses[si] },
                });
            }

            // Skills
            const skillNames = ['Python', 'JavaScript', 'Machine Learning', 'Data Analysis', 'Cloud Computing', 'Docker', 'SQL', 'DSA', 'Communication', 'Teamwork'];
            const numSkills = randInt(3, 6);
            for (let i = 0; i < numSkills; i++) {
                const pct = randInt(30, 95);
                await prisma.studentSkill.create({
                    data: { studentId: sd.student.id, name: skillNames[i], percentage: pct, level: pct >= 75 ? 'advanced' : pct >= 50 ? 'intermediate' : 'beginner' },
                });
            }
        }
    }
    console.log('✅ Career: Opportunities, events, applications, skills');

    // ─── 9. Notifications ─────────────────────────────────
    const notifTemplates = [
        { icon: '📝', type: 'INFO', text: 'New assignment posted' },
        { icon: '📊', type: 'SUCCESS', text: 'Your CGPA has been updated' },
        { icon: '📅', type: 'WARNING', text: 'Timetable changed for tomorrow' },
        { icon: '🎯', type: 'INFO', text: 'New job opportunity matches your profile' },
        { icon: '📚', type: 'INFO', text: 'Library book due in 3 days' },
    ];
    for (const dd of allDeptData) {
        for (const sd of dd.students) {
            const numNotifs = randInt(2, 5);
            for (let i = 0; i < numNotifs; i++) {
                const t = notifTemplates[i % notifTemplates.length];
                await prisma.notification.create({
                    data: { userId: sd.user.id, icon: t.icon, type: t.type, text: t.text },
                });
            }
        }
    }
    console.log('✅ Notifications: 2-5 per student');

    // ─── 10. Notes ─────────────────────────────────────────
    for (const dd of allDeptData) {
        // Only create notes for first 10 students per dept to keep seed fast
        for (const sd of dd.students.slice(0, 10)) {
            for (const subj of dd.subjects.slice(0, 3)) {
                const folder = await prisma.noteFolder.create({
                    data: { studentId: sd.student.id, name: subj.name },
                });
                for (let n = 0; n < randInt(2, 4); n++) {
                    await prisma.note.create({
                        data: {
                            folderId: folder.id,
                            title: `${subj.shortName || subj.name.split(' ')[0]} - Note ${n + 1}`,
                            content: `Study notes for ${subj.name} lecture ${n + 1}`,
                            subject: subj.shortName || subj.name.split(' ')[0],
                            bookmarked: Math.random() > 0.7,
                        },
                    });
                }
            }
        }
    }
    console.log('✅ Notes: Folders and notes created');

    // ─── 11. Fees ──────────────────────────────────────────
    const feeTypes = [
        { type: 'TUITION', label: 'Tuition Fee - Semester 6', amount: 75000 },
        { type: 'EXAM', label: 'Exam Fee - Semester 6', amount: 5000 },
        { type: 'LIBRARY', label: 'Library Fee - Annual', amount: 3000 },
        { type: 'LAB', label: 'Lab Fee - Semester 6', amount: 8000 },
    ];
    for (const dd of allDeptData) {
        for (const sd of dd.students) {
            for (const ft of feeTypes) {
                const isPaid = Math.random() > 0.3;
                const fee = await prisma.fee.create({
                    data: {
                        studentId: sd.student.id, type: ft.type, label: ft.label, amount: ft.amount,
                        semester: 6, dueDate: new Date('2026-03-31'),
                        status: isPaid ? 'PAID' : (Math.random() > 0.5 ? 'PENDING' : 'OVERDUE'),
                    },
                });
                if (isPaid) {
                    await prisma.payment.create({
                        data: { feeId: fee.id, amount: ft.amount, method: pick(['UPI', 'NEFT', 'Card']), transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 6)}` },
                    });
                }
            }
        }
    }
    console.log('✅ Fees: Fee records and payments for all students');

    // ─── 12. Library Books ─────────────────────────────────
    const books = [
        { title: 'Pattern Recognition and Machine Learning', author: 'Christopher Bishop', isbn: '978-0387310732', category: 'AI/ML', year: 2006, copies: 8, coverColor: '#2563EB' },
        { title: 'Deep Learning', author: 'Ian Goodfellow', isbn: '978-0262035613', category: 'AI/ML', year: 2016, copies: 6, coverColor: '#7C3AED' },
        { title: 'Speech and Language Processing', author: 'Daniel Jurafsky', isbn: '978-0131873216', category: 'NLP', year: 2008, copies: 5, coverColor: '#059669' },
        { title: 'Computer Vision: Algorithms and Applications', author: 'Richard Szeliski', isbn: '978-1848829343', category: 'CV', year: 2010, copies: 5, coverColor: '#DC2626' },
        { title: 'Introduction to Algorithms', author: 'Thomas Cormen', isbn: '978-0262033848', category: 'DSA', year: 2009, copies: 10, coverColor: '#D97706' },
        { title: 'Computer Networks', author: 'Andrew Tanenbaum', isbn: '978-0132126953', category: 'Networks', year: 2010, copies: 8, coverColor: '#0891B2' },
        { title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '978-1118063330', category: 'OS', year: 2012, copies: 8, coverColor: '#EA580C' },
        { title: 'Database System Concepts', author: 'Korth & Sudarshan', isbn: '978-0073523323', category: 'DBMS', year: 2010, copies: 6, coverColor: '#4F46E5' },
        { title: 'Engineering Thermodynamics', author: 'P.K. Nag', isbn: '978-0070681132', category: 'Mechanical', year: 2013, copies: 6, coverColor: '#F97316' },
        { title: 'Electronic Devices and Circuits', author: 'Boylestad', isbn: '978-0132622264', category: 'Electronics', year: 2012, copies: 5, coverColor: '#14B8A6' },
        { title: 'Hands-On Machine Learning', author: 'Aurélien Géron', isbn: '978-1492032649', category: 'AI/ML', year: 2019, copies: 7, coverColor: '#D946EF' },
        { title: 'Python Data Science Handbook', author: 'Jake VanderPlas', isbn: '978-1491912058', category: 'Data Science', year: 2016, copies: 6, coverColor: '#6366F1' },
    ];
    const bookRecords = [];
    for (const b of books) {
        const book = await prisma.libraryBook.create({
            data: { title: b.title, author: b.author, isbn: b.isbn, category: b.category, year: b.year, copies: b.copies, available: b.copies, coverColor: b.coverColor },
        });
        bookRecords.push(book);
    }

    // Issue books to ~50 random students
    const allStudentsFlat = allDeptData.flatMap(dd => dd.students);
    for (let i = 0; i < 50; i++) {
        const sd = allStudentsFlat[randInt(0, allStudentsFlat.length - 1)];
        const book = bookRecords[randInt(0, bookRecords.length - 1)];
        if (book.available > 0) {
            await prisma.bookIssue.create({
                data: { bookId: book.id, studentId: sd.student.id, dueDate: new Date('2026-03-20') },
            });
            await prisma.libraryBook.update({ where: { id: book.id }, data: { available: book.available - 1 } });
            book.available--;
        }
    }
    console.log('✅ Library: 12 books with ~50 student issues');

    // ─── 13. Forum Posts ───────────────────────────────────
    const forumTopics = [
        { title: 'Best resources for DSA practice?', content: 'Looking for good online platforms and books for competitive programming.', category: 'Academic' },
        { title: 'Tips for ML interview preparation', content: 'Has anyone cleared ML interviews at top companies? Share your experience!', category: 'Career' },
        { title: 'Study group for semester exams', content: 'Who wants to form a study group for the upcoming end-sem exams?', category: 'Academic' },
        { title: 'Hackathon team formation', content: 'Looking for teammates for the upcoming hackathon. Need frontend and backend devs.', category: 'Technical' },
        { title: 'GPU access for deep learning?', content: 'Does anyone know how to get free GPU credits for training models?', category: 'Technical' },
        { title: 'Placement preparation strategy', content: 'Sharing my 3-month prep plan that helped me crack Google.', category: 'Career' },
        { title: 'Project ideas for portfolio', content: 'What projects should I build to make my resume stand out?', category: 'Academic' },
        { title: 'Best laptop for engineering?', content: 'Planning to buy a new laptop. Suggestions for coding and ML workloads?', category: 'General' },
        { title: 'Internship vs full-time dilemma', content: 'Should I take the internship offer or wait for full-time roles?', category: 'Career' },
        { title: 'Sports day volunteers needed', content: 'The college sports day is coming up. Sign up to volunteer!', category: 'General' },
    ];

    for (const fp of forumTopics) {
        const sd = allStudentsFlat[randInt(0, allStudentsFlat.length - 1)];
        const post = await prisma.forumPost.create({
            data: { studentId: sd.student.id, title: fp.title, content: fp.content, category: fp.category, likes: randInt(0, 20) },
        });
        // Add 2-4 replies
        for (let ri = 0; ri < randInt(2, 4); ri++) {
            const replier = allStudentsFlat[randInt(0, allStudentsFlat.length - 1)];
            await prisma.forumReply.create({
                data: { postId: post.id, studentId: replier.student.id, content: 'Great question! Here are my thoughts...' },
            });
        }
    }
    console.log('✅ Forum: 10 posts with replies');

    // ─── 14. Exams ─────────────────────────────────────────
    for (const dd of allDeptData) {
        for (const { batch } of dd.batches) {
            for (let ei = 0; ei < dd.subjects.length; ei++) {
                const examDate = new Date('2026-03-15');
                examDate.setDate(examDate.getDate() + ei * 2);
                await prisma.exam.create({
                    data: {
                        subjectId: dd.subjects[ei].id,
                        batchId: batch.id,
                        type: 'ENDTERM',
                        date: examDate,
                        startTime: '10:00',
                        endTime: '13:00',
                        room: `Hall ${String.fromCharCode(65 + (ei % 4))}`,
                    },
                });
            }
        }
    }
    console.log('✅ Exams: End-term schedule for all batches');

    // ─── 15. Announcements ─────────────────────────────────
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const announcementData = [
        { title: 'End Semester Exam Schedule Released', content: 'The end semester examination schedule for Semester 6 has been published. Check your timetable.', priority: 'HIGH' },
        { title: 'Library Hours Extended', content: 'Library will remain open until 10 PM during exam season (March 10-30).', priority: 'NORMAL' },
        { title: 'Google AI On-Campus Drive', content: 'Google will be conducting an on-campus recruitment drive on March 5, 2026. Eligible branches: CS, IT, AI/ML.', priority: 'URGENT' },
        { title: 'Fee Payment Deadline', content: 'Last date for semester 6 fee payment is March 31, 2026. Late fee of ₹500 will apply.', priority: 'HIGH' },
        { title: 'Annual Sports Day', content: 'Annual sports day will be held on March 28, 2026. All students are encouraged to participate.', priority: 'LOW' },
    ];
    for (const a of announcementData) {
        await prisma.announcement.create({
            data: { title: a.title, content: a.content, priority: a.priority, createdBy: adminUser.id },
        });
    }
    console.log('✅ Announcements: 5 announcements created');

    // ─── 16. Attendance (Last 30 Days) ─────────────────────
    console.log('📅 Generating attendance for the last 30 days...');
    const today = new Date();
    const pastDates = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Set time to noon to avoid timezone issues with dates
        d.setHours(12, 0, 0, 0);
        pastDates.push(d);
    }
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    const allTimetableSlots = await prisma.timetableSlot.findMany();
    const slotsByBatchDay = {};
    for (const slot of allTimetableSlots) {
        if (!slotsByBatchDay[slot.batchId]) slotsByBatchDay[slot.batchId] = {};
        if (!slotsByBatchDay[slot.batchId][slot.day]) slotsByBatchDay[slot.batchId][slot.day] = [];
        slotsByBatchDay[slot.batchId][slot.day].push(slot);
    }

    let attendanceData = [];
    for (const dd of allDeptData) {
        for (const sd of dd.students) {
            for (const date of pastDates) {
                const dayName = dayNames[date.getDay()];
                const daySlots = (slotsByBatchDay[sd.batch.id] && slotsByBatchDay[sd.batch.id][dayName]) || [];

                const insertedSubjectsForDate = new Set();

                for (const slot of daySlots) {
                    if (insertedSubjectsForDate.has(slot.subjectId)) continue;
                    insertedSubjectsForDate.add(slot.subjectId);

                    const rand = Math.random();
                    let status = 'PRESENT';
                    if (rand > 0.9) status = 'ABSENT';
                    else if (rand > 0.8) status = 'LATE';

                    attendanceData.push({
                        studentId: sd.student.id,
                        subjectId: slot.subjectId,
                        facultyId: slot.facultyId,
                        batchId: sd.batch.id,
                        date: date,
                        status: status,
                        markedAt: date,
                    });

                    if (attendanceData.length >= 10000) {
                        await prisma.attendance.createMany({ data: attendanceData });
                        attendanceData = [];
                    }
                }
            }
        }
    }
    if (attendanceData.length > 0) {
        await prisma.attendance.createMany({ data: attendanceData });
    }
    console.log('✅ Attendance: 30 days generated for all students');

    // ─── Done ───────────────────────────────────────────────
    const counts = {
        students: await prisma.student.count(),
        faculty: await prisma.faculty.count(),
        departments: await prisma.department.count(),
        batches: await prisma.batch.count(),
        timetableSlots: await prisma.timetableSlot.count(),
        subjects: await prisma.subject.count(),
    };

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('────────────────────────────────────────────');
    console.log(`📊 Stats: ${counts.students} students, ${counts.faculty} faculty, ${counts.departments} departments, ${counts.batches} batches, ${counts.timetableSlots} timetable slots, ${counts.subjects} subjects`);
    console.log('────────────────────────────────────────────');
    console.log('Test Credentials (matching AuthContext MOCK_USERS):');
    console.log('Admin    - Email: vikram.desai@sfit.edu    | Pass: Admin@123');
    console.log('Admin    - Email: meera.nair@sfit.edu      | Pass: Admin@123');
    console.log('Faculty  - Email: dr.sharma@sfit.edu       | Pass: Faculty@123');
    console.log('Student  - Email: vikram.kapoor@sfit.edu   | Pass: Student@123');
    console.log('Student  - Email: rhea.joshi@sfit.edu      | Pass: Student@123');
    console.log('Student  - Email: prashant.nair@sfit.edu   | Pass: Student@123');
    console.log('Student  - Email: neha.singh2@sfit.edu     | Pass: Student@123');
    console.log('────────────────────────────────────────────');
}

main()
    .catch((e) => {
        console.error('❌ SEED ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
