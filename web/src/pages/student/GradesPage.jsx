import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useAuth } from '../../context/AuthContext'
import { gradeAPI } from '../../services/api'
import { students as mockStudents } from '../../data/mockDatabase'
import { PageSkeleton } from '../../components/Skeleton'
import '../Dashboard.css'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
)

const cgpaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { min: 5, max: 10, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
    }
}

const subjectOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { min: 0, max: 100, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        y: { grid: { display: false }, ticks: { font: { size: 13 } } }
    }
}

function getGradeClass(grade) {
    if (grade === 'A+') return 'a-plus'
    if (grade === 'A') return 'a'
    if (grade === 'B+') return 'b-plus'
    if (grade === 'B') return 'b'
    return 'c'
}

function GradesPage() {
    const { user } = useAuth()
    const [activeSem, setActiveSem] = useState(user.semester || 6)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    const [gradeStats, setGradeStats] = useState({ cgpa: 0, currentSgpa: 0, highestSgpa: 0, highestSem: 1, creditsCompleted: 0, totalCredits: 144, rank: '—', totalStudents: '—', deptRank: '—', deptTotal: '—', cgpaTrend: [], gradeDistribution: {} })
    const [semesterGrades, setSemesterGrades] = useState({})
    const [currentSemGrades, setCurrentSemGrades] = useState([])
    const [semesterResults, setSemesterResults] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        loadSemGrades(activeSem)
    }, [activeSem])

    async function loadData() {
        const studentId = user.studentId
        const [statsRes, allGradesRes] = await Promise.allSettled([
            gradeAPI.getStats(studentId),
            gradeAPI.getByStudent(studentId),
        ])

        const hasApiData = statsRes.status === 'fulfilled' || allGradesRes.status === 'fulfilled'
        if (!hasApiData) {
            const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
            const g = mockStudent.grades

            setGradeStats({
                cgpa: g.cgpa,
                currentSgpa: g.currentSgpa,
                highestSgpa: g.highestSgpa,
                highestSem: g.highestSem,
                creditsCompleted: g.creditsCompleted,
                totalCredits: g.totalCredits,
                rank: g.rank,
                totalStudents: g.totalStudents,
                deptRank: g.deptRank,
                deptTotal: g.deptTotal,
                cgpaTrend: g.cgpaTrend,
                gradeDistribution: {},
            })

            // Build semester results from semesters data
            const semResults = Object.entries(g.semesters).map(([sem, data]) => ({
                semester: parseInt(sem),
                sgpa: data.sgpa,
                creditsEarned: data.credits,
            }))
            setSemesterResults(semResults)

            // Build semester grades map
            const map = {}
            for (const [sem, data] of Object.entries(g.semesters)) {
                map[parseInt(sem)] = data.subjects.map(s => ({
                    subject: { name: s.name },
                    credits: s.credits,
                    grade: s.grade,
                    points: s.points,
                    semester: parseInt(sem),
                }))
            }
            setSemesterGrades(map)

            // Convert mock gradeDistribution array to map
            const distMap = {}
            for (const d of (g.gradeDistribution || [])) {
                distMap[d.grade] = d.count
            }
            setGradeStats(prev => ({ ...prev, gradeDistribution: distMap }))

            setLoading(false)
            return
        }

        if (statsRes.status === 'fulfilled') {
            setGradeStats(prev => ({ ...prev, ...statsRes.value }))
        }

        if (allGradesRes.status === 'fulfilled') {
            setSemesterResults(allGradesRes.value.semesterResults || [])
            // Build semesters map from grades
            const map = {}
            for (const g of (allGradesRes.value.grades || [])) {
                if (!map[g.semester]) map[g.semester] = []
                map[g.semester].push(g)
            }
            setSemesterGrades(map)
        }

        setLoading(false)
    }

    async function loadSemGrades(sem) {
        // Check if we already have mock/cached data for this semester
        if (semesterGrades[sem] && semesterGrades[sem].length > 0) {
            setCurrentSemGrades(semesterGrades[sem])
            return
        }
        try {
            const res = await gradeAPI.getBySemester(user.studentId, sem)
            setCurrentSemGrades(res.grades || [])
        } catch {
            // Fallback to mock data
            const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
            const semData = mockStudent.grades.semesters[sem]
            if (semData) {
                setCurrentSemGrades(semData.subjects.map(s => ({
                    subject: { name: s.name, shortName: s.name.split(' ').map(w => w[0]).join('') },
                    credits: s.credits,
                    grade: s.grade,
                    points: s.points,
                })))
            } else {
                setCurrentSemGrades([])
            }
        }
    }

    const q = searchQuery.toLowerCase()
    const activeSemGrades = semesterGrades[activeSem] || []
    const filteredSubjects = activeSemGrades.filter(g =>
        !g.subject || !q || g.subject.name.toLowerCase().includes(q)
    )
    const activeSemResult = semesterResults.find(r => r.semester === activeSem)

    // CGPA trend chart
    const cgpaData = semesterResults.length > 0 ? {
        labels: semesterResults.map(r => `Sem ${r.semester}`),
        datasets: [{
            label: 'SGPA',
            data: semesterResults.map(r => r.sgpa),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#2563EB', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 6,
        }]
    } : null

    // Current semester score chart
    const subjectData = currentSemGrades.length > 0 ? {
        labels: currentSemGrades.map(g => g.subject?.shortName || g.subject?.code || ''),
        datasets: [{
            label: 'Score',
            data: currentSemGrades.map(g => Math.min(100, g.points * 10)),
            backgroundColor: currentSemGrades.map(g => g.points >= 8 ? '#22C55E' : '#F59E0B'),
            borderRadius: 8,
            barThickness: 24,
        }]
    } : null

    // Grade distribution
    const distColors = { 'A+': '#22C55E', 'A': '#2563EB', 'B+': '#8B5CF6', 'B': '#F59E0B', 'C': '#EF4444' }
    const dist = gradeStats.gradeDistribution || {}
    const totalGrades = Object.values(dist).reduce((s, v) => s + v, 0)
    const gradeDist = Object.entries(dist).map(([grade, count]) => ({
        grade,
        count,
        pct: totalGrades > 0 ? Math.round((count / totalGrades) * 100) : 0,
        color: distColors[grade] || '#6B7280',
    }))

    if (loading) return <PageSkeleton />

    const cgpa = gradeStats.cgpa || 0
    const currentSgpa = gradeStats.currentSgpa || 0
    const highestSgpa = gradeStats.highestSgpa || 0
    const creditsCompleted = gradeStats.creditsCompleted || 0
    const totalCredits = gradeStats.totalCredits || 144

    return (
        <>
            <div className="dashboard-header">
                <h1>Grades</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search subjects..." aria-label="Search subjects" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">🎓</div>
                    <div className="dash-stat-info">
                        <h3>{typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa}</h3>
                        <p>Current CGPA</p>
                        <div className={`trend ${cgpa >= 8 ? 'up' : 'down'}`}>
                            {cgpa >= 8 ? '↑ Strong' : '↓ Needs improvement'}
                        </div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">📊</div>
                    <div className="dash-stat-info">
                        <h3>{typeof currentSgpa === 'number' ? currentSgpa.toFixed(2) : currentSgpa}</h3>
                        <p>Current SGPA</p>
                        <div className="trend up">Semester {user.semester || activeSem}</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🏆</div>
                    <div className="dash-stat-info">
                        <h3>{typeof highestSgpa === 'number' ? highestSgpa.toFixed(2) : highestSgpa}</h3>
                        <p>Highest SGPA</p>
                        <div className="trend up">Semester {gradeStats.highestSem || '—'}</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">📚</div>
                    <div className="dash-stat-info">
                        <h3>{creditsCompleted}/{totalCredits}</h3>
                        <p>Credits Completed</p>
                        <div className="trend up">{totalCredits > 0 ? Math.round((creditsCompleted / totalCredits) * 100) : 0}% done</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>CGPA Trend</h2>
                    <div className="chart-container">
                        {cgpaData
                            ? <Line data={cgpaData} options={cgpaOptions} />
                            : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No semester data yet</p>
                        }
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Current Semester Scores</h2>
                    <div className="chart-container">
                        {subjectData
                            ? <Bar data={subjectData} options={subjectOptions} />
                            : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No grades yet</p>
                        }
                    </div>
                </div>

                <div className="dash-card full-width">
                    <h2>Semester Results</h2>
                    <div className="semester-tabs" role="tablist" aria-label="Semester selection">
                        {[1, 2, 3, 4, 5, 6].map(s => (
                            <button
                                key={s}
                                role="tab"
                                aria-selected={activeSem === s}
                                className={`sem-tab${activeSem === s ? ' active' : ''}`}
                                onClick={() => setActiveSem(s)}
                            >
                                Sem {s}
                            </button>
                        ))}
                    </div>
                    {filteredSubjects.length > 0 ? (
                        <table className="faculty-table" aria-label={`Semester ${activeSem} grades`}>
                            <thead>
                                <tr><th>Subject</th><th>Credits</th><th>Grade</th><th>Grade Points</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.map((g, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{g.subject?.name || '—'}</td>
                                        <td>{g.credits}</td>
                                        <td><span className={`grade-badge ${getGradeClass(g.grade)}`}>{g.grade}</span></td>
                                        <td style={{ fontWeight: 700 }}>{g.points}</td>
                                        <td><span className="status-badge safe">Passed</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No grades for Semester {activeSem}</p>
                    )}
                    {activeSemResult && (
                        <div className="semester-summary">
                            <div className="semester-summary-item">
                                <div className="value">{activeSemResult.sgpa?.toFixed(2)}</div>
                                <div className="label">SGPA</div>
                            </div>
                            <div className="semester-summary-item">
                                <div className="value">{activeSemResult.creditsEarned}</div>
                                <div className="label">Credits</div>
                            </div>
                            <div className="semester-summary-item">
                                <div className="value">{filteredSubjects.length}</div>
                                <div className="label">Subjects</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dash-card">
                    <h2>Grade Distribution</h2>
                    {gradeDist.length > 0
                        ? gradeDist.map((gd, i) => (
                            <div className="grade-bar-row" key={i}>
                                <span className="grade-bar-label">{gd.grade}</span>
                                <div className="grade-bar-track">
                                    <div className="grade-bar-fill" style={{ width: `${gd.pct}%`, background: gd.color }} />
                                </div>
                                <span className="grade-bar-count">{gd.count}</span>
                            </div>
                        ))
                        : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No grade data yet</p>
                    }
                </div>

                <div className="dash-card">
                    <h2>Academic Standing</h2>
                    <div className="academic-standing-item">
                        <div className="dash-stat-icon green">🏅</div>
                        <div className="dash-stat-info">
                            <h3 style={{ fontSize: 20 }}>{cgpa >= 8 ? "Dean's List" : 'Good Standing'}</h3>
                            <p>CGPA {cgpa >= 8 ? 'above' : 'below'} 8.0</p>
                        </div>
                    </div>
                    <div className="academic-standing-item">
                        <div className="dash-stat-icon blue">🎯</div>
                        <div className="dash-stat-info">
                            <h3 style={{ fontSize: 20 }}>Rank {gradeStats.rank || '—'}</h3>
                            <p>Out of {gradeStats.totalStudents || '—'} students</p>
                        </div>
                    </div>
                    <div className="academic-standing-item">
                        <div className="dash-stat-icon purple">📈</div>
                        <div className="dash-stat-info">
                            <h3 style={{ fontSize: 20 }}>Dept. Rank {gradeStats.deptRank || '—'}</h3>
                            <p>Out of {gradeStats.deptTotal || '—'} in dept.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default GradesPage
