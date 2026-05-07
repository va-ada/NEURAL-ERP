import downloadCSV from './downloadCSV'

export default function AdminReportsTab({ allStudents, facultyList, placementCompanies, showToast }) {
    function exportStudents() {
        downloadCSV(
            allStudents.map(s => ({
                Name: s.name,
                Roll: s.roll,
                Attendance: s.stats.attendance,
                CGPA: s.stats.cgpa,
                Assignments: `${s.stats.assignmentsCompleted}/${s.stats.assignmentsTotal}`,
                CareerScore: s.stats.careerScore,
            })),
            'students_report.csv'
        )
        showToast('students_report.csv downloaded', 'success')
    }

    function exportFaculty() {
        downloadCSV(
            facultyList.map(f => ({
                Name: f.name,
                Subject: f.subject,
                Email: f.email,
                Room: f.room,
                Rating: f.rating,
            })),
            'faculty_report.csv'
        )
        showToast('faculty_report.csv downloaded', 'success')
    }

    function exportPlacements() {
        downloadCSV(
            placementCompanies.map(c => ({
                Company: c.company,
                Hired: c.hired,
                AvgPackage: c.avgPackage,
                Role: c.role,
                Status: c.status,
            })),
            'placement_report.csv'
        )
        showToast('placement_report.csv downloaded', 'success')
    }

    function exportAttendance() {
        downloadCSV(
            allStudents.map(s => ({
                Name: s.name,
                Roll: s.roll,
                'Attendance%': s.stats.attendance,
                Status: s.stats.attendance < 80 ? 'At Risk' : 'Good',
            })),
            'attendance_report.csv'
        )
        showToast('attendance_report.csv downloaded', 'success')
    }

    const reports = [
        { title: 'Student Performance Report', desc: 'Export all student data — attendance, CGPA, assignments, career score', icon: '👨‍🎓', action: exportStudents },
        { title: 'Faculty Report', desc: 'Export faculty list with subjects, ratings, and contact info', icon: '👨‍🏫', action: exportFaculty },
        { title: 'Placement Report', desc: 'Export placement data — companies, packages, offers', icon: '💼', action: exportPlacements },
        { title: 'Attendance Summary', desc: 'Export attendance statistics for all students', icon: '📅', action: exportAttendance },
    ]

    return (
        <>
            <div className="dashboard-header"><h1>Report Generation</h1></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {reports.map((r, i) => (
                    <div key={i} className="dash-card" style={{ cursor: 'pointer' }} onClick={r.action}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>{r.icon}</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{r.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{r.desc}</p>
                        <button className="btn-primary" onClick={e => { e.stopPropagation(); r.action() }}>📥 Download CSV</button>
                    </div>
                ))}
            </div>
        </>
    )
}
