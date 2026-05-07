import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const subjectForums = [
    { id: 'ml', name: 'Machine Learning', threads: 24, posts: 156, lastActivity: '2 hours ago', color: '#2D5BFF' },
    { id: 'dl', name: 'Deep Learning', threads: 18, posts: 89, lastActivity: '5 hours ago', color: '#8B5CF6' },
    { id: 'nlp', name: 'NLP', threads: 12, posts: 67, lastActivity: '1 day ago', color: '#22C55E' },
    { id: 'cv', name: 'Computer Vision', threads: 15, posts: 78, lastActivity: '3 hours ago', color: '#F59E0B' },
    { id: 'dsa', name: 'DSA', threads: 31, posts: 210, lastActivity: '30 mins ago', color: '#EF4444' },
    { id: 'ps', name: 'Probability & Stats', threads: 9, posts: 42, lastActivity: '2 days ago', color: '#EC4899' },
]

const sampleThreads = {
    ml: [
        { id: 1, title: 'How does batch normalization improve training?', author: 'Ananya S.', initial: 'A', color: '#22C55E', replies: 8, upvotes: 12, time: '2 hours ago', pinned: true },
        { id: 2, title: 'Best resources for understanding SVMs?', author: 'Prashant K.', initial: 'P', color: '#2D5BFF', replies: 5, upvotes: 7, time: '5 hours ago' },
    ],
    dl: [
        { id: 3, title: 'Why does my GAN produce mode collapse?', author: 'Prashant K.', initial: 'P', color: '#2D5BFF', replies: 11, upvotes: 15, time: '3 hours ago', pinned: true },
    ],
    nlp: [
        { id: 4, title: 'BERT vs GPT — when to use which?', author: 'Sneha G.', initial: 'S', color: '#8B5CF6', replies: 14, upvotes: 22, time: '1 day ago', pinned: true },
    ],
    cv: [
        { id: 5, title: 'Help with YOLO object detection assignment', author: 'Rahul M.', initial: 'R', color: '#F59E0B', replies: 4, upvotes: 3, time: '3 hours ago' },
    ],
    dsa: [
        { id: 6, title: 'DP approach for LCS problem', author: 'Ananya S.', initial: 'A', color: '#22C55E', replies: 7, upvotes: 11, time: '30 mins ago', pinned: true },
    ],
    ps: [
        { id: 7, title: 'Bayes theorem in real ML problems', author: 'Sneha G.', initial: 'S', color: '#8B5CF6', replies: 2, upvotes: 5, time: '2 days ago' },
    ],
}

const POSTS_PER_PAGE = 10

function ForumPage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [active, setActive] = useState(null)
    const [threads, setThreads] = useState(sampleThreads)
    const [showNew, setShowNew] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    function post() {
        if (!title.trim()) return showToast('Title required', 'warning')
        const t = { id: Date.now(), title, author: user?.name || 'You', initial: user?.avatar?.initial || 'U', color: user?.avatar?.color || '#22C55E', replies: 0, upvotes: 0, time: 'Just now' }
        setThreads(p => ({ ...p, [active]: [t, ...(p[active] || [])] }))
        setTitle(''); setContent(''); setShowNew(false)
        showToast('Thread posted!', 'success')
    }

    if (!active) {
        return (
            <div>
                <div className="dashboard-header"><h1>Discussion Forum</h1></div>
                <div className="stats-row">
                    <div className="dash-stat-card"><div className="dash-stat-icon blue">💬</div><div className="dash-stat-info"><h3>{subjectForums.reduce((a, f) => a + f.threads, 0)}</h3><p>Total Threads</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon green">📝</div><div className="dash-stat-info"><h3>{subjectForums.reduce((a, f) => a + f.posts, 0)}</h3><p>Total Posts</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon purple">📂</div><div className="dash-stat-info"><h3>6</h3><p>Subject Boards</p></div></div>
                    <div className="dash-stat-card"><div className="dash-stat-icon yellow">🔥</div><div className="dash-stat-info"><h3>DSA</h3><p>Most Active</p></div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                    {subjectForums.map(f => (
                        <div key={f.id} className="dash-card" style={{ cursor: 'pointer', borderTop: `3px solid ${f.color}` }} onClick={() => { setActive(f.id); setCurrentPage(1) }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.name}</h3>
                            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-500)' }}>
                                <span>💬 {f.threads} threads</span><span>📝 {f.posts} posts</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>Last: {f.lastActivity}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const info = subjectForums.find(f => f.id === active)
    const list = threads[active] || []
    const totalPages = Math.ceil(list.length / POSTS_PER_PAGE)
    const paginatedList = list.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

    return (
        <div>
            <div className="dashboard-header">
                <h1><button aria-label="Back to forums" onClick={() => { setActive(null); setShowNew(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, marginRight: 8, color: 'var(--gray-500)' }}>←</button>{info?.name}</h1>
                <div className="header-right"><button className="btn-primary" onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : '+ New Thread'}</button></div>
            </div>
            {showNew && (
                <div className="dash-card" style={{ marginBottom: 24 }}>
                    <h2>New Thread</h2>
                    <div className="demo-form">
                        <div className="form-group"><label htmlFor="forum-title">Title</label><input id="forum-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your question..." /></div>
                        <div className="form-group"><label htmlFor="forum-content">Content</label><textarea id="forum-content" value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Details..." /></div>
                        <button className="btn-primary" onClick={post}>Post</button>
                    </div>
                </div>
            )}
            <div className="dash-card">
                {paginatedList.map(t => (
                    <div key={t.id} className="assignment-card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 50 }}>
                            <span style={{ cursor: 'pointer' }}>▲</span>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.upvotes}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600 }}>{t.pinned && '📌 '}{t.title}</h4>
                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{t.initial}</div>
                                    {t.author}
                                </span>
                                <span>💬 {t.replies}</span><span>{t.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="btn-view"
                        >
                            Previous
                        </button>
                        <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--gray-500)' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="btn-view"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ForumPage
