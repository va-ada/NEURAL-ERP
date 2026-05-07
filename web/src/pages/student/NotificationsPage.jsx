import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const initialNotifications = [
    { id: 1, type: 'assignment', icon: '📝', title: 'New Assignment: ML Lab 5', body: 'Machine Learning Lab 5 has been posted. Due: Mar 8, 2026', time: '2 hours ago', read: false },
    { id: 2, type: 'attendance', icon: '📅', title: 'Attendance Alert', body: 'Your NLP attendance dropped below 80%. Current: 78%', time: '5 hours ago', read: false },
    { id: 3, type: 'grade', icon: '🏆', title: 'Grade Published: Deep Learning', body: 'Your DL mid-sem grade is now available. You scored A+', time: '1 day ago', read: false },
    { id: 4, type: 'announcement', icon: '📢', title: 'Campus Placement Drive', body: 'Google AI On-Campus Drive scheduled for Mar 5. Register now!', time: '1 day ago', read: true },
    { id: 5, type: 'assignment', icon: '📝', title: 'Assignment Graded: DSA HW3', body: 'Your DSA Homework 3 has been graded. Score: 92/100', time: '2 days ago', read: true },
    { id: 6, type: 'announcement', icon: '📢', title: 'College Fest — Techathon 2026', body: 'Registrations open for Techathon 2026. Prizes worth ₹2,00,000!', time: '3 days ago', read: true },
    { id: 7, type: 'attendance', icon: '📅', title: 'Attendance Marked', body: 'Your attendance for Computer Vision today has been marked present.', time: '3 days ago', read: true },
    { id: 8, type: 'grade', icon: '🏆', title: 'Semester Results', body: 'Semester 5 results are now published. Check your grades.', time: '1 week ago', read: true },
]

const filters = ['All', 'Unread', 'Assignments', 'Attendance', 'Grades', 'Announcements']
const filterMap = { Assignments: 'assignment', Attendance: 'attendance', Grades: 'grade', Announcements: 'announcement' }

const NOTIFS_PER_PAGE = 20

function NotificationsPage() {
    const { showToast } = useToast()
    const [notifs, setNotifs] = useState(initialNotifications)
    const [filter, setFilter] = useState('All')
    const [currentPage, setCurrentPage] = useState(1)

    const unreadCount = notifs.filter(n => !n.read).length

    function markAllRead() {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })))
        showToast('All notifications marked as read', 'success')
    }

    function dismiss(id) {
        setNotifs(prev => prev.filter(n => n.id !== id))
        showToast('Notification dismissed', 'info')
    }

    function toggleRead(id) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
    }

    const filtered = notifs.filter(n => {
        if (filter === 'Unread') return !n.read
        if (filterMap[filter]) return n.type === filterMap[filter]
        return true
    })

    const totalPages = Math.ceil(filtered.length / NOTIFS_PER_PAGE)
    const paginatedFiltered = filtered.slice((currentPage - 1) * NOTIFS_PER_PAGE, currentPage * NOTIFS_PER_PAGE)

    return (
        <div>
            <div className="dashboard-header">
                <h1>Notifications {unreadCount > 0 && <span style={{ fontSize: 14, background: 'var(--danger)', color: 'white', padding: '2px 10px', borderRadius: 12, marginLeft: 8 }}>{unreadCount}</span>}</h1>
                <div className="header-right">
                    {unreadCount > 0 && <button className="btn-view" onClick={markAllRead}>Mark all read</button>}
                </div>
            </div>

            <div className="filter-tabs" role="tablist" aria-label="Notification filters" style={{ marginBottom: 24 }}>
                {filters.map(f => (
                    <button key={f} role="tab" aria-selected={filter === f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => { setFilter(f); setCurrentPage(1) }}>
                        {f} {f === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                    </button>
                ))}
            </div>

            <div className="dash-card">
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
                        <p>No notifications</p>
                    </div>
                ) : (
                    paginatedFiltered.map(n => (
                        <div key={n.id} className="notification-item" style={{ opacity: n.read ? 0.7 : 1, background: n.read ? 'transparent' : 'var(--gray-50)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: 4 }}>
                            <div className={`notification-icon ${n.type === 'assignment' || n.type === 'announcement' ? 'info' : n.type === 'grade' ? 'success' : 'warning'}`}>
                                {n.icon}
                            </div>
                            <div className="notification-content" style={{ flex: 1 }}>
                                <p style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{n.body}</p>
                                <span>{n.time}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => toggleRead(n.id)} aria-label={n.read ? 'Mark notification as unread' : 'Mark notification as read'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--gray-400)' }} title={n.read ? 'Mark unread' : 'Mark read'}>
                                    {n.read ? '○' : '●'}
                                </button>
                                <button onClick={() => dismiss(n.id)} aria-label="Dismiss notification" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gray-400)' }} title="Dismiss">×</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="btn-view"
                    >
                        Previous
                    </button>
                    <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--gray-500)' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="btn-view"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}

export default NotificationsPage
