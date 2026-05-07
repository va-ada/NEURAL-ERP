import { useState } from 'react'

const StarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>

export default function AdminFacultyTab({ facultyList, setFacultyList, showToast }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showFacultyModal, setShowFacultyModal] = useState(false)
    const [editingFaculty, setEditingFaculty] = useState(null)
    const [facultyForm, setFacultyForm] = useState({ name: '', subject: '', email: '', room: '', rating: 4.5 })

    const q = searchQuery.toLowerCase()

    function openAddFaculty() {
        setEditingFaculty(null)
        setFacultyForm({ name: '', subject: '', email: '', room: '', rating: 4.5 })
        setShowFacultyModal(true)
    }
    function openEditFaculty(f) {
        setEditingFaculty(f)
        setFacultyForm({ name: f.name, subject: f.subject, email: f.email, room: f.room, rating: f.rating })
        setShowFacultyModal(true)
    }
    function saveFaculty() {
        if (!facultyForm.name || !facultyForm.subject || !facultyForm.email) return showToast('Please fill all required fields', 'warning')
        if (editingFaculty) {
            setFacultyList(prev => prev.map(f => f.id === editingFaculty.id ? { ...f, ...facultyForm } : f))
            showToast('Faculty updated successfully', 'success')
        } else {
            setFacultyList(prev => [...prev, { id: 'F' + (prev.length + 1).toString().padStart(3, '0'), ...facultyForm, dept: 'AI/ML' }])
            showToast('Faculty added successfully', 'success')
        }
        setShowFacultyModal(false)
    }
    function removeFaculty(id) {
        setFacultyList(prev => prev.filter(f => f.id !== id))
        showToast('Faculty removed', 'info')
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Faculty Management</h1>
                <div className="header-right">
                    <button className="btn-primary" onClick={openAddFaculty}>+ Add Faculty</button>
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search faculty..." aria-label="Search faculty" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="stats-row">
                <div className="dash-stat-card"><div className="dash-stat-icon blue">👨‍🏫</div><div className="dash-stat-info"><h3>{facultyList.length}</h3><p>Total Faculty</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon green">⭐</div><div className="dash-stat-info"><h3>{(facultyList.reduce((s, f) => s + f.rating, 0) / facultyList.length).toFixed(1)}</h3><p>Avg Rating</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon purple">📚</div><div className="dash-stat-info"><h3>6</h3><p>Subjects Covered</p></div></div>
                <div className="dash-stat-card"><div className="dash-stat-icon yellow">🏢</div><div className="dash-stat-info"><h3>AI/ML</h3><p>Department</p></div></div>
            </div>
            <div className="dash-card">
                <h2>All Faculty Members</h2>
                <table className="faculty-table" aria-label="All faculty members">
                    <thead>
                        <tr><th>Faculty</th><th>Subject</th><th>Email</th><th>Room</th><th>Rating</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {facultyList.filter(f => !q || f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q)).map(f => (
                            <tr key={f.id}>
                                <td><div className="faculty-name"><div className={`faculty-avatar ${f.name.includes('Dr.') ? 'd' : 'p'}`}>{f.name.includes('Dr.') ? 'D' : 'P'}</div>{f.name}</div></td>
                                <td>{f.subject}</td>
                                <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{f.email}</td>
                                <td>{f.room}</td>
                                <td><div className="rating"><StarIcon /> {f.rating}</div></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn-view" onClick={() => openEditFaculty(f)}>Edit</button>
                                        <button className="btn-view" style={{ color: 'var(--danger)' }} onClick={() => removeFaculty(f.id)}>Remove</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showFacultyModal && (
                <div className="modal-overlay" onClick={() => setShowFacultyModal(false)}>
                    <div className="modal-content" role="dialog" aria-modal="true" aria-label={editingFaculty ? 'Edit faculty' : 'Add faculty'} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</h2>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setShowFacultyModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="demo-form">
                                <div className="form-group"><label htmlFor="fac-form-name">Full Name *</label><input id="fac-form-name" value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} placeholder="Dr. / Prof." /></div>
                                <div className="form-group"><label htmlFor="fac-form-subject">Subject *</label><input id="fac-form-subject" value={facultyForm.subject} onChange={e => setFacultyForm({ ...facultyForm, subject: e.target.value })} placeholder="Machine Learning" /></div>
                                <div className="form-group"><label htmlFor="fac-form-email">Email *</label><input id="fac-form-email" value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} placeholder="email@college.edu" /></div>
                                <div className="form-group"><label htmlFor="fac-form-room">Room</label><input id="fac-form-room" value={facultyForm.room} onChange={e => setFacultyForm({ ...facultyForm, room: e.target.value })} placeholder="Room 301" /></div>
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn-secondary" onClick={() => setShowFacultyModal(false)}>Cancel</button>
                                <button className="modal-btn-primary" onClick={saveFaculty}>{editingFaculty ? 'Save Changes' : 'Add Faculty'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
