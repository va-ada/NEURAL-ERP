import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const NeuralLogo = () => (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="10" r="3" fill="currentColor" />
        <circle cx="10" cy="20" r="3" fill="currentColor" />
        <circle cx="22" cy="20" r="3" fill="currentColor" />
        <line x1="16" y1="13" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16" y1="13" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" />
        <line x1="13" y1="20" x2="19" y2="20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
)

// Dev-only quick-login shortcuts. Passwords are loaded at build time from
// VITE_DEV_PASSWORD (a single shared dev password) and never stored in source.
// In production builds the list is empty and the grid disappears.
const DEV_QUICK_PASSWORD = import.meta.env.DEV ? (import.meta.env.VITE_DEV_PASSWORD || '') : ''

const quickLogins = DEV_QUICK_PASSWORD ? [
    { label: 'Vikram Kapoor', subtitle: 'Student (AI/ML)', email: 'vikram.kapoor@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#EA580C', initial: 'V' },
    { label: 'Rhea Joshi', subtitle: 'Student (AI/ML)', email: 'rhea.joshi@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#2563EB', initial: 'R' },
    { label: 'Prashant Nair', subtitle: 'Student (AI/ML)', email: 'prashant.nair@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#D946EF', initial: 'P' },
    { label: 'Neha Singh', subtitle: 'Student (AI/ML)', email: 'neha.singh2@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#EC4899', initial: 'N' },
    { label: 'Dr. Amit Sharma', subtitle: 'Faculty (CS)', email: 'dr.sharma@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#2563EB', initial: 'A' },
    { label: 'Dr. Vikram Desai', subtitle: 'Admin (HOD)', email: 'vikram.desai@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#8B5CF6', initial: 'V' },
    { label: 'Prof. Meera Nair', subtitle: 'Admin', email: 'meera.nair@sfit.edu', password: DEV_QUICK_PASSWORD, color: '#EC4899', initial: 'M' },
] : []

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [otpStep, setOtpStep] = useState(false)
    const [otpEmail, setOtpEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const navigate = useNavigate()
    const { user, role, login, verifyOtp } = useAuth()

    // Redirect if already logged in
    if (user) {
        return <Navigate to={role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : '/student'} replace />
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (otpStep) {
            // Step 2: Verify OTP
            const result = await verifyOtp(otpEmail, otp)
            setLoading(false)
            if (result.success) {
                navigate(result.role === 'ADMIN' || result.role === 'SUPER_ADMIN' ? '/admin' : result.role === 'FACULTY' ? '/faculty' : '/student')
            } else {
                setError(result.error || 'Wrong OTP')
            }
        } else {
            // Step 1: Login with email/password
            const result = await login(email, password, rememberMe)
            setLoading(false)
            if (result.success && result.mockLogin) {
                // Mock login — skip OTP, navigate directly
                navigate(result.role === 'ADMIN' || result.role === 'SUPER_ADMIN' ? '/admin' : result.role === 'FACULTY' ? '/faculty' : '/student')
            } else if (result.success && result.needsOtp) {
                setOtpStep(true)
                setOtpEmail(result.email || email)
                setMessage(result.message || 'OTP sent to your email. Check server console in dev mode.')
            } else if (!result.success) {
                setError(result.error || 'Invalid email or password')
            }
        }
    }

    async function handleQuickLogin(cred) {
        setEmail(cred.email)
        setPassword(cred.password)
        setError('')
        setLoading(true)

        const result = await login(cred.email, cred.password)
        setLoading(false)
        if (result.success && result.mockLogin) {
            // Mock login — skip OTP, navigate directly
            navigate(result.role === 'ADMIN' || result.role === 'SUPER_ADMIN' ? '/admin' : result.role === 'FACULTY' ? '/faculty' : '/student')
        } else if (result.success && result.needsOtp) {
            setOtpStep(true)
            setOtpEmail(result.email || cred.email)
            setMessage(result.message || 'OTP sent — check server console in dev mode.')
        } else if (!result.success) {
            setError(result.error || 'Login failed')
        }
    }

    function handleBackToLogin() {
        setOtpStep(false)
        setOtp('')
        setMessage('')
        setError('')
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <NeuralLogo />
                    <h1>Neural ERP</h1>
                    <p>AI/ML Department Portal</p>
                </div>
                <div className="login-features">
                    <div className="login-feature">
                        <span className="login-feature-icon">🎓</span>
                        <div>
                            <strong>Student Dashboard</strong>
                            <p>Track attendance, grades, assignments & career</p>
                        </div>
                    </div>
                    <div className="login-feature">
                        <span className="login-feature-icon">📊</span>
                        <div>
                            <strong>Admin Analytics</strong>
                            <p>Monitor department performance & placements</p>
                        </div>
                    </div>
                    <div className="login-feature">
                        <span className="login-feature-icon">🤖</span>
                        <div>
                            <strong>AI-Powered Insights</strong>
                            <p>Smart predictions for student success</p>
                        </div>
                    </div>
                </div>
                <div className="login-footer-text">
                    St. Francis Institute of Technology
                </div>
            </div>

            <div className="login-right">
                <div className="login-form-container">
                    <h2>{otpStep ? 'Verify OTP' : 'Sign In'}</h2>
                    <p className="login-subtitle">
                        {otpStep
                            ? 'Enter the 6-digit OTP sent to your email'
                            : 'Enter your credentials to access the portal'}
                    </p>

                    {message && <div className="login-message" aria-live="polite">{message}</div>}

                    <form onSubmit={handleSubmit}>
                        {otpStep ? (
                            <div className="form-group">
                                <label htmlFor="otp-input">OTP Code</label>
                                <input
                                    id="otp-input"
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    aria-label="6-digit OTP code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem' }}
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                                    📧 Sent to {otpEmail} — In dev mode, check the server console for the OTP
                                </small>
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label htmlFor="email-input">Email</label>
                                    <input
                                        id="email-input"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@sfit.edu"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password-input">Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="password-input"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <label
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: 'var(--gray-600, #6B7280)',
                                        marginTop: '4px',
                                        userSelect: 'none',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    Remember me
                                </label>
                            </>
                        )}
                        {error && <div className="login-error" role="alert" aria-live="assertive">{error}</div>}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Please wait...' : otpStep ? 'Verify & Sign In' : 'Sign In'}
                        </button>
                        {otpStep && (
                            <button type="button" className="login-btn" onClick={handleBackToLogin}
                                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                                ← Back to Login
                            </button>
                        )}
                    </form>

                    {!otpStep && quickLogins.length > 0 && (
                        <div className="quick-login-section">
                            <div className="quick-login-divider">
                                <span>Quick Login (Demo)</span>
                            </div>
                            <div className="quick-login-grid">
                                {quickLogins.map((cred, i) => (
                                    <button
                                        key={i}
                                        className="quick-login-card"
                                        onClick={() => handleQuickLogin(cred)}
                                        disabled={loading}
                                    >
                                        <div className="quick-avatar" style={{ background: cred.color }}>
                                            {cred.initial}
                                        </div>
                                        <div className="quick-info">
                                            <strong>{cred.label}</strong>
                                            <span>{cred.subtitle}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LoginPage

