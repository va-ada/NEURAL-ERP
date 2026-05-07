import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js'
import { useAuth } from '../../context/AuthContext'
import { attendanceAPI } from '../../services/api'
import { students as mockStudents } from '../../data/mockDatabase'
import { PageSkeleton } from '../../components/Skeleton'
import Modal from '../../components/Modal'
import '../Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 13 } }
        }
    },
    scales: {
        y: { stacked: true, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 12 } } }
    }
}

function AttendancePage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [calMonth, setCalMonth] = useState(new Date().getMonth())
    const [calYear] = useState(new Date().getFullYear())
    const [loading, setLoading] = useState(true)

    const [overall, setOverall] = useState(0)
    const [classesAttended, setClassesAttended] = useState(0)
    const [classesHeld, setClassesHeld] = useState(0)
    const [absentDays, setAbsentDays] = useState(0)
    const [thisMonth, setThisMonth] = useState(0)
    const [subjects, setSubjects] = useState([])
    const [recentLog, setRecentLog] = useState([])
    const [monthlyChart, setMonthlyChart] = useState(null)
    const [absentDates, setAbsentDates] = useState([])
    const [allRecords, setAllRecords] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const studentId = user.studentId
        const [statsRes, recordsRes] = await Promise.allSettled([
            attendanceAPI.getStats(`studentId=${studentId}`),
            attendanceAPI.getByStudent(studentId),
        ])

        const hasApiData = statsRes.status === 'fulfilled' || recordsRes.status === 'fulfilled'
        if (!hasApiData) {
            const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
            const att = mockStudent.attendance

            setOverall(att.overall)
            setClassesAttended(att.classesAttended)
            setClassesHeld(att.classesHeld)
            setAbsentDays(att.absentDays)
            setThisMonth(att.thisMonth)
            setSubjects(att.subjects)
            setRecentLog(att.recentLog)
            setMonthlyChart({
                labels: att.monthly.labels,
                present: att.monthly.present,
                absent: att.monthly.absent,
            })
            setAbsentDates(att.calendarAbsentDays)
            // For calendar, we don't have detailed records, so just set empty
            setAllRecords([])
            setLoading(false)
            return
        }

        if (statsRes.status === 'fulfilled') {
            const s = statsRes.value.stats || {}
            setOverall(Math.round(s.percentage || 0))
            setClassesAttended(s.present + (s.late || 0))
            setClassesHeld(s.total || 0)
            setAbsentDays(s.absent || 0)
        }

        if (recordsRes.status === 'fulfilled') {
            const records = recordsRes.value.attendance || []
            setAllRecords(records)

            // Monthly chart (last 6 months)
            const labels = [], presentArr = [], absentArr = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setDate(1)
                d.setMonth(d.getMonth() - i)
                const mo = d.getMonth(), yr = d.getFullYear()
                const recs = records.filter(r => {
                    const rd = new Date(r.date)
                    return rd.getMonth() === mo && rd.getFullYear() === yr
                })
                labels.push(d.toLocaleString('default', { month: 'short' }))
                presentArr.push(recs.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length)
                absentArr.push(recs.filter(r => r.status === 'ABSENT').length)
            }
            setMonthlyChart({ labels, present: presentArr, absent: absentArr })

            // This month %
            const now = new Date()
            const thisMonthRecs = records.filter(r => {
                const rd = new Date(r.date)
                return rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear()
            })
            const tmPresent = thisMonthRecs.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
            setThisMonth(thisMonthRecs.length > 0 ? Math.round((tmPresent / thisMonthRecs.length) * 100) : 0)

            // Subject-wise breakdown
            const subjectMap = {}
            for (const r of records) {
                const key = r.subject?.name || 'Unknown'
                if (!subjectMap[key]) subjectMap[key] = { name: key, held: 0, attended: 0 }
                subjectMap[key].held++
                if (r.status === 'PRESENT' || r.status === 'LATE') subjectMap[key].attended++
            }
            const subjectList = Object.values(subjectMap).map(s => ({
                ...s,
                pct: s.held > 0 ? Math.round((s.attended / s.held) * 100) : 0,
                status: s.held > 0 && (s.attended / s.held) >= 0.85 ? 'safe'
                    : s.held > 0 && (s.attended / s.held) >= 0.75 ? 'warning' : 'danger',
            }))
            setSubjects(subjectList)

            // Recent log (last 10)
            setRecentLog(records.slice(0, 10).map(r => ({
                date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                subject: r.subject?.name || '',
                status: r.status === 'PRESENT' || r.status === 'LATE' ? 'present' : 'absent',
            })))

            // Absent dates for calendar (current month)
            const absentDs = records
                .filter(r => {
                    const rd = new Date(r.date)
                    return r.status === 'ABSENT' && rd.getMonth() === new Date().getMonth() && rd.getFullYear() === new Date().getFullYear()
                })
                .map(r => new Date(r.date).getDate())
            setAbsentDates(absentDs)
        }

        setLoading(false)
    }

    const q = searchQuery.toLowerCase()
    const filteredSubjects = subjects.filter(s => !q || s.name.toLowerCase().includes(q))

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const calendarDays = (() => {
        const days = []
        const firstDay = new Date(calYear, calMonth, 1).getDay()
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
        const today = new Date()
        for (let i = 0; i < firstDay; i++) days.push({ day: null, type: 'empty' })
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(calYear, calMonth, d).getDay()
            const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
            let type = 'present'

            // Check if day has any records at all
            const dayRecords = allRecords.filter(r => {
                const rd = new Date(r.date)
                return rd.getDate() === d && rd.getMonth() === calMonth && rd.getFullYear() === calYear
            })
            const hasRecords = dayRecords.length > 0

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                type = 'weekend'
            } else if (!hasRecords) {
                type = 'empty' // no classes
            } else {
                const presentCount = dayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
                if (presentCount === 0) {
                    type = 'absent';
                } else if (presentCount === dayRecords.length) {
                    type = 'present';
                } else {
                    type = 'mixed';
                }
            }

            days.push({ day: d, type, isToday, hasRecords })
        }
        return days
    })()

    const monthlyData = monthlyChart ? {
        labels: monthlyChart.labels,
        datasets: [
            { label: 'Present', data: monthlyChart.present, backgroundColor: '#22C55E', borderRadius: 6, barThickness: 28 },
            { label: 'Absent', data: monthlyChart.absent, backgroundColor: '#EF4444', borderRadius: 6, barThickness: 28 },
        ]
    } : null

    if (loading) return <PageSkeleton />

    return (
        <>
            <div className="dashboard-header">
                <h1>Attendance</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search subjects..." aria-label="Search subjects" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📊</div>
                    <div className="dash-stat-info">
                        <h3>{overall}%</h3>
                        <p>Overall Attendance</p>
                        <div className={`trend ${overall >= 85 ? 'up' : 'down'}`}>
                            {overall >= 85 ? '↑ On track' : '↓ Below threshold'}
                        </div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info">
                        <h3>{classesAttended}/{classesHeld}</h3>
                        <p>Classes Attended</p>
                        <div className="trend up">This semester</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">📅</div>
                    <div className="dash-stat-info">
                        <h3>{thisMonth}%</h3>
                        <p>This Month</p>
                        <div className={`trend ${thisMonth >= 90 ? 'up' : 'down'}`}>
                            {thisMonth >= 90 ? '↑ Great' : '↓ Needs improvement'}
                        </div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">❌</div>
                    <div className="dash-stat-info">
                        <h3>{absentDays}</h3>
                        <p>Absent Days</p>
                        <div className="trend down">This semester</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Monthly Attendance Trend</h2>
                    <div className="chart-container">
                        {monthlyData
                            ? <Bar data={monthlyData} options={monthlyOptions} />
                            : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No data yet</p>
                        }
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Attendance Calendar</h2>
                    <div className="calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button className="btn-view" aria-label="Previous month" style={{ padding: '4px 12px', fontSize: 16 }} onClick={() => setCalMonth(m => Math.max(0, m - 1))} disabled={calMonth <= 0}>←</button>
                        <h3 style={{ margin: 0 }}>{monthNames[calMonth]} {calYear}</h3>
                        <button className="btn-view" aria-label="Next month" style={{ padding: '4px 12px', fontSize: 16 }} onClick={() => setCalMonth(m => Math.min(11, m + 1))} disabled={calMonth >= 11}>→</button>
                    </div>
                    <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="calendar-grid">
                        {calendarDays.map((d, i) => (
                            <div
                                key={i}
                                className={`cal-day ${d.type}${d.isToday ? ' today' : ''}${d.hasRecords ? ' clickable' : ''}`}
                                onClick={() => d.hasRecords && setSelectedDate(new Date(calYear, calMonth, d.day))}
                                style={{ cursor: d.hasRecords ? 'pointer' : 'default' }}
                                title={d.hasRecords ? 'Click to view details' : ''}
                            >
                                {d.day}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Subject-wise Attendance</h2>
                    {filteredSubjects.length > 0 ? (
                        <table className="faculty-table" aria-label="Subject-wise attendance">
                            <thead>
                                <tr><th>Subject</th><th>Held</th><th>Attended</th><th>Percentage</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.held}</td>
                                        <td>{s.attended}</td>
                                        <td style={{ fontWeight: 700 }}>{s.pct}%</td>
                                        <td>
                                            <span className={`status-badge ${s.status}`}>
                                                {s.status === 'safe' ? 'Safe' : s.status === 'warning' ? 'Warning' : 'Danger'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No subject data yet</p>}
                </div>

                <div className="dash-card">
                    <h2>Recent Attendance Log</h2>
                    {recentLog.length > 0
                        ? recentLog.map((log, i) => (
                            <div className="class-item" key={i}>
                                <div className={`attendance-dot ${log.status}`} />
                                <div className="class-time">{log.date}</div>
                                <div className="class-details">
                                    <h4>{log.subject}</h4>
                                    <p>{log.status === 'present' ? 'Present' : 'Absent'}</p>
                                </div>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No attendance records yet</p>
                    }
                </div>
            </div>

            {selectedDate && (
                <Modal isOpen={true} title={`Attendance for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`} onClose={() => setSelectedDate(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {allRecords
                            .filter(r => {
                                const rd = new Date(r.date)
                                return rd.getDate() === selectedDate.getDate() &&
                                    rd.getMonth() === selectedDate.getMonth() &&
                                    rd.getFullYear() === selectedDate.getFullYear()
                            })
                            .map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{r.subject?.name || 'Unknown Class'}</h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {r.slot || 'Regular Slot'}
                                        </p>
                                    </div>
                                    <span className={`status-badge ${r.status === 'PRESENT' || r.status === 'LATE' ? 'safe' : 'danger'}`}>
                                        {r.status === 'PRESENT' ? 'Present' : r.status === 'LATE' ? 'Late' : 'Absent'}
                                    </span>
                                </div>
                            ))}
                    </div>
                </Modal>
            )}
        </>
    )
}

export default AttendancePage
