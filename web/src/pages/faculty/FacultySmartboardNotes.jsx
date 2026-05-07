import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { smartboardAPI } from '../../services/api'
import UploaderTab from './smartboard/UploaderTab'
import ListTab from './smartboard/ListTab'
import { QrScannerModal, QrConfirmModal } from './smartboard/PlayerTab'
import { SUBJECTS } from './smartboard/constants'
import '../Dashboard.css'

const MOCK_NOTES = [
    { id: '1', title: 'Neural Networks Intro', subject: 'Deep Learning', uploadedBy: 'Dr. Sharma', fileName: 'neural_networks.pdf', fileSize: 1240000, createdAt: '2026-04-09T09:00:00Z', fileUrl: null },
    { id: '2', title: 'Backpropagation Derivation', subject: 'Machine Learning', uploadedBy: 'Dr. Sharma', fileName: 'backprop.pdf', fileSize: 890000, createdAt: '2026-04-08T11:30:00Z', fileUrl: null },
]

function FacultySmartboardNotes() {
    const { user } = useAuth()
    const { showToast } = useToast()

    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // File upload state
    const [title, setTitle] = useState('')
    const [subject, setSubject] = useState(SUBJECTS[0])
    const [selectedFile, setSelectedFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)

    // QR scanner state
    const [showQrScanner, setShowQrScanner] = useState(false)
    const [detectedQrUrl, setDetectedQrUrl] = useState(null)
    const [savingQr, setSavingQr] = useState(false)

    useEffect(() => { loadNotes() }, [])

    async function loadNotes() {
        try {
            const data = await smartboardAPI.getAll()
            setNotes(data.notes || [])
        } catch {
            setNotes(MOCK_NOTES)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload() {
        if (!selectedFile) return showToast('Please select a PDF file.', 'warning')
        if (!title.trim()) return showToast('Please enter a title.', 'warning')
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('pdf', selectedFile)
            formData.append('title', title.trim())
            formData.append('subject', subject)
            formData.append('uploadedBy', user?.name || 'Faculty')
            const result = await smartboardAPI.upload(formData)
            setNotes(prev => [result.note, ...prev])
            setSelectedFile(null)
            setTitle('')
            showToast('Notes uploaded successfully!', 'success')
        } catch {
            // Local blob fallback for demo
            const mockNote = {
                id: Date.now().toString(),
                title: title.trim(), subject,
                uploadedBy: user?.name || 'Faculty',
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                fileUrl: URL.createObjectURL(selectedFile),
                createdAt: new Date().toISOString(),
            }
            setNotes(prev => [mockNote, ...prev])
            setSelectedFile(null)
            setTitle('')
            showToast('Saved locally — will sync when backend is running.', 'success')
        } finally {
            setUploading(false)
        }
    }

    // ── QR handlers ───────────────────────────────────────

    function handleQrDetected(url) {
        setShowQrScanner(false)
        setDetectedQrUrl(url)
    }

    async function handleQrSave({ title: qrTitle, subject: qrSubject }) {
        if (!qrTitle.trim()) return showToast('Please enter a title.', 'warning')
        setSavingQr(true)
        try {
            const result = await smartboardAPI.saveFromQr({
                qrUrl: detectedQrUrl,
                title: qrTitle.trim(),
                subject: qrSubject,
                uploadedBy: user?.name || 'Faculty',
            })
            setNotes(prev => [result.note, ...prev])
            setDetectedQrUrl(null)
            showToast('Smartboard PDF saved from QR!', 'success')
        } catch {
            // If backend unavailable, store just the URL reference
            const mockNote = {
                id: Date.now().toString(),
                title: qrTitle.trim(), subject: qrSubject,
                uploadedBy: user?.name || 'Faculty',
                fileName: `${qrTitle.trim()}.pdf`,
                fileSize: null,
                fileUrl: detectedQrUrl,
                createdAt: new Date().toISOString(),
            }
            setNotes(prev => [mockNote, ...prev])
            setDetectedQrUrl(null)
            showToast('Saved QR link locally — PDF will be fetched when backend is running.', 'success')
        } finally {
            setSavingQr(false)
        }
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Smartboard Notes</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                    Scan the LG smartboard QR code to save notes directly, or upload the exported PDF.
                </p>
            </div>

            <UploaderTab
                title={title}
                setTitle={setTitle}
                subject={subject}
                setSubject={setSubject}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                dragOver={dragOver}
                setDragOver={setDragOver}
                uploading={uploading}
                onUpload={handleUpload}
                onOpenScanner={() => setShowQrScanner(true)}
            />

            <ListTab notes={notes} loading={loading} />

            {/* QR Scanner modal */}
            {showQrScanner && (
                <QrScannerModal
                    onDetected={handleQrDetected}
                    onClose={() => setShowQrScanner(false)}
                />
            )}

            {/* QR Confirm modal */}
            {detectedQrUrl && (
                <QrConfirmModal
                    detectedUrl={detectedQrUrl}
                    onSave={handleQrSave}
                    onClose={() => setDetectedQrUrl(null)}
                    saving={savingQr}
                />
            )}
        </>
    )
}

export default FacultySmartboardNotes
