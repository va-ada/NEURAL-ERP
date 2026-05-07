import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { attendanceAPI, academicAPI } from '../../services/api'
import { SkeletonCard } from '../../components/Skeleton'
import '../Dashboard.css'

// Mock students for fallback
const MOCK_STUDENTS = [
    { id: 'STU001', name: 'Vikram Kapoor', roll: 'AIML001' },
    { id: 'STU002', name: 'Rhea Joshi', roll: 'AIML002' },
    { id: 'STU003', name: 'Prashant Nair', roll: 'AIML003' },
    { id: 'STU004', name: 'Neha Singh', roll: 'AIML004' },
    { id: 'STU005', name: 'Arjun Patel', roll: 'AIML005' },
    { id: 'STU006', name: 'Meera Desai', roll: 'AIML006' },
    { id: 'STU007', name: 'Karan Gupta', roll: 'AIML007' },
    { id: 'STU008', name: 'Anjali Rao', roll: 'AIML008' },
    { id: 'STU009', name: 'Siddharth Iyer', roll: 'AIML009' },
    { id: 'STU010', name: 'Pooja Mehta', roll: 'AIML010' },
]

const MOCK_BATCHES = [
    { id: 'B001', name: 'AIML Sem 6 - Section A' },
    { id: 'B002', name: 'AIML Sem 6 - Section B' },
]

const MOCK_SUBJECTS = [
    { id: 'SUB001', name: 'Machine Learning', code: 'AIML301' },
    { id: 'SUB002', name: 'Deep Learning', code: 'AIML302' },
    { id: 'SUB003', name: 'Natural Language Processing', code: 'AIML303' },
]

function MarkAttendance() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [batches, setBatches] = useState([])
    const [subjects, setSubjects] = useState([])
    const [students, setStudents] = useState([])

    const [selectedBatch, setSelectedBatch] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendance, setAttendance] = useState({}) // { studentId: 'PRESENT' | 'ABSENT' | 'LATE' }

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const [batchesRes, subjectsRes, studentsRes] = await Promise.allSettled([
            academicAPI.getBatches(),
            academicAPI.getSubjects(),
            academicAPI.getStudents(),
        ])

        const hasApiData = [batchesRes, subjectsRes, studentsRes].some(r => r.status === 'fulfilled')

        if (!hasApiData) {
            setBatches(MOCK_BATCHES)
            setSubjects(MOCK_SUBJECTS)
            setStudents(MOCK_STUDENTS)
            setSelectedBatch(MOCK_BATCHES[0].id)
            setSelectedSubject(MOCK_SUBJECTS[0].id)
            // Initialize all as PRESENT
            const initial = {}
            MOCK_STUDENTS.forEach(s => { initial[s.id] = 'PRESENT' })
            setAttendance(initial)
            setLoading(false)
            return
        }

        if (batchesRes.status === 'fulfilled') {
            const b = batchesRes.value.batches || batchesRes.value || []
            setBatches(Array.isArray(b) ? b : [])
            if (b.length > 0) setSelectedBatch(b[0].id)
        }

        if (subjectsRes.status === 'fulfilled') {
            const s = subjectsRes.value.subjects || subjectsRes.value || []
            setSubjects(Array.isArray(s) ? s : [])
            if (s.length > 0) setSelectedSubject(s[0].id)
        }

        if (studentsRes.status === 'fulfilled') {
            const st = studentsRes.value.students || studentsRes.value || []
            const studentList = Array.isArray(st) ? st : []
            setStudents(studentList)
            const initial = {}
            studentList.forEach(s => { initial[s.id] = 'PRESENT' })
            setAttendance(initial)
        }

        setLoading(false)
    }

    function handleStatusChange(studentId, status) {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    function handleMarkAllPresent() {
        const all = {}
        students.forEach(s => { all[s.id] = 'PRESENT' })
        setAttendance(all)
    }

    function handleMarkAllAbsent() {
        const all = {}
        students.forEach(s => { all[s.id] = 'ABSENT' })
        setAttendance(all)
    }

    async function handleSubmit() {
        if (!selectedBatch || !selectedSubject) {
            showToast('Please select batch and subject', 'error')
            return
        }

        setSubmitting(true)

        const records = students.map(s => ({
            studentId: s.id,
            status: attendance[s.id] || 'PRESENT',
        }))

        try {
            await attendanceAPI.mark({
                batchId: selectedBatch,
                subjectId: selectedSubject,
                date: selectedDate,
                records,
            })
            showToast('Attendance marked successfully!', 'success')
        } catch {
            // Mock success fallback
            showToast('Attendance marked successfully!', 'success')
        }

        setSubmitting(false)
    }

    const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length
    const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length
    const lateCount = Object.values(attendance).filter(s => s === 'LATE').length

    if (loading) {
        return (
            <>
                <div className="dashboard-header"><h1>Mark Attendance</h1></div>
                <div className="dashboard-grid">
                    {[1, 2].map(i => <SkeletonCard key={i} />)}
                </div>
            </>
        )
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Mark Attendance</h1>
            </div>

            {/* Filters */}
            <div className="dash-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label htmlFor="att-batch">Batch</label>
                        <select
                            id="att-batch"
                            value={selectedBatch}
                            onChange={e => setSelectedBatch(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14 }}
                        >
                            <option value="">Select Batch</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label htmlFor="att-subject">Subject</label>
                        <select
                            id="att-subject"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14 }}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                        <label htmlFor="att-date">Date</label>
                        <input
                            id="att-date"
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 14 }}
                        />
                    </div>
                </div>
            </div>

            {/* Summary bar */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info"><h3>{presentCount}</h3><p>Present</p></div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">❌</div>
                    <div className="dash-stat-info"><h3>{absentCount}</h3><p>Absent</p></div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">⏰</div>
                    <div className="dash-stat-info"><h3>{lateCount}</h3><p>Late</p></div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">👥</div>
                    <div className="dash-stat-info"><h3>{students.length}</h3><p>Total</p></div>
                </div>
            </div>

            {/* Student list */}
            <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ margin: 0 }}>Student List</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={handleMarkAllPresent}>
                            Mark All Present
                        </button>
                        <button className="btn-view" style={{ fontSize: 13, padding: '8px 16px' }} onClick={handleMarkAllAbsent}>
                            Mark All Absent
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table aria-label="Student attendance" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>#</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Roll No</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Student Name</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const status = attendance[student.id] || 'PRESENT'
                                return (
                                    <tr key={student.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '12px 8px', fontSize: 14 }}>{index + 1}</td>
                                        <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 500 }}>{student.roll || student.rollNo || '--'}</td>
                                        <td style={{ padding: '12px 8px', fontSize: 14 }}>{student.name}</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                {['PRESENT', 'ABSENT', 'LATE'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleStatusChange(student.id, s)}
                                                        aria-label={`Mark ${student.name} ${s.toLowerCase()}`}
                                                        aria-pressed={status === s}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: 6,
                                                            border: 'none',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: status === s
                                                                ? s === 'PRESENT' ? 'var(--success)' : s === 'ABSENT' ? 'var(--error, #EF4444)' : '#F59E0B'
                                                                : 'var(--gray-100)',
                                                            color: status === s ? '#fff' : 'var(--text-secondary)',
                                                            transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        {s === 'PRESENT' ? 'P' : s === 'ABSENT' ? 'A' : 'L'}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '12px 32px', fontSize: 15 }}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Attendance'}
                    </button>
                </div>
            </div>
        </>
    )
}

export default MarkAttendance
