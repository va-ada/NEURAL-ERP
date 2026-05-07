function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Dialog'}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    )
}

export default Modal
