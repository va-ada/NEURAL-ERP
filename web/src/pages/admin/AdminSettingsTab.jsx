import { useState, useEffect } from 'react'
import { adminAPI, predictionsAPI } from '../../services/api'

export default function AdminSettingsTab({ d, user, showToast }) {
    const [settingsNotifications, setSettingsNotifications] = useState({
        email: true, sms: false, attendance: true, grades: true, placements: true
    })

    // Institution settings from backend
    const [institution, setInstitution] = useState(null)
    const [settingsForm, setSettingsForm] = useState({ name: '', address: '', phone: '', email: '', logo: '' })
    const [saving, setSaving] = useState(false)

    // AI data-source indicator (read-only — runtime toggle is out of scope)
    const [aiMode, setAiMode] = useState(null)
    const [aiModeLoading, setAiModeLoading] = useState(true)
    const [aiModeError, setAiModeError] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function loadDataMode() {
            try {
                const res = await predictionsAPI.getDataMode()
                if (cancelled) return
                setAiMode(res?.dataMode || res?.mode || 'demo')
            } catch (err) {
                if (cancelled) return
                setAiModeError(err?.message || 'Unable to read AI data mode')
            } finally {
                if (!cancelled) setAiModeLoading(false)
            }
        }
        loadDataMode()
        return () => { cancelled = true }
    }, [])

    // Load settings when the tab mounts
    useEffect(() => {
        let cancelled = false
        async function loadSettings() {
            try {
                const res = await adminAPI.getSettings()
                if (cancelled) return
                if (res?.institution) {
                    setInstitution(res.institution)
                    setSettingsForm({
                        name: res.institution.name || '',
                        address: res.institution.address || '',
                        phone: res.institution.phone || '',
                        email: res.institution.email || '',
                        logo: res.institution.logo || '',
                    })
                }
            } catch (err) {
                console.error('Failed to load settings:', err)
                // Non-blocking — the UI still shows default/local data
            }
        }
        loadSettings()
        return () => { cancelled = true }
    }, [])

    async function handleSaveSettings(e) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await adminAPI.updateSettings(settingsForm)
            if (res?.institution) {
                setInstitution(res.institution)
            }
            showToast('Settings saved successfully', 'success')
        } catch (err) {
            showToast(err.message || 'Failed to save settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Settings</h1>
            </div>
            <div className="dashboard-grid">
                <div className="dash-card">
                    <h2>Institution Settings</h2>
                    <form onSubmit={handleSaveSettings}>
                        <div className="demo-form">
                            <div className="form-group">
                                <label>Institution Name</label>
                                <input value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} placeholder="St. Francis Institute of Technology" />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} placeholder="Mumbai, Maharashtra" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} placeholder="+91 22 XXXX XXXX" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input value={settingsForm.email} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} placeholder="admin@sfit.edu" />
                            </div>
                            <div className="form-group">
                                <label>Logo URL</label>
                                <input value={settingsForm.logo} onChange={e => setSettingsForm({ ...settingsForm, logo: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 16 }}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>

                <div className="dash-card">
                    <h2>System Information</h2>
                    {[
                        { label: 'System Version', value: 'Neural ERP v2.1.0' },
                        { label: 'Institute', value: institution?.name || 'St. Francis Institute of Technology' },
                        { label: 'Academic Year', value: '2025-2026' },
                        { label: 'Current Semester', value: 'Semester 6 (Even)' },
                        { label: 'System Uptime', value: `${d.systemUptime}%` },
                        { label: 'Last Backup', value: 'Mar 1, 2026 — 11:30 PM' },
                    ].map((item, i) => (
                        <div className="detail-row" key={i}>
                            <span className="detail-label">{item.label}</span>
                            <span className="detail-value">{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className="dash-card">
                    <h2>Notification Preferences</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -8, marginBottom: 16 }}>Configure which notifications the admin panel receives</p>
                    {[
                        { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                        { key: 'sms', label: 'SMS Notifications', desc: 'Receive alerts via SMS' },
                        { key: 'attendance', label: 'Attendance Alerts', desc: 'When students fall below threshold' },
                        { key: 'grades', label: 'Grade Updates', desc: 'When results are published' },
                        { key: 'placements', label: 'Placement Updates', desc: 'New drives and offers' },
                    ].map(item => (
                        <div className="detail-row" key={item.key} style={{ cursor: 'pointer' }} onClick={() => setSettingsNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}>
                            <div>
                                <span className="detail-label" style={{ display: 'block' }}>{item.label}</span>
                                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.desc}</span>
                            </div>
                            <div style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: settingsNotifications[item.key] ? '#22C55E' : '#D1D5DB',
                                position: 'relative', transition: 'background 0.2s',
                            }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 10,
                                    background: '#fff', position: 'absolute', top: 2,
                                    left: settingsNotifications[item.key] ? 22 : 2,
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dash-card">
                    <h2>Admin Profile</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div className="avatar" style={{ background: user?.avatar?.color || '#8B5CF6', width: 56, height: 56, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#fff', fontWeight: 700 }}>
                            {user?.avatar?.initial || 'A'}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18 }}>{user?.name || 'Admin'}</h3>
                            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>{user?.role || 'Administrator'}</p>
                        </div>
                    </div>
                    {[
                        { label: 'Name', value: user?.name || 'Admin' },
                        { label: 'Email', value: user?.email || 'admin@sfit.edu' },
                        { label: 'Role', value: user?.role || 'Administrator' },
                        { label: 'Department', value: 'AI/ML' },
                    ].map((item, i) => (
                        <div className="detail-row" key={i}>
                            <span className="detail-label">{item.label}</span>
                            <span className="detail-value">{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className="dash-card">
                    <h2>Quick Actions</h2>
                    {[
                        { icon: '📧', label: 'Send Broadcast Email', desc: 'Notify all students', color: '#2563EB' },
                        { icon: '📊', label: 'Export Reports', desc: 'Download attendance & grade reports', color: '#22C55E' },
                        { icon: '🔄', label: 'Sync Data', desc: 'Refresh all data from server', color: '#F59E0B' },
                        { icon: '🗃️', label: 'Backup Database', desc: 'Create system backup', color: '#8B5CF6' },
                    ].map((action, i) => (
                        <div className="career-item" key={i} style={{ cursor: 'pointer' }}>
                            <div className="career-logo" style={{ background: action.color }}>{action.icon}</div>
                            <div className="career-info">
                                <h4>{action.label}</h4>
                                <p>{action.desc}</p>
                            </div>
                            <button className="btn-view">Run</button>
                        </div>
                    ))}
                </div>

                <div className="dash-card full-width">
                    <h2>AI Data Source</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: -8, marginBottom: 16 }}>
                        Indicates which dataset the ML service is currently using for predictions. Read-only — change via environment variables.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 14, color: '#4B5563' }}>Current mode:</span>
                        {aiModeLoading ? (
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Checking…</span>
                        ) : aiModeError ? (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 999,
                                background: '#fee2e2', color: '#b91c1c',
                                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>Unavailable</span>
                        ) : (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 999,
                                background: aiMode === 'live' ? '#10b9811a' : '#f59e0b1a',
                                color: aiMode === 'live' ? '#047857' : '#b45309',
                                border: `1px solid ${aiMode === 'live' ? '#10b98140' : '#f59e0b40'}`,
                                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                {aiMode === 'live' ? 'Live' : aiMode === 'demo-fallback' ? 'Demo (fallback)' : 'Demo'}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 8px' }}>
                            <strong>Demo:</strong> predictions trained on a 500-record synthetic dataset. Safe for demo / portfolio review.
                        </p>
                        <p style={{ margin: 0 }}>
                            <strong>Live:</strong> predictions reflect real student records. Set <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>ML_DATA_MODE=live</code> in <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>backend/.env.local</code> and restart the ML service.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
