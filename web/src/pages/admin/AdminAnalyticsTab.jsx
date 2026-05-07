import { useEffect, useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import { predictionsAPI } from '../../services/api'
import AIInsightBadge from '../../components/AIInsightBadge'

export default function AdminAnalyticsTab({ allStudents, analyticsLoading, avgAttendanceByMonth, gradeDistAll }) {
    const [risk, setRisk] = useState(null)
    const [riskLoading, setRiskLoading] = useState(true)
    const [riskError, setRiskError] = useState(null)

    const [funnel, setFunnel] = useState(null)
    const [funnelLoading, setFunnelLoading] = useState(true)
    const [funnelError, setFunnelError] = useState(null)

    useEffect(() => {
        let cancelled = false

        predictionsAPI.getAdminDropoutRisk()
            .then(res => {
                if (cancelled) return
                setRisk(res)
                setRiskLoading(false)
            })
            .catch(err => {
                if (cancelled) return
                setRiskError(err?.message || 'Failed to load AI predictions')
                setRiskLoading(false)
            })

        predictionsAPI.getAdminPlacementFunnel()
            .then(res => {
                if (cancelled) return
                setFunnel(res)
                setFunnelLoading(false)
            })
            .catch(err => {
                if (cancelled) return
                setFunnelError(err?.message || 'Failed to load AI placement funnel')
                setFunnelLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    const riskyList = Array.isArray(risk?.risky) ? risk.risky : []
    const funnelData = funnel?.funnel || { predicted_high: 0, predicted_medium: 0, predicted_low: 0 }

    return (
        <>
            <div className="dashboard-header">
                <h1>Analytics</h1>
                {analyticsLoading && <span style={{ fontSize: 13, color: 'var(--gray-400)', marginLeft: 12 }}>Loading live data...</span>}
            </div>
            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📊</div>
                    <div className="dash-stat-info">
                        <h3>{(allStudents.reduce((s, st) => s + st.stats.attendance, 0) / allStudents.length).toFixed(0)}%</h3>
                        <p>Dept Avg Attendance</p>
                        <div className="trend up">AI/ML Department</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">🎓</div>
                    <div className="dash-stat-info">
                        <h3>{(allStudents.reduce((s, st) => s + st.stats.cgpa, 0) / allStudents.length).toFixed(1)}</h3>
                        <p>Dept Avg CGPA</p>
                        <div className="trend up">Semester 6</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🏆</div>
                    <div className="dash-stat-info">
                        <h3>{allStudents.filter(s => s.stats.cgpa >= 8.5).length}</h3>
                        <p>Dean's List Students</p>
                        <div className="trend up">CGPA &ge; 8.5</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">⚠️</div>
                    <div className="dash-stat-info">
                        <h3>{allStudents.filter(s => s.stats.attendance < 80).length}</h3>
                        <p>At-Risk Students</p>
                        <div className="trend down">Below 80% attendance</div>
                    </div>
                </div>
            </div>
            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Monthly Attendance Trend (Dept Avg)</h2>
                    <div className="chart-container">
                        <Line data={avgAttendanceByMonth} options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { min: 70, max: 100, grid: { color: '#E5E7EB' } },
                                x: { grid: { display: false } }
                            }
                        }} />
                    </div>
                </div>
                <div className="dash-card">
                    <h2>Grade Distribution (All Students)</h2>
                    <div className="chart-container">
                        <Doughnut data={gradeDistAll} options={{
                            responsive: true, maintainAspectRatio: false, cutout: '55%',
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 13 } }
                                }
                            }
                        }} />
                    </div>
                </div>
                <div className="dash-card">
                    <h2>Student Performance Comparison</h2>
                    <table className="faculty-table">
                        <thead>
                            <tr><th>Student</th><th>Attendance</th><th>CGPA</th><th>Career Score</th><th>Ranking</th></tr>
                        </thead>
                        <tbody>
                            {[...allStudents].sort((a, b) => b.stats.cgpa - a.stats.cgpa).map((st, i) => (
                                <tr key={st.id}>
                                    <td>
                                        <div className="faculty-name">
                                            <div className="faculty-avatar" style={{ background: st.avatar.color, color: '#fff' }}>{st.avatar.initial}</div>
                                            {st.name}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: st.stats.attendance < 80 ? '#EF4444' : '#22C55E' }}>{st.stats.attendance}%</td>
                                    <td style={{ fontWeight: 700 }}>{st.stats.cgpa}</td>
                                    <td>{st.stats.careerScore}/100</td>
                                    <td><span className={`status-badge ${i === 0 ? 'safe' : i < 3 ? 'warning' : 'danger'}`}>#{i + 1}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="dash-card full-width">
                    <h2>AI Predicted At-Risk Students</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -12, marginBottom: 16 }}>
                        Top students ranked by predicted dropout risk score from the ML service.
                    </p>
                    {riskLoading ? (
                        <p style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>Loading AI predictions…</p>
                    ) : riskError ? (
                        <p style={{ color: '#B45309', padding: '12px 0', fontSize: 13 }}>
                            No AI predictions available right now.
                        </p>
                    ) : (
                        <AIInsightBadge
                            dataMode={risk?.dataMode || 'demo'}
                            generatedAt={risk?.generatedAt}
                        >
                            {riskyList.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', padding: '8px 0', fontSize: 13 }}>
                                    No AI predictions available right now.
                                </p>
                            ) : (
                                <table className="faculty-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Student</th>
                                            <th>Dropout Score</th>
                                            <th>Top Factor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {riskyList.map((s, i) => {
                                            const topFactor = Array.isArray(s.topFactors) && s.topFactors.length > 0
                                                ? (s.topFactors[0]?.name || s.topFactors[0])
                                                : '—'
                                            return (
                                                <tr key={s.studentId || i}>
                                                    <td><span className={`status-badge ${i < 3 ? 'danger' : i < 6 ? 'warning' : 'safe'}`}>#{i + 1}</span></td>
                                                    <td>{s.name || s.studentId}</td>
                                                    <td style={{ fontWeight: 700, color: s.score >= 70 ? '#EF4444' : s.score >= 40 ? '#F59E0B' : '#22C55E' }}>{Math.round(s.score)}/100</td>
                                                    <td style={{ fontSize: 13, color: '#4B5563' }}>{String(topFactor).replace(/_/g, ' ')}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </AIInsightBadge>
                    )}
                </div>

                <div className="dash-card full-width">
                    <h2>AI Placement Funnel</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -12, marginBottom: 16 }}>
                        Predicted placement-readiness buckets across the cohort.
                    </p>
                    {funnelLoading ? (
                        <p style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>Loading AI predictions…</p>
                    ) : funnelError ? (
                        <p style={{ color: '#B45309', padding: '12px 0', fontSize: 13 }}>
                            No AI predictions available right now.
                        </p>
                    ) : (
                        <AIInsightBadge
                            dataMode={funnel?.dataMode || 'demo'}
                            generatedAt={funnel?.generatedAt}
                        >
                            <div className="stats-row" style={{ marginTop: 0 }}>
                                <div className="dash-stat-card">
                                    <div className="dash-stat-icon green">🎯</div>
                                    <div className="dash-stat-info">
                                        <h3>{funnelData.predicted_high}</h3>
                                        <p>High Probability</p>
                                        <div className="trend up">Score &ge; 75</div>
                                    </div>
                                </div>
                                <div className="dash-stat-card">
                                    <div className="dash-stat-icon yellow">⚖️</div>
                                    <div className="dash-stat-info">
                                        <h3>{funnelData.predicted_medium}</h3>
                                        <p>Medium Probability</p>
                                        <div className="trend up">Score 45–74</div>
                                    </div>
                                </div>
                                <div className="dash-stat-card">
                                    <div className="dash-stat-icon red">⚠️</div>
                                    <div className="dash-stat-info">
                                        <h3>{funnelData.predicted_low}</h3>
                                        <p>Low Probability</p>
                                        <div className="trend down">Score &lt; 45</div>
                                    </div>
                                </div>
                            </div>
                        </AIInsightBadge>
                    )}
                </div>

                <div className="dash-card">
                    <h2>Key Insights</h2>
                    {[
                        { icon: '📈', text: 'Department attendance improved by 3% compared to last semester', type: 'success' },
                        { icon: '🎯', text: `${allStudents.filter(s => s.stats.cgpa >= 9).length} students maintaining CGPA above 9.0`, type: 'success' },
                        { icon: '⚠️', text: `${allStudents.filter(s => s.stats.attendance < 80).length} student(s) below 80% attendance threshold`, type: 'warning' },
                        { icon: '📊', text: 'Average career readiness score: ' + (allStudents.reduce((s, st) => s + st.stats.careerScore, 0) / allStudents.length).toFixed(0) + '/100', type: 'info' },
                        { icon: '🏆', text: 'Highest CGPA this semester: ' + Math.max(...allStudents.map(s => s.stats.cgpa)).toFixed(1), type: 'success' },
                    ].map((item, i) => (
                        <div className="notification-item" key={i}>
                            <div className={`notification-icon ${item.type}`}>{item.icon}</div>
                            <div className="notification-content">
                                <p>{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
