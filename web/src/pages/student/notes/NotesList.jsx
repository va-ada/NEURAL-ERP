// Renders the three side-by-side note buckets (Recent, Bookmarked, Shared).
// Kept together because they share styles, the same `viewNote` callback,
// and they always sit in the same dashboard-grid row.

export default function NotesList({ recent, bookmarked, shared, onView }) {
    return (
        <div className="dashboard-grid">
            <div className="dash-card">
                <h2>Recent Notes</h2>
                {recent.length > 0 ? recent.map((note, i) => (
                    <div className="note-item" key={i}>
                        <div className="note-icon">📄</div>
                        <div className="note-info">
                            <h4>{note.title}</h4>
                            <div className="note-meta">
                                <span className="subject-tag">{note.subject}</span>
                                <span className="note-time">{note.time}</span>
                            </div>
                        </div>
                        <button className="btn-view" onClick={() => onView(note)}>View</button>
                    </div>
                )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No recent notes</p>}
            </div>

            <div className="dash-card">
                <h2>Bookmarked Notes</h2>
                {bookmarked.length > 0 ? bookmarked.map((note, i) => (
                    <div className="note-item" key={i}>
                        <div className="note-icon bookmarked">⭐</div>
                        <div className="note-info">
                            <h4>{note.title}</h4>
                            <div className="note-meta">
                                <span className="subject-tag">{note.subject}</span>
                                <span className="note-time">{note.time}</span>
                            </div>
                        </div>
                        <button className="btn-view" onClick={() => onView(note)}>View</button>
                    </div>
                )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No bookmarked notes</p>}
            </div>

            <div className="dash-card full-width">
                <h2>Shared Notes</h2>
                {shared.length > 0 ? shared.map((note, i) => (
                    <div className="note-item" key={i}>
                        <div className="note-icon">📄</div>
                        <div className="note-info">
                            <h4>{note.title}</h4>
                            <div className="note-meta">
                                <span className="subject-tag">{note.subject}</span>
                                <div className="shared-by">
                                    <div className="shared-avatar" style={{ background: note.color }}>{note.initial}</div>
                                    <span>{note.sharedBy}</span>
                                </div>
                                <span className="note-time">{note.date}</span>
                            </div>
                        </div>
                        <button className="btn-view" onClick={() => onView(note)}>View</button>
                    </div>
                )) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 20 }}>No shared notes</p>}
            </div>
        </div>
    )
}
