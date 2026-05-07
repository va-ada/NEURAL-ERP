import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import '../pages/Dashboard.css'

// Icons
const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const CheckSquareIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
const FileIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const LogoutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
const BoardIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>

const sidebarLinks = [
    { icon: <HomeIcon />, label: 'Dashboard', to: '/faculty' },
    { icon: <CheckSquareIcon />, label: 'Mark Attendance', to: '/faculty/attendance' },
    { icon: <FileIcon />, label: 'Assignments', to: '/faculty/assignments' },
    { icon: <CalendarIcon />, label: 'Timetable', to: '/faculty/timetable' },
    { icon: <BoardIcon />, label: 'Smartboard Notes', to: '/faculty/smartboard' },
    { icon: <UserIcon />, label: 'Profile', to: '/faculty/profile' },
]

function FacultyLayout() {
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
                <nav className="sidebar-nav" role="navigation" aria-label="Faculty navigation">
                    {sidebarLinks.map((link, i) => (
                        <NavLink
                            to={link.to}
                            key={i}
                            end={link.to === '/faculty'}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-profile">
                    <div className="avatar" style={{ background: user?.avatar?.color || '#2563EB' }}>
                        {user?.avatar?.initial || 'F'}
                    </div>
                    <span className="name">{user?.name || 'Faculty'}</span>
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

export default FacultyLayout
