import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import '../Dashboard.css'

function FacultyProfile() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [editing, setEditing] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '+91 98765 00001',
        employeeId: user?.employeeId || 'FAC001',
        department: user?.department || 'CS',
        designation: user?.designation || 'Associate Professor',
        room: user?.room || 'Room 305',
    })

    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

    function handleSave() {
        setEditing(false)
        showToast('Profile updated successfully!', 'success')
    }

    function handlePasswordChange(e) {
        e.preventDefault()
        if (passwords.newPass !== passwords.confirm) {
            showToast('Passwords do not match', 'error')
            return
        }
        if (passwords.newPass.length < 6) {
            showToast('Password must be at least 6 characters', 'error')
            return
        }
        setShowPasswordForm(false)
        setPasswords({ current: '', newPass: '', confirm: '' })
        showToast('Password changed successfully!', 'success')
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1>My Profile</h1>
                <div className="header-right">
                    {!editing ? (
                        <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                    ) : (
                        <button className="btn-primary" onClick={handleSave}>Save Changes</button>
                    )}
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Profile Card */}
                <div className="dash-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, fontWeight: 800, color: 'white',
                        background: user?.avatar?.color || '#2563EB'
                    }}>
                        {user?.avatar?.initial || 'F'}
                    </div>
                    <h2 style={{ marginBottom: 4, fontSize: 22 }}>{user?.name || 'Faculty'}</h2>
                    <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{form.designation}</p>
                    <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 4 }}>{form.department} Department • {form.room}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{form.employeeId}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Employee ID</div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="dash-card">
                    <h2>Contact Information</h2>
                    <div className="demo-form">
                        <div className="form-group">
                            <label htmlFor="fac-name">Full Name</label>
                            <input
                                id="fac-name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fac-email">Email</label>
                            <input
                                id="fac-email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fac-phone">Phone</label>
                            <input
                                id="fac-phone"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fac-empid">Employee ID</label>
                            <input id="fac-empid" value={form.employeeId} disabled style={{ background: 'var(--gray-50)' }} />
                        </div>
                    </div>
                </div>

                {/* Academic Info */}
                <div className="dash-card">
                    <h2>Academic Details</h2>
                    <div className="modal-body">
                        <div className="detail-row"><span className="detail-label">Department</span><span className="detail-value">{form.department}</span></div>
                        <div className="detail-row"><span className="detail-label">Designation</span><span className="detail-value">{form.designation}</span></div>
                        <div className="detail-row"><span className="detail-label">Room</span><span className="detail-value">{form.room}</span></div>
                        <div className="detail-row"><span className="detail-label">Employee ID</span><span className="detail-value">{form.employeeId}</span></div>
                        <div className="detail-row"><span className="detail-label">Subjects</span><span className="detail-value">Machine Learning, Deep Learning</span></div>
                        <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value" style={{ color: 'var(--success)' }}>Active</span></div>
                    </div>
                </div>

                {/* Password Change */}
                <div className="dash-card">
                    <h2>Security</h2>
                    {!showPasswordForm ? (
                        <div>
                            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 16 }}>Manage your password and security settings</p>
                            <button className="btn-primary" onClick={() => setShowPasswordForm(true)}>Change Password</button>
                        </div>
                    ) : (
                        <form className="demo-form" onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label htmlFor="fac-cur-pw">Current Password</label>
                                <input id="fac-cur-pw" type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fac-new-pw">New Password</label>
                                <input id="fac-new-pw" type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fac-conf-pw">Confirm New Password</label>
                                <input id="fac-conf-pw" type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary">Update Password</button>
                                <button type="button" className="btn-view" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FacultyProfile
