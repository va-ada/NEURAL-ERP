import { useRef } from 'react'

// Inline modal for composing a new rich-text note. The parent owns the
// open/close + form state so it can also drop the new note into its list
// without round-tripping through this component.

export default function CreateNoteModal({
    open,
    onClose,
    title,
    setTitle,
    subject,
    setSubject,
    onSave,
}) {
    const editorRef = useRef(null)

    function execFormat(cmd) {
        document.execCommand(cmd, false, null)
        editorRef.current?.focus()
    }

    function handleSave() {
        const html = editorRef.current?.innerHTML || ''
        onSave(html)
    }

    if (!open) return null
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h2>Create Note</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="demo-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14, background: 'var(--white)', color: 'var(--gray-700)' }}>
                                <option>Machine Learning</option>
                                <option>Deep Learning</option>
                                <option>Natural Language Processing</option>
                                <option>Computer Vision</option>
                                <option>Data Structures & Algorithms</option>
                                <option>Probability & Statistics</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Content</label>
                            <div style={{ display: 'flex', gap: 4, padding: '6px 8px', background: 'var(--gray-100)', borderRadius: '8px 8px 0 0', border: '1px solid var(--gray-200)', borderBottom: 'none' }}>
                                <button onClick={() => execFormat('bold')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--gray-600)' }} title="Bold">B</button>
                                <button onClick={() => execFormat('italic')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontStyle: 'italic', fontSize: 14, color: 'var(--gray-600)' }} title="Italic">I</button>
                                <button onClick={() => execFormat('underline')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 14, color: 'var(--gray-600)' }} title="Underline">U</button>
                                <span style={{ borderLeft: '1px solid var(--gray-300)', margin: '0 4px' }} />
                                <button onClick={() => document.execCommand('formatBlock', false, 'H3')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--gray-600)' }} title="Heading">H</button>
                                <button onClick={() => execFormat('insertUnorderedList')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--gray-600)' }} title="Bullet List">•≡</button>
                                <button onClick={() => execFormat('insertOrderedList')} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--gray-600)' }} title="Numbered List">1.</button>
                            </div>
                            <div
                                ref={editorRef}
                                contentEditable
                                style={{
                                    minHeight: 180, padding: 14, border: '1px solid var(--gray-200)',
                                    borderRadius: '0 0 8px 8px', fontSize: 14, lineHeight: 1.6,
                                    outline: 'none', color: 'var(--gray-700)', background: 'var(--white)'
                                }}
                                placeholder="Start writing..."
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="modal-btn-primary" onClick={handleSave}>Save Note</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
