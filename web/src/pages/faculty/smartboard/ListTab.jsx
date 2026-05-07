import { formatBytes } from './constants'

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ListTab({ notes, loading }) {
    return (
        <div className="dash-card">
            <h2 style={{ marginBottom: 16 }}>Saved Sessions ({notes.length})</h2>
            {loading ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Loading...</p>
            ) : notes.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>No smartboard notes saved yet. Scan a QR or upload a PDF above.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {notes.map(note => (
                        <div key={note.id} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 16px', border: '1px solid var(--gray-200)',
                            borderRadius: 8, background: 'var(--gray-50)',
                        }}>
                            <div style={{ fontSize: 28, flexShrink: 0 }}>📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <span className="subject-tag" style={{ marginRight: 8 }}>{note.subject}</span>
                                    {note.fileName} · {formatBytes(note.fileSize)} · {formatDate(note.createdAt)}
                                </p>
                            </div>
                            {note.fileUrl && (
                                <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ padding: '6px 14px', background: '#2563EB', color: '#fff', borderRadius: 6, fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>
                                    View PDF
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
