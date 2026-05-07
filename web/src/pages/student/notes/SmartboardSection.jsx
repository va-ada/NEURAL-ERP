// Faculty-uploaded smartboard PDFs that students can view alongside their own notes.
// Named "BookmarkedTab" in the original spec but actually surfaces smartboard PDFs —
// the student-facing equivalent of the faculty list.

const formatBytes = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SmartboardSection({ notes, onView }) {
    if (notes.length === 0) return null
    return (
        <div className="dash-card full-width" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Smartboard Notes</h2>
                <span style={{ fontSize: 12, background: '#2563EB', color: '#fff', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>Faculty Uploaded · PDF</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map(note => (
                    <div key={note.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--gray-200)', borderRadius: 8, background: 'var(--gray-50)' }}>
                        <div style={{ fontSize: 26, flexShrink: 0 }}>📄</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{note.title}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                <span className="subject-tag" style={{ marginRight: 8 }}>{note.subject}</span>
                                Uploaded by {note.uploadedBy} · {formatBytes(note.fileSize)} · {new Date(note.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button className="btn-view" onClick={() => onView(note)}>View PDF</button>
                            {note.fileUrl && (
                                <a href={note.fileUrl} download={note.fileName} style={{ padding: '5px 12px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--white)' }}>
                                    Download
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
