import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type, exiting: false }])
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
        }, duration)
    }, [])

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
    }, [])

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
                    >
                        <span className="toast-icon">{icons[toast.type]}</span>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-dismiss" onClick={() => dismissToast(toast.id)}>&times;</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}
