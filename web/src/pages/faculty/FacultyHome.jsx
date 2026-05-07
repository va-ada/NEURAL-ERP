import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { timetableAPI, assignmentAPI, academicAPI } from '../../services/api'
import { timetable as mockTimetable, faculty as mockFaculty, subjects as mockSubjects } from '../../data/mockDatabase'
import { SkeletonCard } from '../../components/Skeleton'
import '../Dashboard.css'

const DAY_ENUM = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function FacultyHome() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)

    const [todayClasses, setTodayClasses] = useState([])
    const [stats, setStats] = useState({ classesToday: 0, pendingAssignments: 0, totalStudents: 0 })
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        const batchId = user.batchId || 'B001'
        const todayDay = DAY_ENUM[new Date().getDay()]

        const [timetableRes, assignmentsRes, studentsRes] = await Promise.allSettled([
            timetableAPI.getByBatch(batchId),
            assignmentAPI.getAll(),
            academicAPI.getStudents(),
        ])

        const hasApiData = [timetableRes, assignmentsRes, studentsRes].some(r => r.status === 'fulfilled')

        if (!hasApiData) {
            // Mock data fallback
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const today = dayNames[new Date().getDay()]
            const todaySchedule = mockTimetable[today] || mockTimetable['Mon']

            // Filter classes for this faculty
            const facultyName = user.name || 'Dr. Amit Sharma'
            const myClasses = todaySchedule.filter(s =>
                s.type !== 'lunch' && s.type !== 'free' && s.prof?.includes(facultyName.split(' ').pop())
            )
            // If no classes match faculty name, show all non-free/lunch as fallback
            const classesToShow = myClasses.length > 0 ? myClasses : todaySchedule.filter(s => s.type !== 'lunch' && s.type !== 'free').slice(0, 4)

            setTodayClasses(classesToShow.map(s => ({
                time: s.time,
                subject: s.subject,
                room: s.room,
                type: s.type,
                batch: 'AIML Sem 6',
            })))

            setStats({
                classesToday: classesToShow.length,
                pendingAssignments: 5,
                totalStudents: 60,
            })

            setRecentActivity([
                { icon: '📋', text: 'Assignment "ML Model Evaluation" submitted by 12 students', time: '2 hours ago' },
                { icon: '✅', text: 'Attendance marked for AIML Sem 6 - Machine Learning', time: '4 hours ago' },
                { icon: '📝', text: 'New assignment "DL Lab 5" created', time: 'Yesterday' },
                { icon: '📊', text: 'Graded 15 submissions for NLP Assignment 3', time: '2 days ago' },
            ])

            setLoading(false)
            return
        }

        // Process API data
        let classesToday = 0
        if (timetableRes.status === 'fulfilled') {
            const grouped = timetableRes.value.timetable || {}
            const todaySlots = grouped[todayDay] || []
            const classes = todaySlots.filter(s => s.type !== 'FREE' && s.type !== 'LUNCH')
            classesToday = classes.length
            setTodayClasses(classes.slice(0, 5).map(s => ({
                time: `${s.startTime} - ${s.endTime}`,
                subject: s.subject?.name || '',
                room: s.room || '',
                type: (s.type || 'LECTURE').toLowerCase(),
                batch: s.batch?.name || '',
            })))
        }

        let pendingAssignments = 0
        if (assignmentsRes.status === 'fulfilled') {
            const all = assignmentsRes.value.assignments || []
            pendingAssignments = all.filter(a => a.status === 'PUBLISHED').length
        }

        let totalStudents = 0
        if (studentsRes.status === 'fulfilled') {
            const students = studentsRes.value.students || studentsRes.value || []
            totalStudents = Array.isArray(students) ? students.length : 0
        }

        setStats({ classesToday, pendingAssignments, totalStudents })

        setRecentActivity([
            { icon: '📋', text: 'Assignment submissions received', time: 'Recently' },
            { icon: '✅', text: 'Attendance marked', time: 'Today' },
        ])

        setLoading(false)
    }

    if (loading) {
        return (
            <>
                <div className="dashboard-header">
                    <h1>Welcome, {user.name.split(' ')[0]}</h1>
                </div>
                <div className="stats-row">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="dash-stat-card" style={{ opacity: 0.5 }}>
                            <div className="dash-stat-icon blue">...</div>
                            <div className="dash-stat-info"><h3>--</h3><p>Loading...</p></div>
                        </div>
                    ))}
                </div>
                <div className="dashboard-grid">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Welcome, {user.name.split(' ')[0]}</h1>
                <div className="header-right">
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📚</div>
                    <div className="dash-stat-info">
                        <h3>{stats.classesToday}</h3>
                        <p>Classes Today</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">📋</div>
                    <div className="dash-stat-info">
                        <h3>{stats.pendingAssignments}</h3>
                        <p>Pending Assignments</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">👥</div>
                    <div className="dash-stat-info">
                        <h3>{stats.totalStudents}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Today's Classes */}
                <div className="dash-card">
                    <h2>Today's Classes</h2>
                    {todayClasses.length > 0
                        ? todayClasses.map((c, i) => (
                            <div className="class-item" key={i}>
                                <div className="class-time">{c.time.split(' - ')[0]}</div>
                                <div className="class-details">
                                    <h4>{c.subject}</h4>
                                    <p>{c.room} {c.batch ? `• ${c.batch}` : ''}</p>
                                </div>
                                <span className={`slot-type-badge ${c.type}`}>
                                    {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                                </span>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No classes today</p>
                    }
                </div>

                {/* Quick Actions */}
                <div className="dash-card">
                    <h2>Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '14px 20px', fontSize: 15 }}
                            onClick={() => navigate('/faculty/attendance')}
                        >
                            Mark Attendance
                        </button>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '14px 20px', fontSize: 15, background: 'var(--success)' }}
                            onClick={() => navigate('/faculty/assignments')}
                        >
                            Grade Assignments
                        </button>
                        <button
                            className="btn-view"
                            style={{ width: '100%', padding: '14px 20px', fontSize: 15 }}
                            onClick={() => navigate('/faculty/timetable')}
                        >
                            View Timetable
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="dash-card">
                    <h2>Recent Activity</h2>
                    {recentActivity.length > 0
                        ? recentActivity.map((a, i) => (
                            <div className="notification-item" key={i}>
                                <div className="notification-icon info">{a.icon}</div>
                                <div className="notification-content">
                                    <p>{a.text}</p>
                                    <span>{a.time}</span>
                                </div>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No recent activity</p>
                    }
                </div>
            </div>
        </>
    )
}

export default FacultyHome
