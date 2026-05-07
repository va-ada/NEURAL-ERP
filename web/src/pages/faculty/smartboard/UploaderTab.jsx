import { useRef } from 'react'
import { SUBJECTS, formatBytes } from './constants'

export default function UploaderTab({
    title,
    setTitle,
    subject,
    setSubject,
    selectedFile,
    setSelectedFile,
    dragOver,
    setDragOver,
    uploading,
    onUpload,
    onOpenScanner,
}) {
    const fileInputRef = useRef(null)

    function handleFileSelect(file) {
        if (!file) return
        if (file.type !== 'application/pdf') return
        if (file.size > 50 * 1024 * 1024) return
        setSelectedFile(file)
        if (!title) setTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' '))
    }

    function handleDrop(e) {
        e.preventDefault()
        setDragOver(false)
        handleFileSelect(e.dataTransfer.files[0])
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

            {/* QR Scan card */}
            <div className="dash-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
                <div style={{ fontSize: 52 }}>📷</div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Scan QR Code</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    Show the LG smartboard QR — the ERP fetches the PDF automatically.
                </p>
                <button
                    className="btn-primary"
                    style={{ marginTop: 4, width: '100%' }}
                    onClick={onOpenScanner}
                >
                    Open Camera & Scan
                </button>
            </div>

            {/* Upload card */}
            <div className="dash-card">
                <h2 style={{ marginBottom: 14, fontSize: 18 }}>Upload PDF</h2>
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? '#2563EB' : selectedFile ? '#16a34a' : 'var(--gray-300)'}`,
                        borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                        background: dragOver ? '#eff6ff' : selectedFile ? '#f0fdf4' : 'var(--gray-50)',
                        transition: 'all 0.2s', marginBottom: 14,
                    }}
                >
                    <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{selectedFile ? '📄' : '📤'}</div>
                    {selectedFile ? (
                        <>
                            <p style={{ fontWeight: 600, color: '#16a34a', fontSize: 13 }}>{selectedFile.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatBytes(selectedFile.size)} · click to change</p>
                        </>
                    ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Drop PDF or click to browse</p>
                    )}
                </div>
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Title..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--gray-700)', boxSizing: 'border-box', marginBottom: 10 }}
                />
                <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--gray-700)', marginBottom: 14 }}
                >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <button
                    className="btn-primary"
                    onClick={onUpload}
                    disabled={uploading || !selectedFile}
                    style={{ opacity: uploading || !selectedFile ? 0.6 : 1, width: '100%' }}
                >
                    {uploading ? 'Uploading...' : 'Upload to ERP'}
                </button>
            </div>
        </div>
    )
}
