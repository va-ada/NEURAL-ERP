import { Bar, Doughnut } from 'react-chartjs-2'

export default function AdminPlacementsTab({ d, placementsLoading, placementCompanies, placementData, placementOptions }) {
    return (
        <>
            <div className="dashboard-header">
                <h1>Placement Management</h1>
                {placementsLoading && <span style={{ fontSize: 13, color: 'var(--gray-400)', marginLeft: 12 }}>Loading live data...</span>}
            </div>
            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">📈</div>
                    <div className="dash-stat-info">
                        <h3>{d.placementRate}%</h3>
                        <p>Placement Rate</p>
                        <div className="trend up">↑ +3% vs last year</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">🏢</div>
                    <div className="dash-stat-info">
                        <h3>{placementCompanies.length}</h3>
                        <p>Companies Visited</p>
                        <div className="trend up">This year</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">💰</div>
                    <div className="dash-stat-info">
                        <h3>₹45 LPA</h3>
                        <p>Highest Package</p>
                        <div className="trend up">Google — ML Engineer</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">🎓</div>
                    <div className="dash-stat-info">
                        <h3>{placementCompanies.reduce((s, c) => s + c.hired, 0)}</h3>
                        <p>Total Offers</p>
                        <div className="trend up">Across all companies</div>
                    </div>
                </div>
            </div>
            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Placement Trend (Year-wise)</h2>
                    <div className="chart-container">
                        <Bar data={placementData} options={placementOptions} />
                    </div>
                </div>
                <div className="dash-card">
                    <h2>Package Distribution</h2>
                    <div className="chart-container">
                        <Doughnut data={{
                            labels: ['₹30+ LPA', '₹15-30 LPA', '₹8-15 LPA', '< ₹8 LPA'],
                            datasets: [{ data: [35, 30, 25, 10], backgroundColor: ['#22C55E', '#2563EB', '#F59E0B', '#EF4444'], borderWidth: 0 }]
                        }} options={{
                            responsive: true, maintainAspectRatio: false, cutout: '55%',
                            plugins: { legend: { position: 'right', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 13 } } } }
                        }} />
                    </div>
                </div>
                <div className="dash-card full-width">
                    <h2>Company-wise Placements</h2>
                    <table className="faculty-table" aria-label="Company-wise placements">
                        <thead>
                            <tr><th>Company</th><th>Roles</th><th>Students Hired</th><th>Avg Package</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {placementCompanies.map((c, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{c.company}</td>
                                    <td>{c.role}</td>
                                    <td style={{ fontWeight: 700 }}>{c.hired}</td>
                                    <td style={{ fontWeight: 700, color: '#22C55E' }}>{c.avgPackage}</td>
                                    <td>
                                        <span className={`status-badge ${c.status === 'Completed' ? 'safe' : c.status === 'Ongoing' ? 'warning' : 'danger'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
