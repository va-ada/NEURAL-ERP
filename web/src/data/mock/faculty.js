// ============================================================
// Faculty + Subjects (AI/ML Department)
// ============================================================

export const faculty = [
    { id: 'F001', name: 'Prof. Amit Verma', subject: 'Machine Learning', dept: 'AI/ML', email: 'amit.verma@sfit.edu', room: 'Room 305', rating: 4.8 },
    { id: 'F002', name: 'Dr. Priya Sharma', subject: 'Deep Learning', dept: 'AI/ML', email: 'priya.sharma@sfit.edu', room: 'Room 402', rating: 4.9 },
    { id: 'F003', name: 'Dr. Sarah Johnson', subject: 'Natural Language Processing', dept: 'AI/ML', email: 'sarah.johnson@sfit.edu', room: 'Room 201', rating: 4.7 },
    { id: 'F004', name: 'Prof. Rajesh Kumar', subject: 'Computer Vision', dept: 'AI/ML', email: 'rajesh.kumar@sfit.edu', room: 'Room 301', rating: 4.6 },
    { id: 'F005', name: 'Dr. Rahul Mehta', subject: 'Data Structures & Algorithms', dept: 'AI/ML', email: 'rahul.mehta@sfit.edu', room: 'Lab 102', rating: 4.5 },
    { id: 'F006', name: 'Prof. Neha Singh', subject: 'Probability & Statistics', dept: 'AI/ML', email: 'neha.singh@sfit.edu', room: 'Room 201', rating: 4.7 },
]

export const subjects = [
    { code: 'AIML301', name: 'Machine Learning', shortName: 'ML', credits: 4, faculty: 'F001' },
    { code: 'AIML302', name: 'Deep Learning', shortName: 'DL', credits: 4, faculty: 'F002' },
    { code: 'AIML303', name: 'Natural Language Processing', shortName: 'NLP', credits: 3, faculty: 'F003' },
    { code: 'AIML304', name: 'Computer Vision', shortName: 'CV', credits: 4, faculty: 'F004' },
    { code: 'CS201', name: 'Data Structures & Algorithms', shortName: 'DSA', credits: 4, faculty: 'F005' },
    { code: 'MA301', name: 'Probability & Statistics', shortName: 'P&S', credits: 3, faculty: 'F006' },
]
