import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js'
import { useAuth } from '../../context/AuthContext'
import { careerAPI } from '../../services/api'
import { careerOpportunities, careerEvents, students as mockStudents } from '../../data/mockDatabase'
import { PageSkeleton } from '../../components/Skeleton'
import Modal from '../../components/Modal'
import AIInsightBadge from '../../components/AIInsightBadge'
import '../Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const scoreOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { min: 0, max: 100, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
    }
}

const oppFilters = [
    { label: 'All', key: 'all' },
    { label: 'Remote', key: 'Remote' },
    { label: 'Hybrid', key: 'Hybrid' },
    { label: 'On-site', key: 'On-site' },
]

function CareerPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [careerScore, setCareerScore] = useState(0)
    const [applicationsSent, setApplicationsSent] = useState(0)
    const [interviews, setInterviews] = useState(0)
    const [offers, setOffers] = useState(0)
    const [skills, setSkills] = useState([])
    const [applications, setApplications] = useState([])
    const [scoreBreakdown, setScoreBreakdown] = useState({ academics: 0, skills: 0, projects: 0, internships: 0, extraCurricular: 0 })
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [appliedCompanies, setAppliedCompanies] = useState(new Set())
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [selectedOpp, setSelectedOpp] = useState(null)
    const [applySuccess, setApplySuccess] = useState(false)
    const [aiOpps, setAiOpps] = useState([])
    const [loadingAi, setLoadingAi] = useState(true)
    const [aiSource, setAiSource] = useState('demo')
    const [aiGeneratedAt, setAiGeneratedAt] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const studentId = user.studentId
        const [statsRes, appsRes, skillsRes, aiRes] = await Promise.allSettled([
            careerAPI.getStats(studentId),
            careerAPI.getApplications(studentId),
            careerAPI.getSkills(studentId),
            careerAPI.getRecommendations(studentId, { existingIds: [] })
        ])

        const hasApiData = [statsRes, appsRes, skillsRes, aiRes].some(r => r.status === 'fulfilled')
        if (!hasApiData) {
            const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
            const c = mockStudent.career

            setCareerScore(c.careerScore)
            setApplicationsSent(c.applicationsSent)
            setInterviews(c.interviews)
            setOffers(c.offers)
            setScoreBreakdown(c.scoreBreakdown)
            setSkills(c.skills)
            setApplications(c.applications)

            // Use mock career opportunities as AI recommendations
            setAiOpps(careerOpportunities.map(o => ({
                ...o,
                workMode: o.location === 'Remote' ? 'Remote' : 'On-site',
                roleType: o.type === 'Internship' ? 'Internship' : 'Full-time',
            })))

            setLoadingAi(false)
            setLoading(false)
            return
        }

        if (statsRes.status === 'fulfilled') {
            const s = statsRes.value
            setCareerScore(s.careerScore || 0)
            setApplicationsSent(s.applicationsSent || 0)
            setInterviews(s.interviews || 0)
            setOffers(s.offers || 0)
            setScoreBreakdown(s.scoreBreakdown || { academics: 0, skills: 0, projects: 0, internships: 0, extraCurricular: 0 })
        }

        if (appsRes.status === 'fulfilled') {
            setApplications((appsRes.value.applications || []).map(a => ({
                company: a.company || a.opportunity?.company || '—',
                role: a.role || a.opportunity?.role || '—',
                date: a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
                status: a.status || 'Applied',
                statusClass: a.status === 'ACCEPTED' ? 'accepted' : a.status === 'REJECTED' ? 'rejected' : 'applied',
            })))
        }

        if (skillsRes.status === 'fulfilled') {
            setSkills((skillsRes.value.skills || []).map(s => ({
                name: s.name,
                pct: s.level === 'advanced' ? 90 : s.level === 'intermediate' ? 65 : 35,
                level: s.level || 'beginner',
            })))
        }

        if (aiRes.status === 'fulfilled') {
            setAiOpps(aiRes.value.recommendations || [])
            if (aiRes.value.aiSource) setAiSource(aiRes.value.aiSource)
            if (aiRes.value.generatedAt) setAiGeneratedAt(aiRes.value.generatedAt)
        }

        setLoadingAi(false)
        setLoading(false)
    }

    async function loadMoreAiOpps() {
        setLoadingAi(true)
        try {
            const existingIds = aiOpps.map(o => `${o.company} - ${o.role}`)
            const res = await careerAPI.getRecommendations(user.studentId, { existingIds })
            if (res && res.recommendations) {
                setAiOpps(prev => [...prev, ...res.recommendations])
                if (res.aiSource) setAiSource(res.aiSource)
                if (res.generatedAt) setAiGeneratedAt(res.generatedAt)
            }
        } catch (err) {
            console.error("Failed to load more AI opportunities", err)
        } finally {
            setLoadingAi(false)
        }
    }

    const q = searchQuery ? searchQuery.toLowerCase() : ''
    const safeAiOpps = Array.isArray(aiOpps) ? aiOpps : []
    const filteredOpps = (activeFilter === 'all'
        ? safeAiOpps
        : safeAiOpps.filter(o => o && o.workMode === activeFilter)
    ).filter(o => o && (!q || (o.role && o.role.toLowerCase().includes(q)) || (o.company && o.company.toLowerCase().includes(q))))

    function handleApply(o) {
        setSelectedOpp(o)
        setApplySuccess(false)
        setShowApplyModal(true)
    }

    async function confirmApply() {
        setAppliedCompanies(prev => new Set([...prev, selectedOpp.company]))
        setApplySuccess(true)
        setTimeout(() => setShowApplyModal(false), 1500)

        if (selectedOpp.workMode || selectedOpp.roleType) {
            try {
                const preferenceData = {};
                if (selectedOpp.workMode) preferenceData.workModePreference = selectedOpp.workMode;
                if (selectedOpp.roleType) preferenceData.rolePreference = selectedOpp.roleType;

                await careerAPI.updatePreference(user.studentId, preferenceData)
            } catch (err) {
                console.error('Failed to update work mode preference:', err)
            }
        }

        if (selectedOpp.applyLink) {
            window.open(selectedOpp.applyLink, '_blank', 'noopener,noreferrer')
        }
    }

    const bd = scoreBreakdown
    const scoreData = {
        labels: ['Academics', 'Skills', 'Projects', 'Internships', 'Extra-curricular'],
        datasets: [{
            label: 'Score',
            data: [bd.academics, bd.skills, bd.projects, bd.internships, bd.extraCurricular],
            backgroundColor: ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899'],
            borderRadius: 8,
            barThickness: 32,
        }]
    }

    if (loading) return <PageSkeleton />

    return (
        <>
            <div className="dashboard-header">
                <h1>Career</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search opportunities..." aria-label="Search opportunities" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🚀</div>
                    <div className="dash-stat-info">
                        <h3>{careerScore}/100</h3>
                        <p>Career Score</p>
                        <div className={`trend ${careerScore >= 70 ? 'up' : 'down'}`}>
                            {careerScore >= 80 ? 'Excellent' : careerScore >= 70 ? 'Good' : 'Needs work'}
                        </div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📤</div>
                    <div className="dash-stat-info">
                        <h3>{applicationsSent}</h3>
                        <p>Applications Sent</p>
                        <div className="trend up">This semester</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">🎤</div>
                    <div className="dash-stat-info">
                        <h3>{interviews}</h3>
                        <p>Interviews</p>
                        <div className="trend up">{interviews > 0 ? `${interviews} scheduled` : 'None yet'}</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">🎉</div>
                    <div className="dash-stat-info">
                        <h3>{offers}</h3>
                        <p>Offers</p>
                        <div className={`trend ${offers > 0 ? 'up' : 'down'}`}>
                            {offers > 0 ? `${offers} received` : 'Keep applying'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Career Score Breakdown</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -12, marginBottom: 16 }}>
                        Your career readiness score is <strong>{careerScore}/100</strong> — {careerScore >= 80 ? 'Excellent' : careerScore >= 70 ? 'Good' : careerScore >= 60 ? 'Average' : 'Below Average'}
                    </p>
                    <div className="chart-container">
                        <Bar data={scoreData} options={scoreOptions} />
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Skill Recommendations</h2>
                    {skills.length > 0 ? skills.map((s, i) => (
                        <div className="skill-item" key={i}>
                            <span className="skill-name">{s.name}</span>
                            <div className="skill-bar-track">
                                <div className={`skill-bar-fill ${s.level}`} style={{ width: `${s.pct}%` }} />
                            </div>
                            <span className={`skill-level ${s.level}`}>
                                {s.level.charAt(0).toUpperCase() + s.level.slice(1)}
                            </span>
                        </div>
                    )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No skills added yet</p>}
                </div>

                <div className="dash-card full-width">
                    <h2>AI-Powered Opportunity Matches</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -12, marginBottom: 16 }}>
                        These recommendations are generated specifically for you using Google Gemini AI, prioritizing valid Government internships and matching your current semester & skills.
                    </p>
                    <AIInsightBadge
                        dataMode={aiSource === 'gemini' ? 'live' : aiSource === 'rule-based-demo-fallback' ? 'demo-fallback' : 'demo'}
                        generatedAt={aiGeneratedAt}
                    >
                        <div className="filter-tabs" style={{ marginBottom: 16 }}>
                            {oppFilters.map(f => (
                                <button
                                    key={f.key}
                                    className={`filter-tab${activeFilter === f.key ? ' active' : ''}`}
                                    onClick={() => setActiveFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        {loadingAi ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <div className="dash-stat-icon purple" style={{ display: 'inline-block', marginBottom: 10 }}>✨</div>
                                <p>Gemini AI is analyzing your profile to generate personalized internships...</p>
                            </div>
                        ) : filteredOpps.length > 0 ? filteredOpps.map((o, i) => (
                            <div className="career-item" key={i}>
                                <div className="career-logo" style={{ background: o.color || '#2563EB' }}>{o.initial || o.company.charAt(0)}</div>
                                <div className="career-info">
                                    <h4>
                                        {o.role}
                                        <span className={`career-type internship`}>{o.type}</span>
                                        {o.workMode && <span className={`career-type`} style={{ marginLeft: 6, background: '#F3F4F6', color: '#4B5563' }}>{o.workMode}</span>}
                                        {o.roleType && <span className={`career-type tech`} style={{ marginLeft: 6 }}>{o.roleType}</span>}
                                        <span className={`match-badge ${o.match >= 85 ? 'high' : 'medium'}`}>{o.match}% Match</span>
                                    </h4>
                                    <p>{o.company} • {o.location} • Deadline: {o.deadline}</p>
                                </div>
                                {appliedCompanies.has(o.company) ? (
                                    <button className="btn-apply applied" disabled>Applied</button>
                                ) : (
                                    <button className="btn-apply" onClick={() => handleApply(o)}>Apply Now</button>
                                )}
                            </div>
                        )) : !loadingAi && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No matching opportunities found.</p>}

                        {aiOpps.length > 0 && !loadingAi && (
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <button className="btn-secondary" onClick={loadMoreAiOpps}>View More Opportunities</button>
                            </div>
                        )}
                    </AIInsightBadge>
                </div>

                <div className="dash-card">
                    <h2>Application Tracker</h2>
                    {applications.length > 0 ? applications.map((a, i) => (
                        <div className="class-item" key={i}>
                            <div className="class-details" style={{ flex: 1 }}>
                                <h4>{a.company} — {a.role}</h4>
                                <p>Applied {a.date}</p>
                            </div>
                            <span className={`app-status ${a.statusClass}`}>{a.status}</span>
                        </div>
                    )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No applications yet</p>}
                </div>

                <div className="dash-card">
                    <h2>Upcoming Events</h2>
                    {careerEvents.map((e, i) => (
                        <div className="class-item" key={i}>
                            <div className="class-time">{e.date}</div>
                            <div className="class-details">
                                <h4>{e.name}</h4>
                                <p>{e.time} • {e.venue}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for Position">
                {applySuccess ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <h3>Application Sent!</h3>
                        <p>Your application has been submitted to {selectedOpp?.company}.</p>
                    </div>
                ) : selectedOpp && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Company</span>
                            <span className="detail-value">{selectedOpp.company}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Role</span>
                            <span className="detail-value">{selectedOpp.role}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{selectedOpp.type}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Work Mode</span>
                            <span className="detail-value">{selectedOpp.workMode || 'Not specified'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Location</span>
                            <span className="detail-value">{selectedOpp.location}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Match</span>
                            <span className="detail-value">{selectedOpp.match}%</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Deadline</span>
                            <span className="detail-value">{selectedOpp.deadline}</span>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                            <button className="modal-btn-primary" onClick={confirmApply}>Confirm Application</button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    )
}

export default CareerPage
