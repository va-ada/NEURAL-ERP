import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    ArcElement, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { adminDashboardData, getAllStudents, faculty } from '../data/mockDatabase'
import { adminAPI } from '../services/api'
import TimetableBuilder from './TimetableBuilder'
import {
    AdminDashboardTab,
    AdminStudentsTab,
    AdminFacultyTab,
    AdminAnalyticsTab,
    AdminPlacementsTab,
    AdminAnnouncementsTab,
    AdminReportsTab,
    AdminAuditLogTab,
    AdminSettingsTab,
} from './admin'
import './Dashboard.css'

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    ArcElement, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
)

// ─── Sidebar Icons ─────────────────────────────────────
const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UsersIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const FacultyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const ChartIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const BriefcaseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const LogoutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const AnnouncementIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg>
const ReportIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
const AuditIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>

function AdminDashboard() {
    const { user, logout } = useAuth()
    const { showToast } = useToast()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const d = adminDashboardData
    const allStudents = getAllStudents()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [searchQuery, setSearchQuery] = useState('')

    // Student detail view
    const [selectedStudent, setSelectedStudent] = useState(null)

    // Faculty list (shared state — Faculty tab mutates, Reports tab reads)
    const [facultyList, setFacultyList] = useState([...faculty])

    // Announcements (shared state)
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'End Semester Exam Schedule Released', body: 'The end semester examination schedule for Semester 6 has been published.', audience: 'All', time: 'Mar 1, 2026', status: 'Active' },
        { id: 2, title: 'Google AI On-Campus Drive', body: 'Google will be conducting an on-campus recruitment drive on Mar 5, 2026.', audience: 'Final Year', time: 'Feb 28, 2026', status: 'Active' },
        { id: 3, title: 'Library Hours Extended', body: 'Library will remain open until 10 PM during exam season.', audience: 'All', time: 'Feb 25, 2026', status: 'Expired' },
    ])

    // Audit log
    const [auditLog] = useState([
        { id: 1, action: 'Student Added', user: 'Admin', details: 'Added student Prashant Kumar (AIML001)', time: 'Mar 2, 2026 10:30 AM', type: 'create' },
        { id: 2, action: 'Grade Published', user: 'Dr. Priya Sharma', details: 'Published DL mid-sem grades for Section A', time: 'Mar 1, 2026 3:15 PM', type: 'update' },
        { id: 3, action: 'Attendance Updated', user: 'Prof. Amit Verma', details: 'Marked attendance for ML lecture', time: 'Mar 1, 2026 10:00 AM', type: 'update' },
        { id: 4, action: 'Announcement Created', user: 'Admin', details: 'Created "End Semester Exam Schedule"', time: 'Mar 1, 2026 9:00 AM', type: 'create' },
        { id: 5, action: 'Faculty Updated', user: 'Admin', details: 'Updated room for Prof. Rajesh Kumar', time: 'Feb 28, 2026 4:30 PM', type: 'update' },
        { id: 6, action: 'Student Removed', user: 'Admin', details: 'Removed inactive student record', time: 'Feb 28, 2026 2:00 PM', type: 'delete' },
        { id: 7, action: 'Placement Record Added', user: 'Admin', details: 'Added Google placement data — 3 offers', time: 'Feb 27, 2026 11:00 AM', type: 'create' },
        { id: 8, action: 'Settings Changed', user: 'Admin', details: 'Enabled SMS notifications', time: 'Feb 26, 2026 5:00 PM', type: 'update' },
    ])

    // ─── Analytics & Placements: live data state ────────────
    const [analyticsLoading, setAnalyticsLoading] = useState(false)
    const [placementsLoading, setPlacementsLoading] = useState(false)
    const [liveAttendanceTrend, setLiveAttendanceTrend] = useState(null)
    const [liveGradeDist, setLiveGradeDist] = useState(null)
    const [livePlacementCompanies, setLivePlacementCompanies] = useState(null)

    // Fetch analytics data when the Analytics tab is selected
    useEffect(() => {
        if (activeTab !== 'analytics') return
        let cancelled = false
        async function fetchAnalytics() {
            setAnalyticsLoading(true)
            try {
                const [attendanceRes, performanceRes] = await Promise.all([
                    adminAPI.getAnalyticsAttendance(),
                    adminAPI.getAnalyticsPerformance(),
                ])
                if (cancelled) return
                if (attendanceRes?.trends?.length) {
                    const labels = attendanceRes.trends.map(t => t.month)
                    const data = attendanceRes.trends.map(t => {
                        const depts = t.departments || []
                        if (!depts.length) return 0
                        return Math.round(depts.reduce((sum, dep) => sum + dep.percentage, 0) / depts.length)
                    })
                    setLiveAttendanceTrend({ labels, data })
                }
                if (performanceRes?.gradeDistribution) {
                    const gd = performanceRes.gradeDistribution
                    setLiveGradeDist({ labels: Object.keys(gd), data: Object.values(gd) })
                }
            } catch (err) {
                console.error('Analytics fetch failed, using mock data:', err)
            } finally {
                if (!cancelled) setAnalyticsLoading(false)
            }
        }
        fetchAnalytics()
        return () => { cancelled = true }
    }, [activeTab])

    // Fetch placement data when the Placements tab is selected
    useEffect(() => {
        if (activeTab !== 'placements') return
        let cancelled = false
        async function fetchPlacements() {
            setPlacementsLoading(true)
            try {
                const res = await adminAPI.getAnalyticsPlacements()
                if (cancelled) return
                if (res?.companies?.length) setLivePlacementCompanies(res.companies)
            } catch (err) {
                console.error('Placements fetch failed, using mock data:', err)
            } finally {
                if (!cancelled) setPlacementsLoading(false)
            }
        }
        fetchPlacements()
        return () => { cancelled = true }
    }, [activeTab])

    function handleLogout() {
        logout()
        navigate('/login')
    }

    // ─── Shared chart data (used by Dashboard + Analytics + Placements tabs) ───

    const deptData = {
        labels: d.deptDistribution.labels,
        datasets: [{
            data: d.deptDistribution.data,
            backgroundColor: d.deptDistribution.backgroundColor,
            borderWidth: 0, hoverOffset: 8,
        }]
    }

    const deptOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 13 },
                    generateLabels: (chart) => chart.data.labels.map((label, i) => ({
                        text: `${label} ${chart.data.datasets[0].data[i]}%`,
                        fillStyle: chart.data.datasets[0].backgroundColor[i],
                        strokeStyle: chart.data.datasets[0].backgroundColor[i],
                        index: i, pointStyle: 'circle',
                    }))
                }
            }
        }
    }

    const placementData = {
        labels: d.placementStats.labels,
        datasets: [{
            label: 'Placement %',
            data: d.placementStats.data,
            backgroundColor: '#2563EB',
            borderRadius: 8, barThickness: 32,
        }]
    }

    const placementOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { min: 0, max: 100, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
            x: { grid: { display: false }, ticks: { font: { size: 12 } } }
        }
    }

    const attendanceLabels = liveAttendanceTrend?.labels ?? ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
    const attendanceValues = liveAttendanceTrend?.data ?? [91, 88, 90, 86, 82, 89]
    const avgAttendanceByMonth = {
        labels: attendanceLabels,
        datasets: [{
            label: 'Avg Attendance %',
            data: attendanceValues,
            borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#2563EB', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5,
        }]
    }

    const gradeLabels = liveGradeDist?.labels ?? ['A+', 'A', 'B+', 'B', 'C']
    const gradeValues = liveGradeDist?.data ?? [24, 42, 32, 30, 10]
    const defaultGradeColors = ['#22C55E', '#2563EB', '#F59E0B', '#EA580C', '#EF4444']
    const gradeDistAll = {
        labels: gradeLabels,
        datasets: [{
            data: gradeValues,
            backgroundColor: defaultGradeColors.slice(0, gradeLabels.length),
            borderWidth: 0, hoverOffset: 8,
        }]
    }

    const mockPlacementCompanies = [
        { company: 'Google', hired: 3, avgPackage: '₹45 LPA', role: 'ML Engineer / Research', status: 'Completed' },
        { company: 'Microsoft', hired: 4, avgPackage: '₹38 LPA', role: 'AI Research Intern', status: 'Completed' },
        { company: 'NVIDIA', hired: 2, avgPackage: '₹42 LPA', role: 'DL Engineer', status: 'Completed' },
        { company: 'Amazon', hired: 5, avgPackage: '₹32 LPA', role: 'Data Scientist', status: 'Completed' },
        { company: 'Flipkart', hired: 3, avgPackage: '₹28 LPA', role: 'ML Platform Eng', status: 'Completed' },
        { company: 'TCS', hired: 8, avgPackage: '₹8 LPA', role: 'Digital Engineer', status: 'Ongoing' },
        { company: 'Razorpay', hired: 2, avgPackage: '₹24 LPA', role: 'AI/ML Intern', status: 'Upcoming' },
    ]
    const placementCompanies = livePlacementCompanies ?? mockPlacementCompanies

    // ─── Sidebar links ─────────────────────────────────────

    const sidebarLinks = [
        { icon: <HomeIcon />, label: 'Dashboard', key: 'dashboard' },
        { icon: <UsersIcon />, label: 'Students', key: 'students' },
        { icon: <FacultyIcon />, label: 'Faculty', key: 'faculty' },
        { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Timetable', key: 'timetable' },
        { icon: <ChartIcon />, label: 'Analytics', key: 'analytics' },
        { icon: <BriefcaseIcon />, label: 'Placements', key: 'placements' },
        { icon: <AnnouncementIcon />, label: 'Announcements', key: 'announcements' },
        { icon: <ReportIcon />, label: 'Reports', key: 'reports' },
        { icon: <AuditIcon />, label: 'Audit Log', key: 'audit' },
        { icon: <SettingsIcon />, label: 'Settings', key: 'settings' },
    ]

    // ─── Tab rendering ──────────────────────────────────────

    function renderContent() {
        switch (activeTab) {
            case 'timetable':
                return <TimetableBuilder />
            case 'students':
                return <AdminStudentsTab allStudents={allStudents} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} showToast={showToast} />
            case 'faculty':
                return <AdminFacultyTab facultyList={facultyList} setFacultyList={setFacultyList} showToast={showToast} />
            case 'analytics':
                return <AdminAnalyticsTab allStudents={allStudents} analyticsLoading={analyticsLoading} avgAttendanceByMonth={avgAttendanceByMonth} gradeDistAll={gradeDistAll} />
            case 'placements':
                return <AdminPlacementsTab d={d} placementsLoading={placementsLoading} placementCompanies={placementCompanies} placementData={placementData} placementOptions={placementOptions} />
            case 'announcements':
                return <AdminAnnouncementsTab announcements={announcements} setAnnouncements={setAnnouncements} showToast={showToast} />
            case 'reports':
                return <AdminReportsTab allStudents={allStudents} facultyList={facultyList} placementCompanies={placementCompanies} showToast={showToast} />
            case 'audit':
                return <AdminAuditLogTab auditLog={auditLog} />
            case 'settings':
                return <AdminSettingsTab d={d} user={user} showToast={showToast} />
            default:
                return <AdminDashboardTab d={d} searchQuery={searchQuery} onSearchChange={setSearchQuery} setActiveTab={setActiveTab} deptData={deptData} deptOptions={deptOptions} placementData={placementData} placementOptions={placementOptions} />
        }
    }

    const [adminMenuOpen, setAdminMenuOpen] = useState(false)

    return (
        <div className="dashboard-layout">
            {/* Mobile hamburger */}
            <button className="hamburger-btn" aria-label={adminMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={adminMenuOpen} onClick={() => setAdminMenuOpen(!adminMenuOpen)}>☰</button>
            {adminMenuOpen && <div className="sidebar-overlay" onClick={() => setAdminMenuOpen(false)} />}
            <aside className={`sidebar ${adminMenuOpen ? 'open' : ''}`} aria-label="Admin navigation">
                <div className="sidebar-logo">
                    <div className="logo-circle">N</div>
                    <span>Neural ERP</span>
                </div>
                <nav className="sidebar-nav">
                    {sidebarLinks.map((link, i) => (
                        <a
                            href="#"
                            key={i}
                            className={activeTab === link.key ? 'active' : ''}
                            onClick={e => { e.preventDefault(); setActiveTab(link.key); setSearchQuery(''); setAdminMenuOpen(false) }}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </a>
                    ))}
                </nav>
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ margin: '8px 16px' }}>
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <div className="sidebar-profile">
                    <div className="avatar" aria-hidden="true" style={{ background: user?.avatar?.color || '#8B5CF6' }}>
                        {user?.avatar?.initial || 'A'}
                    </div>
                    <span className="name">{user?.name || 'Admin'}</span>
                    <button className="logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
                        <LogoutIcon />
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                {renderContent()}
            </main>
        </div>
    )
}

export default AdminDashboard
