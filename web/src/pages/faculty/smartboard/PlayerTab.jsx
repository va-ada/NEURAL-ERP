import { useState, useEffect, useRef, useCallback } from 'react'
import { SUBJECTS } from './constants'

// ─── QR Scanner Modal ────────────────────────────────────

export function QrScannerModal({ onDetected, onClose }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const rafRef = useRef(null)
    const [error, setError] = useState(null)
    const [scanning, setScanning] = useState(true)

    const stopCamera = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }, [])

    useEffect(() => {
        let jsQR = null

        async function startCamera() {
            try {
                // Dynamically import jsQR to keep initial bundle small
                const mod = await import('jsqr')
                jsQR = mod.default

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
                })
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                    scanFrame(jsQR)
                }
            } catch (err) {
                setError(err.name === 'NotAllowedError'
                    ? 'Camera access denied. Please allow camera permission and try again.'
                    : `Camera error: ${err.message}`)
                setScanning(false)
            }
        }

        function scanFrame(jsQRFn) {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas || video.readyState < 2) {
                rafRef.current = requestAnimationFrame(() => scanFrame(jsQRFn))
                return
            }
            const ctx = canvas.getContext('2d')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQRFn(imageData.data, imageData.width, imageData.height)
            if (code && code.data) {
                stopCamera()
                setScanning(false)
                onDetected(code.data)
            } else {
                rafRef.current = requestAnimationFrame(() => scanFrame(jsQRFn))
            }
        }

        startCamera()
        return () => stopCamera()
    }, [onDetected, stopCamera])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <h2>Scan Smartboard QR Code</h2>
                    <button className="modal-close" onClick={() => { stopCamera(); onClose() }}>&times;</button>
                </div>
                <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
                    {error ? (
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <p style={{ fontSize: 36, marginBottom: 12 }}>⚠️</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                style={{ width: '100%', display: 'block', borderRadius: '0 0 12px 12px', maxHeight: 380, objectFit: 'cover' }}
                            />
                            {/* QR frame overlay */}
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                            }}>
                                <div style={{
                                    width: 200, height: 200, border: '3px solid #2563EB',
                                    borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                                    position: 'relative',
                                }}>
                                    {/* Corner markers */}
                                    {[['0 0 0 0', '0', '0'], ['0 0 0 auto', '0', 'auto'], ['auto 0 0 0', 'auto', '0'], ['auto 0 0 auto', 'auto', 'auto']].map(([inset, top, left], i) => (
                                        <div key={i} style={{
                                            position: 'absolute', top, left, right: left === 'auto' ? '0' : undefined,
                                            bottom: top === 'auto' ? '0' : undefined,
                                            width: 20, height: 20,
                                            borderTop: (top === '0') ? '3px solid #fff' : 'none',
                                            borderBottom: (top === 'auto') ? '3px solid #fff' : 'none',
                                            borderLeft: (left === '0') ? '3px solid #fff' : 'none',
                                            borderRight: (left === 'auto') ? '3px solid #fff' : 'none',
                                        }} />
                                    ))}
                                    {scanning && (
                                        <div style={{
                                            position: 'absolute', left: 0, right: 0, height: 2,
                                            background: '#2563EB', animation: 'qr-scan-line 1.5s ease-in-out infinite',
                                        }} />
                                    )}
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', padding: '12px 0 16px', fontSize: 13, color: '#fff', background: 'rgba(0,0,0,0.6)', margin: 0 }}>
                                Point the camera at the QR code on the smartboard
                            </p>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>
            <style>{`@keyframes qr-scan-line { 0%,100%{top:0} 50%{top:calc(100% - 2px)} }`}</style>
        </div>
    )
}

// ─── QR Confirm Modal ────────────────────────────────────

export function QrConfirmModal({ detectedUrl, onSave, onClose, saving }) {
    const [title, setTitle] = useState('')
    const [subject, setSubject] = useState(SUBJECTS[0])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <h2>QR Code Detected</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--gray-200)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>DETECTED URL</p>
                        <p style={{ fontSize: 12, color: 'var(--gray-700)', wordBreak: 'break-all' }}>{detectedUrl}</p>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        The ERP will fetch the PDF from this URL and save it for students.
                    </p>
                    <div className="demo-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Chapter 5 — Convolutional Networks"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <select
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14, background: 'var(--white)', color: 'var(--gray-700)' }}
                            >
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="modal-btn-primary"
                            onClick={() => onSave({ title, subject })}
                            disabled={saving || !title.trim()}
                            style={{ opacity: saving || !title.trim() ? 0.6 : 1 }}
                        >
                            {saving ? 'Saving PDF...' : 'Save to ERP'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
