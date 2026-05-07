import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const resources = [
    { id: 1, title: 'Deep Learning by Ian Goodfellow', author: 'Goodfellow, Bengio, Courville', type: 'PDF', subject: 'DL', pages: 800, bookmarked: false },
    { id: 2, title: 'Machine Learning — Andrew Ng (Stanford)', author: 'Andrew Ng', type: 'Video', subject: 'ML', duration: '40 hrs', bookmarked: true },
    { id: 3, title: 'Speech & Language Processing', author: 'Jurafsky & Martin', type: 'PDF', subject: 'NLP', pages: 650, bookmarked: false },
    { id: 4, title: 'CS231n: Convolutional Neural Networks', author: 'Stanford / Fei-Fei Li', type: 'Video', subject: 'CV', duration: '25 hrs', bookmarked: true },
    { id: 5, title: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson et al.', type: 'PDF', subject: 'DSA', pages: 1312, bookmarked: false },
    { id: 6, title: 'Probability & Statistics for Engineers', author: 'Walpole, Myers, Myers', type: 'PDF', subject: 'P&S', pages: 816, bookmarked: false },
    { id: 7, title: 'Pattern Recognition & ML', author: 'Christopher Bishop', type: 'PDF', subject: 'ML', pages: 738, bookmarked: true },
    { id: 8, title: 'Transformers Explained — 3Blue1Brown', author: '3Blue1Brown', type: 'Video', subject: 'NLP', duration: '2 hrs', bookmarked: false },
    { id: 9, title: 'Attention Is All You Need (Paper)', author: 'Vaswani et al.', type: 'Link', subject: 'NLP', bookmarked: true },
    { id: 10, title: 'GANs in Action', author: 'Langr & Bok', type: 'PDF', subject: 'DL', pages: 320, bookmarked: false },
    { id: 11, title: 'YOLO Object Detection Tutorial', author: 'Joseph Redmon', type: 'Link', subject: 'CV', bookmarked: false },
    { id: 12, title: 'Statistics 110 — Harvard', author: 'Joe Blitzstein', type: 'Video', subject: 'P&S', duration: '30 hrs', bookmarked: false },
]

const subjects = ['All', 'ML', 'DL', 'NLP', 'CV', 'DSA', 'P&S']
const types = ['All', 'PDF', 'Video', 'Link']

const typeIcons = { PDF: '📄', Video: '🎬', Link: '🔗' }
const subjectColors = { ML: '#2D5BFF', DL: '#8B5CF6', NLP: '#22C55E', CV: '#F59E0B', DSA: '#EF4444', 'P&S': '#EC4899' }

function LibraryPage() {
    const { showToast } = useToast()
    const [search, setSearch] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('All')
    const [typeFilter, setTypeFilter] = useState('All')
    const [bookmarks, setBookmarks] = useState(() => {
        const m = {}
        resources.forEach(r => m[r.id] = r.bookmarked)
        return m
    })

    function toggleBookmark(id) {
        setBookmarks(prev => {
            const next = { ...prev, [id]: !prev[id] }
            showToast(next[id] ? 'Bookmarked!' : 'Removed bookmark', next[id] ? 'success' : 'info')
            return next
        })
    }

    const filtered = resources.filter(r => {
        if (subjectFilter !== 'All' && r.subject !== subjectFilter) return false
        if (typeFilter !== 'All' && r.type !== typeFilter) return false
        if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.author.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <div>
            <div className="dashboard-header">
                <h1>Library & Resources</h1>
                <div className="header-right">
                    <div className="search-box">
                        <span aria-hidden="true">🔍</span>
                        <input aria-label="Search library resources" placeholder="Search books, videos..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">📚</div>
                    <div className="dash-stat-info">
                        <h3>{resources.length}</h3>
                        <p>Total Resources</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">📄</div>
                    <div className="dash-stat-info">
                        <h3>{resources.filter(r => r.type === 'PDF').length}</h3>
                        <p>E-Books / PDFs</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">🎬</div>
                    <div className="dash-stat-info">
                        <h3>{resources.filter(r => r.type === 'Video').length}</h3>
                        <p>Video Courses</p>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon yellow">🔖</div>
                    <div className="dash-stat-info">
                        <h3>{Object.values(bookmarks).filter(Boolean).length}</h3>
                        <p>Bookmarked</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="filter-tabs" role="tablist" aria-label="Filter by subject">
                    {subjects.map(s => (
                        <button key={s} role="tab" aria-selected={subjectFilter === s} className={`filter-tab ${subjectFilter === s ? 'active' : ''}`} onClick={() => setSubjectFilter(s)}>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="filter-tabs" role="tablist" aria-label="Filter by resource type">
                    {types.map(t => (
                        <button key={t} role="tab" aria-selected={typeFilter === t} className={`filter-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                            {t === 'All' ? 'All Types' : t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filtered.map(r => (
                    <div key={r.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                        <button
                            onClick={() => toggleBookmark(r.id)}
                            aria-label={bookmarks[r.id] ? `Remove bookmark from ${r.title}` : `Bookmark ${r.title}`}
                            aria-pressed={!!bookmarks[r.id]}
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: 18
                            }}
                            title={bookmarks[r.id] ? 'Remove bookmark' : 'Bookmark'}
                        >
                            {bookmarks[r.id] ? '🔖' : '📌'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                                background: 'var(--gray-100)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 22
                            }}>
                                {typeIcons[r.type]}
                            </div>
                            <div>
                                <span className="subject-tag" style={{ background: subjectColors[r.subject] + '22', color: subjectColors[r.subject] }}>
                                    {r.subject}
                                </span>
                                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gray-400)' }}>{r.type}</span>
                            </div>
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)', paddingRight: 28 }}>{r.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>by {r.author}</p>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 'auto' }}>
                            {r.pages && `${r.pages} pages`}
                            {r.duration && `Duration: ${r.duration}`}
                            {r.type === 'Link' && 'External link'}
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                    <p>No resources found matching your filters</p>
                </div>
            )}
        </div>
    )
}

export default LibraryPage
