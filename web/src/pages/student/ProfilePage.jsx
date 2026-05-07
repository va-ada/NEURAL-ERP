import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { academicAPI } from '../../services/api'

function ProfilePage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [editing, setEditing] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '+91 98765 43210',
        roll: user?.roll || 'AIML001',
        semester: user?.semester || 6,
        section: user?.section || 'A',
    })

    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

    async function handleSave() {
        try {
            await academicAPI.updateStudent(user.studentId, {
                phone: form.phone,
                section: form.section,
            })
            setEditing(false)
            showToast('Profile updated successfully!', 'success')
        } catch (err) {
            showToast(err.message || 'Failed to update profile', 'error')
        }
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
                        background: user?.avatar?.color || '#22C55E'
                    }}>
                        {user?.avatar?.initial || 'U'}
                    </div>
                    <h2 style={{ marginBottom: 4, fontSize: 22 }}>{user?.name || 'Student'}</h2>
                    <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>AI/ML Department • Semester {form.semester}</p>
                    <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 4 }}>{form.roll} • Section {form.section}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{user?.stats?.attendance || 92}%</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Attendance</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{user?.stats?.cgpa || 8.5}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>CGPA</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--purple)' }}>{user?.stats?.careerScore || 78}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Career Score</div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="dash-card">
                    <h2>Contact Information</h2>
                    <div className="demo-form">
                        <div className="form-group">
                            <label htmlFor="profile-name">Full Name</label>
                            <input
                                id="profile-name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-email">Email</label>
                            <input
                                id="profile-email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-phone">Phone</label>
                            <input
                                id="profile-phone"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                disabled={!editing}
                                style={{ background: editing ? undefined : 'var(--gray-50)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-roll">Roll Number</label>
                            <input id="profile-roll" value={form.roll} disabled style={{ background: 'var(--gray-50)' }} />
                        </div>
                    </div>
                </div>

                {/* Academic Info */}
                <div className="dash-card">
                    <h2>Academic Details</h2>
                    <div className="modal-body">
                        <div className="detail-row"><span className="detail-label">Department</span><span className="detail-value">AI/ML</span></div>
                        <div className="detail-row"><span className="detail-label">Semester</span><span className="detail-value">{form.semester}</span></div>
                        <div className="detail-row"><span className="detail-label">Section</span><span className="detail-value">{form.section}</span></div>
                        <div className="detail-row"><span className="detail-label">CGPA</span><span className="detail-value">{user?.stats?.cgpa || 8.5}</span></div>
                        <div className="detail-row"><span className="detail-label">Rank</span><span className="detail-value">12 / 180</span></div>
                        <div className="detail-row"><span className="detail-label">Academic Standing</span><span className="detail-value" style={{ color: 'var(--success)' }}>Dean's List</span></div>
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
                                <label htmlFor="current-password">Current Password</label>
                                <input id="current-password" type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new-password">New Password</label>
                                <input id="new-password" type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm New Password</label>
                                <input id="confirm-password" type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
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

export default ProfilePage
