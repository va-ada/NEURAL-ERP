import { useState } from 'react'

export default function AdminAnnouncementsTab({ announcements, setAnnouncements, showToast }) {
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
    const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', audience: 'All' })

    function createAnnouncement() {
        if (!announcementForm.title || !announcementForm.body) return showToast('Title and body required', 'warning')
        setAnnouncements(prev => [{ id: Date.now(), ...announcementForm, time: 'Just now', status: 'Active' }, ...prev])
        setShowAnnouncementModal(false)
        setAnnouncementForm({ title: '', body: '', audience: 'All' })
        showToast('Announcement published!', 'success')
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Announcements</h1>
                <div className="header-right"><button className="btn-primary" onClick={() => setShowAnnouncementModal(true)}>+ New Announcement</button></div>
            </div>
            <div className="stats-row">
                <div className="dash-stat-card"><div className="dash-stat-icon blue">📢</div><div className="dash-stat-info"><h3>{announcements.length}</h3><p>Total</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon green">✅</div><div className="dash-stat-info"><h3>{announcements.filter(a => a.status === 'Active').length}</h3><p>Active</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon yellow">⏰</div><div className="dash-stat-info"><h3>{announcements.filter(a => a.status === 'Expired').length}</h3><p>Expired</p></div></div>
            </div>
            <div className="dash-card">
                <h2>All Announcements</h2>
                {announcements.map(a => (
                    <div key={a.id} className="notification-item" style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 16, marginBottom: 16 }}>
                        <div className={`notification-icon ${a.status === 'Active' ? 'success' : 'warning'}`}>📢</div>
                        <div className="notification-content" style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</p>
                            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{a.body}</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--gray-400)' }}>
                                <span>🎯 {a.audience}</span><span>🕐 {a.time}</span>
                            </div>
                        </div>
                        <span className={`status-badge ${a.status === 'Active' ? 'safe' : 'warning'}`}>{a.status}</span>
                    </div>
                ))}
            </div>
            {showAnnouncementModal && (
                <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
                    <div className="modal-content" role="dialog" aria-modal="true" aria-label="New announcement" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Announcement</h2><button className="modal-close" aria-label="Close dialog" onClick={() => setShowAnnouncementModal(false)}>&times;</button></div>
                        <div className="modal-body">
                            <div className="demo-form">
                                <div className="form-group"><label htmlFor="ann-title">Title</label><input id="ann-title" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Announcement title..." /></div>
                                <div className="form-group"><label htmlFor="ann-body">Body</label><textarea id="ann-body" value={announcementForm.body} onChange={e => setAnnouncementForm({ ...announcementForm, body: e.target.value })} rows={3} placeholder="Details..." /></div>
                                <div className="form-group"><label htmlFor="ann-audience">Audience</label>
                                    <select id="ann-audience" value={announcementForm.audience} onChange={e => setAnnouncementForm({ ...announcementForm, audience: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14 }}>
                                        <option>All</option><option>Final Year</option><option>Faculty</option><option>Section A</option><option>Section B</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn-secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
                                <button className="modal-btn-primary" onClick={createAnnouncement}>Publish</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
