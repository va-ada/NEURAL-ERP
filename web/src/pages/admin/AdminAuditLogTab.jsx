import { useState } from 'react'

const ITEMS_PER_PAGE = 25

export default function AdminAuditLogTab({ auditLog }) {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = Math.ceil(auditLog.length / ITEMS_PER_PAGE)
    const paginatedLog = auditLog.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    return (
        <>
            <div className="dashboard-header"><h1>Audit Log</h1></div>
            <div className="stats-row">
                <div className="dash-stat-card"><div className="dash-stat-icon blue">📋</div><div className="dash-stat-info"><h3>{auditLog.length}</h3><p>Total Actions</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon green">➕</div><div className="dash-stat-info"><h3>{auditLog.filter(a => a.type === 'create').length}</h3><p>Created</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon yellow">✏️</div><div className="dash-stat-info"><h3>{auditLog.filter(a => a.type === 'update').length}</h3><p>Updated</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon red">🗑️</div><div className="dash-stat-info"><h3>{auditLog.filter(a => a.type === 'delete').length}</h3><p>Deleted</p></div></div>
            </div>
            <div className="dash-card">
                <h2>Recent Activity Log</h2>
                <table className="faculty-table" aria-label="Recent activity log">
                    <thead><tr><th>Action</th><th>User</th><th>Details</th><th>Timestamp</th><th>Type</th></tr></thead>
                    <tbody>
                        {paginatedLog.map(log => (
                            <tr key={log.id}>
                                <td style={{ fontWeight: 600 }}>{log.action}</td>
                                <td>{log.user}</td>
                                <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{log.details}</td>
                                <td style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{log.time}</td>
                                <td><span className={`status-badge ${log.type === 'create' ? 'safe' : log.type === 'update' ? 'warning' : 'danger'}`}>{log.type}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </>
    )
}
