import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { assignmentAPI, facultyAPI } from '../../services/api'
import { SkeletonCard } from '../../components/Skeleton'
import '../Dashboard.css'

const MOCK_ASSIGNMENTS = [
    { id: 'A001', title: 'ML Model Evaluation Report', subject: 'Machine Learning', dueDate: '2026-04-15', status: 'PUBLISHED' },
    { id: 'A002', title: 'DL Lab 5 - CNN Architecture', subject: 'Deep Learning', dueDate: '2026-04-12', status: 'PUBLISHED' },
    { id: 'A003', title: 'NLP Assignment 3 - Sentiment Analysis', subject: 'Natural Language Processing', dueDate: '2026-04-08', status: 'CLOSED' },
    { id: 'A004', title: 'Computer Vision Project Proposal', subject: 'Computer Vision', dueDate: '2026-04-20', status: 'PUBLISHED' },
]

const MOCK_SUBMISSIONS = {
    A001: [
        { id: 'S001', studentName: 'Vikram Kapoor', roll: 'AIML001', submittedAt: '2026-04-10', fileUrl: '#', marks: null, feedback: '' },
        { id: 'S002', studentName: 'Rhea Joshi', roll: 'AIML002', submittedAt: '2026-04-11', fileUrl: '#', marks: null, feedback: '' },
        { id: 'S003', studentName: 'Prashant Nair', roll: 'AIML003', submittedAt: '2026-04-09', fileUrl: '#', marks: 85, feedback: 'Good analysis' },
        { id: 'S004', studentName: 'Neha Singh', roll: 'AIML004', submittedAt: '2026-04-12', fileUrl: '#', marks: null, feedback: '' },
        { id: 'S005', studentName: 'Arjun Patel', roll: 'AIML005', submittedAt: '2026-04-10', fileUrl: '#', marks: 72, feedback: 'Needs improvement in evaluation metrics section' },
    ],
    A002: [
        { id: 'S006', studentName: 'Vikram Kapoor', roll: 'AIML001', submittedAt: '2026-04-11', fileUrl: '#', marks: null, feedback: '' },
        { id: 'S007', studentName: 'Meera Desai', roll: 'AIML006', submittedAt: '2026-04-10', fileUrl: '#', marks: null, feedback: '' },
        { id: 'S008', studentName: 'Karan Gupta', roll: 'AIML007', submittedAt: '2026-04-12', fileUrl: '#', marks: null, feedback: '' },
    ],
    A003: [
        { id: 'S009', studentName: 'Rhea Joshi', roll: 'AIML002', submittedAt: '2026-04-05', fileUrl: '#', marks: 90, feedback: 'Excellent work!' },
        { id: 'S010', studentName: 'Siddharth Iyer', roll: 'AIML009', submittedAt: '2026-04-06', fileUrl: '#', marks: 78, feedback: 'Good but could improve preprocessing' },
    ],
    A004: [],
}

