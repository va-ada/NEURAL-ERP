import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { assignmentAPI } from '../../services/api'
import { students as mockStudents } from '../../data/mockDatabase'
import { SkeletonCard } from '../../components/Skeleton'
import Modal from '../../components/Modal'
import '../Dashboard.css'

const filters = [
    { label: 'All', key: 'all' },
    { label: 'Pending', key: 'pending' },
    { label: 'Completed', key: 'completed' },
    { label: 'Overdue', key: 'overdue' },
]

function getCategory(a) {
    if (a.status === 'CLOSED') return 'completed'
    if (a.status === 'DRAFT') return 'pending'
    // PUBLISHED
    const now = new Date()
    const due = a.dueDate ? new Date(a.dueDate) : null
    if (due && due < now) return 'overdue'
    return 'pending'
}

function formatDue(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AssignmentsPage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [submittedIds, setSubmittedIds] = useState(new Set())
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [viewedAssignment, setViewedAssignment] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const params = user.batchId ? `batchId=${user.batchId}` : ''
            const res = await assignmentAPI.getAll(params)
            const raw = res.assignments || []
            if (raw.length > 0) {
                setAssignments(raw.map(a => ({
                    id: a.id,
                    title: a.title,
                    subject: a.subject?.name || '—',
                    due: formatDue(a.dueDate),
                    dueRaw: a.dueDate,
                    category: getCategory(a),
                    status: a.status,
                    statusLabel: a.status === 'CLOSED' ? 'Completed' : (new Date(a.dueDate) < new Date() ? 'Overdue' : 'Pending'),
                    icon: a.status === 'CLOSED' ? '✅' : '📝',
                    iconClass: a.status === 'CLOSED' ? 'green' : 'blue',
                })))
                setLoading(false)
                return
            }
        } catch {
            // API failed, fall through to mock data
        }

        // Fallback to mock data
        const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
        setAssignments(mockStudent.assignments)
        setLoading(false)
    }

    const q = searchQuery.toLowerCase()
    const filtered = (activeFilter === 'all'
        ? assignments
        : assignments.filter(a => a.category === activeFilter)
    ).filter(a => !q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q))

    function handleSubmit(a) {
        setSelectedAssignment(a)
        setSubmitSuccess(false)
        setUploadedFile(null)
        setUploadProgress(0)
        setShowSubmitModal(true)
    }

    function handleFileDrop(e) {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast('File size must be under 10MB', 'error')
                return
            }
            setUploadedFile(file)
            let progress = 0
            const interval = setInterval(() => {
                progress += 15
                setUploadProgress(Math.min(progress, 100))
                if (progress >= 100) clearInterval(interval)
            }, 150)
        }
    }

    function confirmSubmit() {
        setSubmittedIds(prev => new Set([...prev, selectedAssignment.id]))
        setSubmitSuccess(true)
        showToast('Assignment submitted successfully!', 'success')
        setTimeout(() => setShowSubmitModal(false), 1500)
    }

    const counts = {
        all: assignments.length,
        pending: assignments.filter(a => a.category === 'pending').length,
        completed: assignments.filter(a => a.category === 'completed').length,
        overdue: assignments.filter(a => a.category === 'overdue').length,
    }

    if (loading) {
        return (
            <>
                <div className="dashboard-header"><h1>Assignments</h1></div>
                <div className="stats-row">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="dash-stat-card" style={{ opacity: 0.5 }}>
                            <div className="dash-stat-icon blue">⏳</div>
                            <div className="dash-stat-info"><h3>—</h3><p>Loading...</p></div>
                        </div>
                    ))}
                </div>
                <div className="dashboard-grid">{[1, 2].map(i => <SkeletonCard key={i} />)}</div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Assignments</h1>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search assignments..." aria-label="Search assignments" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📋</div>
                    <div className="dash-stat-info">
                        <h3>{counts.all}</h3>
                        <p>Total Assignments</p>
                        <div className="trend up">This semester</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info">
                        <h3>{counts.completed}</h3>
                        <p>Completed</p>
                        <div className="trend up">{counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0}% completion</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">⏳</div>
                    <div className="dash-stat-info">
                        <h3>{counts.pending}</h3>
                        <p>Pending</p>
                        <div className="trend down">Due soon</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">🚨</div>
                    <div className="dash-stat-info">
                        <h3>{counts.overdue}</h3>
                        <p>Overdue</p>
                        <div className="trend down">{counts.overdue > 0 ? 'Submit ASAP' : 'All clear'}</div>
                    </div>
                </div>
            </div>

            <div className="filter-tabs" role="tablist" aria-label="Assignment filters">
                {filters.map(f => (
                    <button
                        key={f.key}
                        role="tab"
                        aria-selected={activeFilter === f.key}
                        className={`filter-tab${activeFilter === f.key ? ' active' : ''}`}
                        onClick={() => setActiveFilter(f.key)}
                    >
                        {f.label}<span className="count">({counts[f.key]})</span>
                    </button>
                ))}
            </div>

            <div className="dash-card">
                <h2>
                    {activeFilter === 'all' ? 'All' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Assignments
                </h2>
                {filtered.length > 0 ? filtered.map(a => (
                    <div className="assignment-card" key={a.id}>
                        <div className={`assignment-icon ${a.iconClass}`}>{a.icon}</div>
                        <div className="assignment-info">
                            <h4>{a.title}</h4>
                            <p>{a.subject} • Due: {a.due}</p>
                        </div>
                        <div className="assignment-meta">
                            <span className={`assignment-badge ${submittedIds.has(a.id) ? 'done' : a.category}`}>
                                {submittedIds.has(a.id) ? 'Submitted' : a.statusLabel}
                            </span>
                            {a.category === 'completed' || submittedIds.has(a.id) ? (
                                <button className="btn-view" onClick={() => { setViewedAssignment(a); setShowViewModal(true) }}>View Submission</button>
                            ) : (
                                <button className="btn-submit" onClick={() => handleSubmit(a)}>Submit</button>
                            )}
                        </div>
                    </div>
                )) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No assignments found</p>
                )}
            </div>

            <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Assignment">
                {submitSuccess ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <h3>Submitted Successfully!</h3>
                        <p>Your assignment has been submitted.</p>
                    </div>
                ) : selectedAssignment && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Assignment</span>
                            <span className="detail-value">{selectedAssignment.title}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Subject</span>
                            <span className="detail-value">{selectedAssignment.subject}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Due Date</span>
                            <span className="detail-value">{selectedAssignment.due}</span>
                        </div>

                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleFileDrop}
                            style={{
                                marginTop: 16, padding: 24, border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--gray-300)'}`,
                                borderRadius: 'var(--radius-md)', textAlign: 'center',
                                background: isDragging ? 'rgba(45,91,255,0.05)' : 'var(--gray-50)',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input id="file-input" type="file" aria-label="Choose assignment file" style={{ display: 'none' }} onChange={handleFileDrop} accept=".pdf,.doc,.docx,.zip,.py,.ipynb" />
                            {uploadedFile ? (
                                <div>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                                    <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{uploadedFile.name}</p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                                    {uploadProgress < 100 ? (
                                        <div style={{ marginTop: 8, height: 6, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: '100%', borderRadius: 3, background: 'var(--primary)', transition: 'width 0.15s' }} />
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>✅ Ready</span>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                                    <p style={{ fontWeight: 600, color: 'var(--gray-700)' }}>Drop your file here or click to browse</p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>PDF, DOC, ZIP, PY, IPYNB (Max 10MB)</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="modal-btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                            <button className="modal-btn-primary" onClick={confirmSubmit} disabled={!uploadedFile || uploadProgress < 100} style={{ opacity: (!uploadedFile || uploadProgress < 100) ? 0.5 : 1 }}>Confirm Submit</button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Submission Details">
                {viewedAssignment && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Assignment</span>
                            <span className="detail-value">{viewedAssignment.title}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Subject</span>
                            <span className="detail-value">{viewedAssignment.subject}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Due Date</span>
                            <span className="detail-value">{viewedAssignment.due}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Submitted On</span>
                            <span className="detail-value">{submittedIds.has(viewedAssignment.id) ? 'Just now' : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className="detail-value" style={{ color: '#22C55E', fontWeight: 700 }}>✅ Submitted Successfully</span>
                        </div>
                        <div style={{ marginTop: 16, padding: 16, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                            <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Your assignment was submitted on time and is currently being reviewed by the faculty.</p>
                        </div>
                    </>
                )}
            </Modal>
        </>
    )
}

export default AssignmentsPage
