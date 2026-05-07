import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useAuth } from '../../context/AuthContext'
import { attendanceAPI, gradeAPI, assignmentAPI, notificationAPI, timetableAPI, careerAPI } from '../../services/api'
import { students as mockStudents, timetable as mockTimetable, careerOpportunities as mockOpportunities } from '../../data/mockDatabase'
import { PageSkeleton } from '../../components/Skeleton'
import AIInsightsCard from '../../components/AIInsightsCard'
import AttendanceCard from './home/AttendanceCard'
import GradesCard from './home/GradesCard'
import CareerCard from './home/CareerCard'
import AnnouncementsCard from './home/AnnouncementsCard'
import '../Dashboard.css'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
)

// Map JS getDay() index → Prisma Day enum
const DAY_ENUM = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function StudentHome() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    const [stats, setStats] = useState({ attendance: 0, attendanceTrend: '—', cgpa: '0.00', cgpaTrend: '—', assignmentsTotal: 0, assignmentsCompleted: 0, careerScore: '—', careerScoreTrend: '—' })
    const [attChart, setAttChart] = useState(null)
    const [perfChart, setPerfChart] = useState(null)
    const [assignments, setAssignments] = useState([])
    const [notifications, setNotifications] = useState([])
    const [todayClasses, setTodayClasses] = useState([])
    const [opportunities, setOpportunities] = useState([])

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        const studentId = user.studentId
        const batchId = user.batch?.id
        const userId = user.id
        const semester = user.semester || 6
        const todayDay = DAY_ENUM[new Date().getDay()]

        const [
            attStatsRes,
            attRecordsRes,
            gradeStatsRes,
            gradesSemRes,
            assignmentsRes,
            notifsRes,
            timetableRes,
            careerRes,
        ] = await Promise.allSettled([
            attendanceAPI.getStats(`studentId=${studentId}`),
            attendanceAPI.getByStudent(studentId),
            gradeAPI.getStats(studentId),
            gradeAPI.getBySemester(studentId, semester),
            assignmentAPI.getAll(batchId ? `batchId=${batchId}` : ''),
            notificationAPI.get(userId),
            timetableAPI.getByBatch(batchId),
            careerAPI.getOpportunities(),
        ])

        // ── Mock data fallback if ALL API calls failed ─────
        const hasApiData = [attStatsRes, attRecordsRes, gradeStatsRes, gradesSemRes, assignmentsRes, notifsRes, timetableRes, careerRes].some(r => r.status === 'fulfilled')
        if (!hasApiData) {
            const mockStudentId = user.studentId || 'STU001'
            const mockStudent = mockStudents[mockStudentId] || mockStudents['STU001']
            if (mockStudent) {
                const s = mockStudent.stats
                setStats({
                    attendance: s.attendance,
                    attendanceTrend: s.attendanceTrend,
                    cgpa: s.cgpa.toFixed(2),
                    cgpaTrend: s.cgpaTrend,
                    assignmentsTotal: s.assignmentsTotal,
                    assignmentsCompleted: s.assignmentsCompleted,
                    careerScore: s.careerScore,
                    careerScoreTrend: s.careerScoreTrend,
                })
                setAttChart({
                    labels: mockStudent.attendance.monthly.labels,
                    present: mockStudent.attendance.monthly.present,
                    absent: mockStudent.attendance.monthly.absent,
                })
                setPerfChart({
                    labels: mockStudent.grades.currentSubjectScores.labels,
                    data: mockStudent.grades.currentSubjectScores.data,
                })
                setAssignments(mockStudent.assignments.slice(0, 4))
                setNotifications(mockStudent.notifications)
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const today = dayNames[new Date().getDay()]
                const todaySchedule = mockTimetable[today] || mockTimetable['Mon']
                setTodayClasses(
                    todaySchedule
                        .filter(s => s.type !== 'lunch' && s.type !== 'free')
                        .slice(0, 3)
                        .map(s => ({ time: s.time, subject: s.subject, prof: s.prof, room: s.room, type: s.type }))
                )
                setOpportunities(mockOpportunities.slice(0, 3))
                setLoading(false)
                return
            }
        }

        // ── Attendance stats ───────────────────────────────
        let attPct = 0
        if (attStatsRes.status === 'fulfilled') {
            attPct = Math.round(attStatsRes.value.stats?.percentage || 0)
        }

        // ── Attendance monthly chart ───────────────────────
        if (attRecordsRes.status === 'fulfilled') {
            const records = attRecordsRes.value.attendance || []
            const labels = [], presentArr = [], absentArr = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setDate(1)
                d.setMonth(d.getMonth() - i)
                const mo = d.getMonth(), yr = d.getFullYear()
                const monthRecs = records.filter(r => {
                    const rd = new Date(r.date)
                    return rd.getMonth() === mo && rd.getFullYear() === yr
                })
                labels.push(d.toLocaleString('default', { month: 'short' }))
                presentArr.push(monthRecs.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length)
                absentArr.push(monthRecs.filter(r => r.status === 'ABSENT').length)
            }
            setAttChart({ labels, present: presentArr, absent: absentArr })
        }

        // ── Grade stats ────────────────────────────────────
        let cgpa = 0, cgpaTrend = '—'
        if (gradeStatsRes.status === 'fulfilled') {
            const gs = gradeStatsRes.value
            cgpa = gs.cgpa || 0
            const trend = gs.cgpaTrend || []
            const last = trend[trend.length - 1]
            const prev = trend[trend.length - 2]
            cgpaTrend = last != null
                ? (prev != null && last >= prev ? `↑ ${last.toFixed(2)}` : `↓ ${last.toFixed(2)}`)
                : String(cgpa)
        }

        // ── Performance chart (current semester) ──────────
        if (gradesSemRes.status === 'fulfilled') {
            const grades = gradesSemRes.value.grades || []
            if (grades.length > 0) {
                setPerfChart({
                    labels: grades.map(g => g.subject?.shortName || g.subject?.code || ''),
                    data: grades.map(g => Math.min(100, g.points * 10)),
                })
            }
        }

        // ── Assignments ────────────────────────────────────
        let totalAsgn = 0, completedAsgn = 0
        if (assignmentsRes.status === 'fulfilled') {
            const all = assignmentsRes.value.assignments || []
            totalAsgn = all.length
            completedAsgn = all.filter(a => a.status === 'CLOSED').length
            const iconMap = {
                PUBLISHED: { icon: '📋', iconClass: 'blue' },
                CLOSED: { icon: '✅', iconClass: 'green' },
                DRAFT: { icon: '📝', iconClass: 'gray' },
            }
            setAssignments(all.slice(0, 4).map(a => {
                const isPastDue = new Date(a.dueDate) < new Date()
                const imap = iconMap[a.status] || iconMap.PUBLISHED
                return {
                    id: a.id,
                    title: a.title,
                    subject: a.subject?.name || '',
                    status: isPastDue || a.status === 'CLOSED' ? 'completed' : 'pending',
                    statusLabel: a.status === 'CLOSED' ? 'Closed' : isPastDue ? 'Past Due'
                        : `Due ${new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    icon: imap.icon,
                    iconClass: imap.iconClass,
                }
            }))
        }

        // ── Notifications ──────────────────────────────────
        if (notifsRes.status === 'fulfilled') {
            const arr = notifsRes.value.notifications || []
            const typeIcons = { INFO: 'ℹ️', SUCCESS: '✅', WARNING: '⚠️', ALERT: '🚨' }
            setNotifications(arr.slice(0, 4).map(n => ({
                icon: n.icon || typeIcons[n.type] || 'ℹ️',
                type: (n.type || 'info').toLowerCase(),
                text: n.text,
                time: new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            })))
        }

        // ── Timetable (today's classes) ────────────────────
        if (timetableRes.status === 'fulfilled') {
            const grouped = timetableRes.value.timetable || {}
            const todaySlots = grouped[todayDay] || []
            setTodayClasses(
                todaySlots
                    .filter(s => s.type !== 'FREE' && s.type !== 'LUNCH')
                    .slice(0, 3)
                    .map(s => ({
                        time: `${s.startTime} - ${s.endTime}`,
                        subject: s.subject?.name || '',
                        prof: s.faculty?.user?.name || '',
                        room: s.room || '',
                        type: (s.type || 'LECTURE').toLowerCase(),
                    }))
            )
        }

        // ── Career opportunities ───────────────────────────
        if (careerRes.status === 'fulfilled') {
            const opps = careerRes.value.opportunities || []
            setOpportunities(opps.slice(0, 3).map(o => ({
                ...o,
                typeClass: (o.type || '').toLowerCase().replace(/\s+/g, '-'),
            })))
        }

        // ── Compile stats ──────────────────────────────────
        setStats({
            attendance: attPct,
            attendanceTrend: attPct >= 75 ? `↑ ${attPct}%` : `↓ ${attPct}%`,
            cgpa: typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa,
            cgpaTrend,
            assignmentsTotal: totalAsgn,
            assignmentsCompleted: completedAsgn,
            careerScore: '—',
            careerScoreTrend: '—',
        })

        setLoading(false)
    }

    const q = searchQuery.toLowerCase()
    const pending = stats.assignmentsTotal - stats.assignmentsCompleted

    const recentAssignments = assignments.filter(a =>
        !q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
    )
    const filteredOpps = opportunities.filter(o =>
        !q || o.role.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)
    )
    const filteredNotifs = notifications.filter(n =>
        !q || n.text.toLowerCase().includes(q)
    )

    if (loading) return <PageSkeleton />

    return (
        <>
            <div className="dashboard-header">
                <h1>Welcome, {user.name.split(' ')[0]}</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📊</div>
                    <div className="dash-stat-info">
                        <h3>{stats.attendance}%</h3>
                        <p>Attendance</p>
                        <div className={`trend ${stats.attendanceTrend.includes('↑') ? 'up' : 'down'}`}>{stats.attendanceTrend}</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">🎓</div>
                    <div className="dash-stat-info">
                        <h3>{stats.cgpa}</h3>
                        <p>CGPA</p>
                        <div className={`trend ${stats.cgpaTrend.includes('↑') ? 'up' : 'down'}`}>{stats.cgpaTrend}</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">📋</div>
                    <div className="dash-stat-info">
                        <h3>{stats.assignmentsCompleted}/{stats.assignmentsTotal}</h3>
                        <p>Assignments</p>
                        <div className="trend down">{pending} pending</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🚀</div>
                    <div className="dash-stat-info">
                        <h3>{stats.careerScore}</h3>
                        <p>Career Score</p>
                        <div className="trend">{stats.careerScoreTrend}</div>
                    </div>
                </div>
            </div>

            <AIInsightsCard studentId={user.studentId} />

            <div className="dashboard-grid">
                <AttendanceCard attChart={attChart} />

                <div className="dash-card">
                    <h2>Upcoming Classes</h2>
                    {todayClasses.length > 0
                        ? todayClasses.map((c, i) => (
                            <div className="class-item" key={i}>
                                <div className="class-time">{c.time.split(' - ')[0]}</div>
                                <div className="class-details">
                                    <h4>{c.subject}</h4>
                                    <p>{c.room} • {c.prof}</p>
                                </div>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No classes today</p>
                    }
                </div>

                <GradesCard perfChart={perfChart} />

                <div className="dash-card">
                    <h2>Recent Assignments</h2>
                    {recentAssignments.length > 0
                        ? recentAssignments.map(a => (
                            <div className="assignment-item" key={a.id}>
                                <div className={`assignment-icon ${a.iconClass}`}>{a.icon}</div>
                                <div className="assignment-info">
                                    <h4>{a.title}</h4>
                                    <p>{a.subject}</p>
                                </div>
                                <span className={`assignment-badge ${a.status}`}>{a.statusLabel}</span>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No assignments found</p>
                    }
                </div>

                <CareerCard
                    opportunities={filteredOpps}
                    onApply={() => navigate('/student/career')}
                />

                <AnnouncementsCard notifications={filteredNotifs} />
            </div>
        </>
    )
}

export default StudentHome
