import downloadCSV from './downloadCSV'

export default function AdminStudentsTab({ allStudents, selectedStudent, setSelectedStudent, showToast }) {
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

    if (selectedStudent) {
        const st = selectedStudent
        return (
            <>
                <div className="dashboard-header">
                    <h1><button aria-label="Back to students list" onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, marginRight: 8, color: 'var(--gray-500)' }}>←</button>{st.name}</h1>
                    <div className="header-right"><button className="btn-view" onClick={exportStudents}>Export CSV</button></div>
                </div>
                <div className="stats-row">
                    <div className="dash-stat-card"><div className="dash-stat-icon blue">📅</div><div className="dash-stat-info"><h3>{st.stats.attendance}%</h3><p>Attendance</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon green">🎓</div><div className="dash-stat-info"><h3>{st.stats.cgpa}</h3><p>CGPA</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon purple">📝</div><div className="dash-stat-info"><h3>{st.stats.assignmentsCompleted}/{st.stats.assignmentsTotal}</h3><p>Assignments</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon yellow">🚀</div><div className="dash-stat-info"><h3>{st.stats.careerScore}</h3><p>Career Score</p></div></div>
                </div>
                <div className="dashboard-grid">
                    <div className="dash-card">
                        <h2>Student Information</h2>
                        <div className="modal-body">
                            <div className="detail-row"><span className="detail-label">Roll No</span><span className="detail-value">{st.roll}</span></div>
                            <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{st.email}</span></div>
                            <div className="detail-row"><span className="detail-label">Semester</span><span className="detail-value">{st.semester}</span></div>
                            <div className="detail-row"><span className="detail-label">Section</span><span className="detail-value">{st.section}</span></div>
                            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{st.phone}</span></div>
                        </div>
                    </div>
                    <div className="dash-card">
                        <h2>Academic Standing</h2>
                        <div className="modal-body">
                            <div className="detail-row"><span className="detail-label">CGPA</span><span className="detail-value" style={{ color: 'var(--success)' }}>{st.stats.cgpa}</span></div>
                            <div className="detail-row"><span className="detail-label">CGPA Trend</span><span className="detail-value">{st.stats.cgpaTrend}</span></div>
                            <div className="detail-row"><span className="detail-label">Attendance</span><span className="detail-value" style={{ color: st.stats.attendance < 80 ? 'var(--danger)' : 'var(--success)' }}>{st.stats.attendance}%</span></div>
                            <div className="detail-row"><span className="detail-label">Career Score</span><span className="detail-value">{st.stats.careerScore}/100 {st.stats.careerScoreTrend}</span></div>
                            <div className="detail-row"><span className="detail-label">Status</span><span className={`status-badge ${st.stats.attendance < 80 ? 'danger' : 'safe'}`}>{st.stats.attendance < 80 ? 'At Risk' : 'Good Standing'}</span></div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Student Management</h1>
                <div className="header-right"><button className="btn-view" onClick={exportStudents}>📥 Export CSV</button></div>
            </div>
            <div className="stats-row">
                <div className="dash-stat-card"><div className="dash-stat-icon blue">👨‍🎓</div><div className="dash-stat-info"><h3>{allStudents.length}</h3><p>AI/ML Students</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon green">📊</div><div className="dash-stat-info"><h3>{(allStudents.reduce((s, st) => s + st.stats.attendance, 0) / allStudents.length).toFixed(0)}%</h3><p>Avg Attendance</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon purple">🎓</div><div className="dash-stat-info"><h3>{(allStudents.reduce((s, st) => s + st.stats.cgpa, 0) / allStudents.length).toFixed(1)}</h3><p>Avg CGPA</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon yellow">🚀</div><div className="dash-stat-info"><h3>{(allStudents.reduce((s, st) => s + st.stats.careerScore, 0) / allStudents.length).toFixed(0)}</h3><p>Avg Career Score</p></div></div>
            </div>
            <div className="dash-card">
                <h2>All Students</h2>
                <table className="faculty-table" aria-label="All students">
                    <thead>
                        <tr><th>Student</th><th>Roll No</th><th>Attendance</th><th>CGPA</th><th>Assignments</th><th>Career Score</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {allStudents.map(st => (
                            <tr key={st.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(st)}>
                                <td><div className="faculty-name"><div className="faculty-avatar" style={{ background: st.avatar.color, color: '#fff' }}>{st.avatar.initial}</div>{st.name}</div></td>
                                <td>{st.roll}</td>
                                <td style={{ fontWeight: 700, color: st.stats.attendance < 80 ? '#EF4444' : '#22C55E' }}>{st.stats.attendance}%</td>
                                <td style={{ fontWeight: 700 }}>{st.stats.cgpa}</td>
                                <td>{st.stats.assignmentsCompleted}/{st.stats.assignmentsTotal}</td>
                                <td>{st.stats.careerScore}/100</td>
                                <td><span className={`status-badge ${st.stats.attendance < 80 || st.stats.cgpa < 7.5 ? 'danger' : st.stats.attendance < 85 ? 'warning' : 'safe'}`}>{st.stats.attendance < 80 || st.stats.cgpa < 7.5 ? 'At Risk' : st.stats.attendance < 85 ? 'Warning' : 'Good'}</span></td>
                                <td><button className="btn-view" onClick={e => { e.stopPropagation(); setSelectedStudent(st) }}>Details →</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
