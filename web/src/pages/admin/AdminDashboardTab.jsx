import { Bar, Doughnut } from 'react-chartjs-2'

const StarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>

export default function AdminDashboardTab({ d, searchQuery, onSearchChange, setActiveTab, deptData, deptOptions, placementData, placementOptions }) {
    const q = searchQuery.toLowerCase()

    return (
        <>
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search..." aria-label="Search dashboard" value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">👨‍🎓</div>
                    <div className="dash-stat-info">
                        <h3>{d.totalStudents}</h3>
                        <p>Total Students</p>
                        <div className="trend up">AI/ML Dept</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">👨‍🏫</div>
                    <div className="dash-stat-info">
                        <h3>{d.totalFaculty}</h3>
                        <p>Faculty</p>
                        <div className="trend up">All active</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">📈</div>
                    <div className="dash-stat-info">
                        <h3>{d.placementRate}%</h3>
                        <p>Placement Rate</p>
                        <div className="trend up">↑ +3% vs last year</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">⚡</div>
                    <div className="dash-stat-info">
                        <h3>{d.systemUptime}%</h3>
                        <p>System Uptime</p>
                        <div className="trend up">All systems operational</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Specialization Distribution</h2>
                    <div className="chart-container">
                        <Doughnut data={deptData} options={deptOptions} />
                    </div>
                    <div className="donut-center">
                        <div className="big-number">{d.totalStudents}</div>
                        <div className="label">Total Students</div>
                    </div>
                </div>

                <div className="dash-card">
                    <h2>Top Faculty Performance</h2>
                    <table className="faculty-table" aria-label="Top faculty performance">
                        <thead>
                            <tr><th>Faculty</th><th>Department</th><th>Classes</th><th>Rating</th></tr>
                        </thead>
                        <tbody>
                            {d.topFaculty.filter(f => !q || f.name.toLowerCase().includes(q) || f.dept.toLowerCase().includes(q)).map((f, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="faculty-name">
                                            <div className={`faculty-avatar ${f.type}`}>{f.type === 'd' ? 'D' : 'P'}</div>
                                            {f.name}
                                        </div>
                                    </td>
                                    <td>{f.dept}</td>
                                    <td>{f.classes}</td>
                                    <td><div className="rating"><StarIcon /> {f.rating}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="dash-card">
                    <h2>Placement Statistics</h2>
                    <div className="chart-container">
                        <Bar data={placementData} options={placementOptions} />
                    </div>
                </div>

                <div className="dash-card">
                    <h2>At-Risk Students Alert</h2>
                    {d.atRiskStudents.filter(s => !q || s.name.toLowerCase().includes(q) || s.issue.toLowerCase().includes(q)).map((s, i) => (
                        <div className="risk-item" key={i}>
                            <div className="risk-icon">⚠️</div>
                            <div className="risk-info">
                                <h4>{s.name}</h4>
                                <p>{s.issue}</p>
                            </div>
                            <button className="btn-view" onClick={() => setActiveTab('students')}>View Details</button>
                        </div>
                    ))}
                </div>

                <div className="dash-card">
                    <h2>Recent Activity</h2>
                    {d.recentActivity.map((a, i) => (
                        <div className="notification-item" key={i}>
                            <div className={`notification-icon ${a.type}`}>
                                {a.type === 'success' ? '✅' : a.type === 'warning' ? '⚠️' : '📝'}
                            </div>
                            <div className="notification-content">
                                <p>{a.text}</p>
                                <span>{a.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
