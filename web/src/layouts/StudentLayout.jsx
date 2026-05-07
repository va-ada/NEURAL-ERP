import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import '../pages/Dashboard.css'

// Icons
const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
const ClockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const FileIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
const AwardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
const BriefcaseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
const BookIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
const LogoutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const BellIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
const ExamIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M9 15l2 2 4-4" /><polyline points="14 2 14 8 20 8" /></svg>
const WalletIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
const LibraryIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
const ForumIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>

const sidebarLinks = [
    { icon: <HomeIcon />, label: 'Dashboard', to: '/student' },
    { icon: <CalendarIcon />, label: 'Attendance', to: '/student/attendance' },
    { icon: <ClockIcon />, label: 'Timetable', to: '/student/timetable' },
    { icon: <FileIcon />, label: 'Assignments', to: '/student/assignments' },
    { icon: <AwardIcon />, label: 'Grades', to: '/student/grades' },
    { icon: <BriefcaseIcon />, label: 'Career', to: '/student/career' },
    { icon: <BookIcon />, label: 'Notes', to: '/student/notes' },
    { icon: <ExamIcon />, label: 'Exams', to: '/student/exams' },
    { icon: <WalletIcon />, label: 'Fees', to: '/student/fees' },
    { icon: <LibraryIcon />, label: 'Library', to: '/student/library' },
    { icon: <ForumIcon />, label: 'Forum', to: '/student/forum' },
    { icon: <UserIcon />, label: 'Profile', to: '/student/profile' },
    { icon: <BellIcon />, label: 'Notifications', to: '/student/notifications' },
]

function StudentLayout() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="dashboard-layout">
            {/* Mobile hamburger */}
            <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">
                <MenuIcon />
            </button>
            <div
                className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-circle">N</div>
                    <span>Neural ERP</span>
                </div>
                <nav className="sidebar-nav" role="navigation" aria-label="Student navigation">
                    {sidebarLinks.map((link, i) => (
                        <NavLink
                            to={link.to}
                            key={i}
                            end={link.to === '/student'}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-profile">
                    <div className="avatar" style={{ background: user?.avatar?.color || '#22C55E' }}>
                        {user?.avatar?.initial || 'U'}
                    </div>
                    <span className="name">{user?.name || 'Student'}</span>
                    <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button className="logout-btn" onClick={handleLogout} title="Logout" aria-label="Log out">
                        <LogoutIcon />
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    )
}

export default StudentLayout
