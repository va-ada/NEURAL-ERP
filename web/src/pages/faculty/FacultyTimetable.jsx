import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { timetableAPI } from '../../services/api'
import { timetable as mockTimetable } from '../../data/mockDatabase'
import { SkeletonCard } from '../../components/Skeleton'
import '../Dashboard.css'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_ENUM = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function FacultyTimetable() {
    const { user } = useAuth()
    const todayIndex = new Date().getDay()
    const defaultDay = todayIndex >= 1 && todayIndex <= 6 ? todayIndex - 1 : 0
    const [activeDay, setActiveDay] = useState(defaultDay)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [schedule, setSchedule] = useState({})

    useEffect(() => {
        loadTimetable()
    }, [])

    async function loadTimetable() {
        const batchId = user.batchId || 'B001'

        try {
            const res = await timetableAPI.getByBatch(batchId)
            const grouped = res.timetable || {}
            // Convert API format to display format
            const converted = {}
            days.forEach((day, i) => {
                const dayEnum = DAY_ENUM[i + 1] // Mon=1, Tue=2, etc.
                const slots = grouped[dayEnum] || []
                converted[day] = slots.map(s => ({
                    time: `${s.startTime} - ${s.endTime}`,
                    subject: s.subject?.name || '',
                    prof: s.faculty?.user?.name || '',
                    room: s.room || '',
                    type: (s.type || 'LECTURE').toLowerCase(),
                    batch: s.batch?.name || '',
                }))
            })
            setSchedule(converted)
        } catch {
            // Mock fallback — show all classes (faculty teaches across batches)
            setSchedule(mockTimetable)
        }

        setLoading(false)
    }

    const q = searchQuery.toLowerCase()
    const daySchedule = schedule[days[activeDay]] || []
    const filteredSchedule = daySchedule.filter(s =>
        !q || s.subject?.toLowerCase().includes(q) || s.room?.toLowerCase().includes(q) || s.type === 'lunch'
    )

    const lectures = daySchedule.filter(s => s.type === 'lecture').length
    const labs = daySchedule.filter(s => s.type === 'lab').length
    const tutorials = daySchedule.filter(s => s.type === 'tutorial').length
    const freePeriods = daySchedule.filter(s => s.type === 'free').length

    if (loading) {
        return (
            <>
                <div className="dashboard-header"><h1>My Timetable</h1></div>
                <div className="dashboard-grid">
                    {[1, 2].map(i => <SkeletonCard key={i} />)}
                </div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>My Timetable</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search classes..." aria-label="Search classes" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="day-selector" role="tablist" aria-label="Day of week">
                {days.map((day, i) => (
                    <button
                        key={day}
                        role="tab"
                        aria-selected={activeDay === i}
                        className={`day-btn${activeDay === i ? ' active' : ''}`}
                        onClick={() => setActiveDay(i)}
                    >
                        {day}
                    </button>
                ))}
            </div>

            <div className="dash-card" style={{ marginBottom: 24 }}>
                <h2>{days[activeDay]}day Schedule</h2>
                <div className="timetable-grid">
                    {filteredSchedule.length > 0
                        ? filteredSchedule.map((slot, i) => (
                            <div key={i} className={`timetable-slot ${slot.type}`}>
                                <div className="slot-time">{slot.time}</div>
                                {slot.type === 'lunch' ? (
                                    <div className="slot-info"><h4>Lunch Break</h4></div>
                                ) : slot.type === 'free' ? (
                                    <div className="slot-info"><h4>Free Period</h4><p>No class scheduled</p></div>
                                ) : (
                                    <>
                                        <div className="slot-info">
                                            <h4>{slot.subject}</h4>
                                            <p>{slot.room} {slot.batch ? `• ${slot.batch}` : slot.prof ? `• ${slot.prof}` : ''}</p>
                                        </div>
                                        <span className={`slot-type-badge ${slot.type}`}>
                                            {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No classes scheduled</p>
                    }
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Day Summary</h2>
                    <div className="stats-row" style={{ marginBottom: 0 }}>
                        <div className="dash-stat-card">
                            <div className="dash-stat-icon blue">📚</div>
                            <div className="dash-stat-info"><h3>{lectures}</h3><p>Lectures</p></div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-icon green">🔬</div>
                            <div className="dash-stat-info"><h3>{labs}</h3><p>Labs</p></div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-icon purple">📝</div>
                            <div className="dash-stat-info"><h3>{tutorials}</h3><p>Tutorials</p></div>
                        </div>
                        <div className="dash-stat-card">
                            <div className="dash-stat-icon yellow">⏰</div>
                            <div className="dash-stat-info"><h3>{freePeriods}</h3><p>Free Periods</p></div>
                        </div>
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Next Class</h2>
                    {(() => {
                        const nextClass = daySchedule.find(s => s.type !== 'lunch' && s.type !== 'free')
                        if (!nextClass) return <p style={{ color: '#9CA3AF' }}>No classes today</p>
                        return (
                            <div className="class-item" style={{ border: 'none', padding: '8px 0' }}>
                                <div className="class-time" style={{ fontSize: 18 }}>{nextClass.time.split(' - ')[0]}</div>
                                <div className="class-details">
                                    <h4 style={{ fontSize: 16 }}>{nextClass.subject}</h4>
                                    <p>{nextClass.room} {nextClass.batch ? `• ${nextClass.batch}` : ''}</p>
                                    <span className={`slot-type-badge ${nextClass.type}`} style={{ marginTop: 8, display: 'inline-block' }}>
                                        {nextClass.type.charAt(0).toUpperCase() + nextClass.type.slice(1)}
                                    </span>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </>
    )
}

export default FacultyTimetable