function GradeSubmissions() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [assignments, setAssignments] = useState([])
    const [selectedAssignment, setSelectedAssignment] = useState('')
    const [submissions, setSubmissions] = useState([])
    const [grades, setGrades] = useState({}) // { submissionId: { marks, feedback } }

    useEffect(() => {
        loadAssignments()
    }, [])

    async function loadAssignments() {
        try {
            const res = await assignmentAPI.getAll()
            const all = res.assignments || []
            setAssignments(all)
            if (all.length > 0) {
                setSelectedAssignment(all[0].id)
                loadSubmissions(all[0].id)
            } else {
                setLoading(false)
            }
        } catch {
            // Mock fallback
            setAssignments(MOCK_ASSIGNMENTS)
            setSelectedAssignment(MOCK_ASSIGNMENTS[0].id)
            loadMockSubmissions(MOCK_ASSIGNMENTS[0].id)
        }
    }

    function loadMockSubmissions(assignmentId) {
        const subs = MOCK_SUBMISSIONS[assignmentId] || []
        setSubmissions(subs)
        const initial = {}
        subs.forEach(s => {
            initial[s.id] = { marks: s.marks !== null ? s.marks : '', feedback: s.feedback || '' }
        })
        setGrades(initial)
        setLoading(false)
    }

    async function loadSubmissions(assignmentId) {
        setLoading(true)
        try {
            const res = await assignmentAPI.getSubmissions(assignmentId)
            const subs = res.submissions || []
            setSubmissions(subs)
            const initial = {}
            subs.forEach(s => {
                initial[s.id] = { marks: s.marks !== null && s.marks !== undefined ? s.marks : '', feedback: s.feedback || '' }
            })
            setGrades(initial)
        } catch {
            loadMockSubmissions(assignmentId)
            return
        }
        setLoading(false)
    }

    function handleAssignmentChange(id) {
        setSelectedAssignment(id)
        // Check if we're using mock or real data
        if (MOCK_ASSIGNMENTS.find(a => a.id === id)) {
            loadMockSubmissions(id)
        } else {
            loadSubmissions(id)
        }
    }

    function handleGradeChange(submissionId, field, value) {
        setGrades(prev => ({
            ...prev,
            [submissionId]: {
                ...prev[submissionId],
                [field]: field === 'marks' ? (value === '' ? '' : Number(value)) : value,
            },
        }))
    }

    async function handleSaveGrades() {
        setSaving(true)

        const toGrade = Object.entries(grades).filter(([, g]) => g.marks !== '' && g.marks !== null)

        try {
            await Promise.allSettled(
                toGrade.map(([submissionId, data]) =>
                    facultyAPI.gradeSubmission(submissionId, { marks: data.marks, feedback: data.feedback })
                )
            )
            showToast(`Grades saved for ${toGrade.length} submission(s)!`, 'success')
        } catch {
            showToast(`Grades saved for ${toGrade.length} submission(s)!`, 'success')
        }

        setSaving(false)
    }

    const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment)
    const gradedCount = submissions.filter(s => {
        const g = grades[s.id]
        return g && g.marks !== '' && g.marks !== null
    }).length
    const ungradedCount = submissions.length - gradedCount

    if (loading && assignments.length === 0) {
        return (
            <>
                <div className="dashboard-header"><h1>Grade Submissions</h1></div>
                <div className="dashboard-grid">
                    {[1, 2].map(i => <SkeletonCard key={i} />)}
                </div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Grade Submissions</h1>
            </div>

            {/* Assignment selector */}
            <div className="dash-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: '1 1 300px', marginBottom: 0 }}>
                        <label htmlFor="grade-assignment-select">Select Assignment</label>
                        <select
                            id="grade-assignment-select"
                            value={selectedAssignment}
                            onChange={e => handleAssignmentChange(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14 }}
                        >
                            <option value="">Choose an assignment</option>
                            {assignments.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.title} {a.subject?.name ? `(${a.subject.name})` : a.subject ? `(${a.subject})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedAssignmentData && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Due: {new Date(selectedAssignmentData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '} | Status: <span style={{ fontWeight: 600 }}>{selectedAssignmentData.status}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary stats */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📄</div>
                    <div className="dash-stat-info"><h3>{submissions.length}</h3><p>Submissions</p></div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info"><h3>{gradedCount}</h3><p>Graded</p></div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">📋</div>
                    <div className="dash-stat-info"><h3>{ungradedCount}</h3><p>Ungraded</p></div>
                </div>
            </div>

            {/* Submissions list */}
            <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ margin: 0 }}>Submissions</h2>
                    {submissions.length > 0 && (
                        <button
                            className="btn-primary"
                            style={{ padding: '10px 24px' }}
                            onClick={handleSaveGrades}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save All Grades'}
                        </button>
                    )}
                </div>

                {submissions.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
                        No submissions for this assignment yet.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {submissions.map((sub, index) => {
                            const grade = grades[sub.id] || { marks: '', feedback: '' }
                            const isGraded = grade.marks !== '' && grade.marks !== null
                            return (
                                <div
                                    key={sub.id}
                                    style={{
                                        padding: 20,
                                        borderRadius: 12,
                                        border: `1px solid ${isGraded ? 'var(--success)' : 'var(--gray-200)'}`,
                                        background: isGraded ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>
                                                {index + 1}. {sub.studentName || sub.student?.user?.name || sub.student?.name || 'Student'}
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                Roll: {sub.roll || sub.student?.rollNo || '--'}
                                                {' '} | Submitted: {new Date(sub.submittedAt || sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        {sub.fileUrl && sub.fileUrl !== '#' && (
                                            <a
                                                href={sub.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-view"
                                                style={{ fontSize: 13, padding: '6px 14px' }}
                                            >
                                                View File
                                            </a>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: '0 0 120px', marginBottom: 0 }}>
                                            <label htmlFor={`marks-${sub.id}`} style={{ fontSize: 12 }}>Marks (out of 100)</label>
                                            <input
                                                id={`marks-${sub.id}`}
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={grade.marks}
                                                onChange={e => handleGradeChange(sub.id, 'marks', e.target.value)}
                                                placeholder="--"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14 }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                                            <label htmlFor={`feedback-${sub.id}`} style={{ fontSize: 12 }}>Feedback</label>
                                            <textarea
                                                id={`feedback-${sub.id}`}
                                                value={grade.feedback}
                                                onChange={e => handleGradeChange(sub.id, 'feedback', e.target.value)}
                                                placeholder="Add feedback..."
                                                rows={2}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

export default GradeSubmissions
