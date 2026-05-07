import { useState } from 'react'

const examData = [
    { subject: 'Machine Learning', code: 'AIML301', date: 'Mar 15, 2026', time: '10:00 AM - 1:00 PM', venue: 'Hall A', syllabus: 95, type: 'End Sem' },
    { subject: 'Deep Learning', code: 'AIML302', date: 'Mar 18, 2026', time: '10:00 AM - 1:00 PM', venue: 'Hall B', syllabus: 88, type: 'End Sem' },
    { subject: 'Natural Language Processing', code: 'AIML303', date: 'Mar 21, 2026', time: '10:00 AM - 1:00 PM', venue: 'Hall A', syllabus: 75, type: 'End Sem' },
    { subject: 'Computer Vision', code: 'AIML304', date: 'Mar 24, 2026', time: '2:00 PM - 5:00 PM', venue: 'Lab 301', syllabus: 80, type: 'Practical' },
    { subject: 'Data Structures & Algorithms', code: 'AIML305', date: 'Mar 27, 2026', time: '10:00 AM - 1:00 PM', venue: 'Hall A', syllabus: 100, type: 'End Sem' },
    { subject: 'Probability & Statistics', code: 'MA301', date: 'Mar 30, 2026', time: '10:00 AM - 1:00 PM', venue: 'Hall C', syllabus: 70, type: 'End Sem' },
]

function daysUntil(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    return diff
}

function ExamsPage() {
    const [filter, setFilter] = useState('all')

    const filtered = filter === 'practical'
        ? examData.filter(e => e.type === 'Practical')
        : filter === 'theory'
            ? examData.filter(e => e.type === 'End Sem')
            : examData

    return (
        <div>
            <div className="dashboard-header">
                <h1>Exam Schedule</h1>
                <div className="header-right">
                    <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>Semester 6 • End Semester Exams 2026</span>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📝</div>
                    <div className="dash-stat-info">
                        <h3>{examData.length}</h3>
                        <p>Total Exams</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info">
                        <h3>{examData.filter(e => e.syllabus >= 90).length}</h3>
                        <p>Syllabus Complete</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">⏳</div>
                    <div className="dash-stat-info">
                        <h3>{Math.max(0, daysUntil(examData[0].date))}</h3>
                        <p>Days to First Exam</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">📊</div>
                    <div className="dash-stat-info">
                        <h3>{Math.round(examData.reduce((a, e) => a + e.syllabus, 0) / examData.length)}%</h3>
                        <p>Avg Syllabus Done</p>
                    </div>
                </div>
            </div>

            <div className="filter-tabs" role="tablist" aria-label="Exam type filter">
                {['all', 'theory', 'practical'].map(f => (
                    <button key={f} role="tab" aria-selected={filter === f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? 'All Exams' : f === 'theory' ? 'Theory' : 'Practical'}
                    </button>
                ))}
            </div>

            <div className="dash-card">
                <table className="faculty-table" aria-label="Exam schedule" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Venue</th>
                            <th>Type</th>
                            <th>Syllabus</th>
                            <th>Countdown</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((exam, i) => {
                            const days = daysUntil(exam.date)
                            return (
                                <tr key={i}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{exam.subject}</div>
                                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{exam.code}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{exam.date}</td>
                                    <td>{exam.time}</td>
                                    <td>{exam.venue}</td>
                                    <td>
                                        <span className={`status-badge ${exam.type === 'Practical' ? 'warning' : 'safe'}`}>
                                            {exam.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 60, height: 6, borderRadius: 3,
                                                background: 'var(--gray-200)', overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${exam.syllabus}%`, height: '100%', borderRadius: 3,
                                                    background: exam.syllabus >= 90 ? 'var(--success)' : exam.syllabus >= 70 ? 'var(--warning)' : 'var(--danger)'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{exam.syllabus}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700, fontSize: 13,
                                            color: days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {days > 0 ? `${days} days` : days === 0 ? 'Today!' : 'Passed'}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ExamsPage
