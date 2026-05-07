import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { notesAPI, smartboardAPI } from '../../services/api'
import { students as mockStudents } from '../../data/mockDatabase'
import { SkeletonCard } from '../../components/Skeleton'
import Modal from '../../components/Modal'
import FolderList from './notes/FolderList'
import NotesList from './notes/NotesList'
import CreateNoteModal from './notes/CreateNoteModal'
import SmartboardSection from './notes/SmartboardSection'
import '../Dashboard.css'

const MOCK_SMARTBOARD_NOTES = [
    { id: 'sb1', title: 'Neural Networks Intro', subject: 'Deep Learning', uploadedBy: 'Dr. Sharma', fileName: 'neural_networks.pdf', fileSize: 1240000, createdAt: '2026-04-09T09:00:00Z', fileUrl: null },
    { id: 'sb2', title: 'Backpropagation Derivation', subject: 'Machine Learning', uploadedBy: 'Dr. Sharma', fileName: 'backprop.pdf', fileSize: 890000, createdAt: '2026-04-08T11:30:00Z', fileUrl: null },
]

function NotesPage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [folders, setFolders] = useState([])
    const [recentNotes, setRecentNotes] = useState([])
    const [bookmarkedNotes, setBookmarkedNotes] = useState([])
    const [sharedNotes, setSharedNotes] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showNoteModal, setShowNoteModal] = useState(false)
    const [selectedNote, setSelectedNote] = useState(null)
    const [showEditor, setShowEditor] = useState(false)
    const [smartboardNotes, setSmartboardNotes] = useState([])
    const [showPdfModal, setShowPdfModal] = useState(false)
    const [selectedPdf, setSelectedPdf] = useState(null)
    const [editorTitle, setEditorTitle] = useState('')
    const [editorSubject, setEditorSubject] = useState('Machine Learning')
    const [createdNotes, setCreatedNotes] = useState([])

    useEffect(() => {
        loadData()
        loadSmartboardNotes()
    }, [])

    async function loadData() {
        const studentId = user.studentId
        const [foldersRes, recentRes, bookmarkedRes, sharedRes] = await Promise.allSettled([
            notesAPI.getFolders(studentId),
            notesAPI.getRecent(studentId),
            notesAPI.getBookmarked(studentId),
            notesAPI.getShared(studentId),
        ])

        const hasApiData = [foldersRes, recentRes, bookmarkedRes, sharedRes].some(r => r.status === 'fulfilled')
        if (!hasApiData) {
            const mockStudent = mockStudents[user.studentId] || mockStudents['STU001']
            const n = mockStudent.notes

            setFolders(n.folders)
            setRecentNotes(n.recent.map((note, i) => ({ id: i + 1, ...note })))
            setBookmarkedNotes(n.bookmarkedNotes.map((note, i) => ({ id: 100 + i, ...note })))
            setSharedNotes(n.shared.map((note, i) => ({ id: 200 + i, ...note })))
            setLoading(false)
            return
        }

        if (foldersRes.status === 'fulfilled') {
            setFolders((foldersRes.value.folders || []).map(f => ({
                name: f.name,
                count: f._count?.notes || f.noteCount || 0,
                updated: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
                icon: '📁',
            })))
        }

        if (recentRes.status === 'fulfilled') {
            setRecentNotes((recentRes.value.notes || []).map(n => ({
                id: n.id,
                title: n.title,
                subject: n.folder?.name || n.subject || '—',
                time: n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
                content: n.content || '',
            })))
        }

        if (bookmarkedRes.status === 'fulfilled') {
            setBookmarkedNotes((bookmarkedRes.value.notes || []).map(n => ({
                id: n.id,
                title: n.title,
                subject: n.folder?.name || n.subject || '—',
                time: n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
                content: n.content || '',
            })))
        }

        if (sharedRes.status === 'fulfilled') {
            setSharedNotes((sharedRes.value.notes || []).map(n => ({
                id: n.id,
                title: n.title,
                subject: n.folder?.name || n.subject || '—',
                sharedBy: n.sharedBy?.name || n.owner?.name || '—',
                color: '#6366F1',
                initial: (n.sharedBy?.name || n.owner?.name || 'U')[0].toUpperCase(),
                date: n.sharedAt ? new Date(n.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
                content: n.content || '',
            })))
        }

        setLoading(false)
    }

    async function loadSmartboardNotes() {
        try {
            const data = await smartboardAPI.getAll()
            setSmartboardNotes(data.notes || [])
        } catch {
            setSmartboardNotes(MOCK_SMARTBOARD_NOTES)
        }
    }

    const q = searchQuery.toLowerCase()
    const filteredFolders = folders.filter(f => !q || f.name.toLowerCase().includes(q))
    const filteredRecent = [...createdNotes, ...recentNotes].filter(note => !q || note.title.toLowerCase().includes(q) || note.subject.toLowerCase().includes(q))
    const filteredBookmarked = bookmarkedNotes.filter(note => !q || note.title.toLowerCase().includes(q) || note.subject.toLowerCase().includes(q))
    const filteredShared = sharedNotes.filter(note => !q || note.title.toLowerCase().includes(q) || note.subject.toLowerCase().includes(q))

    const totalNotes = recentNotes.length + createdNotes.length
    const bookmarkedCount = bookmarkedNotes.length

    function viewNote(note) {
        setSelectedNote(note)
        setShowNoteModal(true)
    }

    function viewPdf(note) {
        setSelectedPdf(note)
        setShowPdfModal(true)
    }

    function saveNote(content) {
        if (!editorTitle.trim()) return showToast('Title is required', 'warning')
        if (!content.trim() || content === '<br>') return showToast('Content cannot be empty', 'warning')
        setCreatedNotes(prev => [{
            title: editorTitle,
            subject: editorSubject,
            time: 'Just now',
            customContent: content,
        }, ...prev])
        setShowEditor(false)
        setEditorTitle('')
        showToast('Note saved successfully!', 'success')
    }

    if (loading) {
        return (
            <>
                <div className="dashboard-header"><h1>Notes</h1></div>
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
                <h1>Notes</h1>
                <div className="header-right">
                    <button className="btn-primary" onClick={() => setShowEditor(true)}>+ Create Note</button>
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📝</div>
                    <div className="dash-stat-info">
                        <h3>{totalNotes}</h3>
                        <p>Total Notes</p>
                        <div className="trend up">All subjects</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">📚</div>
                    <div className="dash-stat-info">
                        <h3>{folders.length}</h3>
                        <p>Subjects</p>
                        <div className="trend up">All covered</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">⭐</div>
                    <div className="dash-stat-info">
                        <h3>{bookmarkedCount}</h3>
                        <p>Bookmarked</p>
                        <div className="trend up">Quick access</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🤝</div>
                    <div className="dash-stat-info">
                        <h3>{sharedNotes.length}</h3>
                        <p>Shared with You</p>
                        <div className="trend up">From peers</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">🖥️</div>
                    <div className="dash-stat-info">
                        <h3>{smartboardNotes.length}</h3>
                        <p>Smartboard PDFs</p>
                        <div className="trend up">Faculty notes</div>
                    </div>
                </div>
            </div>

            <FolderList folders={filteredFolders} />

            <NotesList
                recent={filteredRecent}
                bookmarked={filteredBookmarked}
                shared={filteredShared}
                onView={viewNote}
            />

            <SmartboardSection notes={smartboardNotes} onView={viewPdf} />

            {/* PDF Viewer Modal */}
            <Modal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} title={selectedPdf?.title || 'Smartboard Note'}>
                {selectedPdf && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Subject</span>
                            <span className="detail-value">{selectedPdf.subject}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Uploaded by</span>
                            <span className="detail-value">{selectedPdf.uploadedBy}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date</span>
                            <span className="detail-value">{new Date(selectedPdf.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {selectedPdf.fileUrl ? (
                            <div style={{ marginTop: 16 }}>
                                <iframe
                                    src={selectedPdf.fileUrl}
                                    title={selectedPdf.title}
                                    style={{ width: '100%', height: 480, border: '1px solid var(--gray-200)', borderRadius: 8 }}
                                />
                                <a href={selectedPdf.fileUrl} download={selectedPdf.fileName} className="btn-primary" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
                                    Download PDF
                                </a>
                            </div>
                        ) : (
                            <div style={{ marginTop: 16, padding: 32, background: 'var(--gray-50)', borderRadius: 8, textAlign: 'center' }}>
                                <p style={{ fontSize: 40, marginBottom: 8 }}>📄</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selectedPdf.fileName}</p>
                                <p style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 4 }}>PDF preview available when backend is running.</p>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title={selectedNote?.title || 'Note'}>
                {selectedNote && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Subject</span>
                            <span className="detail-value">{selectedNote.subject}</span>
                        </div>
                        {selectedNote.time && (
                            <div className="detail-row">
                                <span className="detail-label">Last Modified</span>
                                <span className="detail-value">{selectedNote.time}</span>
                            </div>
                        )}
                        {selectedNote.sharedBy && (
                            <div className="detail-row">
                                <span className="detail-label">Shared By</span>
                                <span className="detail-value">{selectedNote.sharedBy}</span>
                            </div>
                        )}
                        <div style={{ marginTop: 16, padding: 20, background: 'var(--gray-50)', borderRadius: 8, lineHeight: 1.8 }}>
                            {selectedNote.customContent ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedNote.customContent }} style={{ fontSize: 13, color: 'var(--gray-600)' }} />
                            ) : selectedNote.content ? (
                                <p style={{ fontSize: 13, color: 'var(--gray-600)', whiteSpace: 'pre-wrap' }}>{selectedNote.content}</p>
                            ) : (
                                <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center' }}>No content available</p>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            <CreateNoteModal
                open={showEditor}
                onClose={() => setShowEditor(false)}
                title={editorTitle}
                setTitle={setEditorTitle}
                subject={editorSubject}
                setSubject={setEditorSubject}
                onSave={saveNote}
            />
        </>
    )
}

export default NotesPage
