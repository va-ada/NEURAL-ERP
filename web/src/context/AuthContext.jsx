import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, setTokens, clearTokens, getAccessToken } from '../services/api'

const AuthContext = createContext(null)

// Mock users for dev-mode fallback when the backend is unreachable. Passwords
// are NOT stored in source — the app only enables this path in dev builds
// (import.meta.env.DEV) and only when VITE_DEV_PASSWORD is set. Production
// builds strip the list entirely, so this cannot be used as an auth bypass.
const DEV_PASSWORD = import.meta.env.DEV ? (import.meta.env.VITE_DEV_PASSWORD || '') : ''

const MOCK_USERS = DEV_PASSWORD ? [
    { email: 'vikram.kapoor@sfit.edu', role: 'STUDENT', studentId: 'STU001', name: 'Vikram Kapoor', avatar: { initial: 'V', color: '#EA580C' }, semester: 6, roll: 'AIML001', section: 'A', phone: '+91 98765 43210', batchId: 'B001' },
    { email: 'rhea.joshi@sfit.edu', role: 'STUDENT', studentId: 'STU002', name: 'Rhea Joshi', avatar: { initial: 'R', color: '#2563EB' }, semester: 6, roll: 'AIML002', section: 'A', phone: '+91 98765 43211', batchId: 'B001' },
    { email: 'prashant.nair@sfit.edu', role: 'STUDENT', studentId: 'STU003', name: 'Prashant Nair', avatar: { initial: 'P', color: '#D946EF' }, semester: 6, roll: 'AIML003', section: 'A', phone: '+91 98765 43212', batchId: 'B001' },
    { email: 'neha.singh2@sfit.edu', role: 'STUDENT', studentId: 'STU004', name: 'Neha Singh', avatar: { initial: 'N', color: '#EC4899' }, semester: 6, roll: 'AIML004', section: 'A', phone: '+91 98765 43213', batchId: 'B001' },
    { email: 'dr.sharma@sfit.edu', role: 'FACULTY', name: 'Dr. Amit Sharma', avatar: { initial: 'A', color: '#2563EB' }, department: 'CS', employeeId: 'FAC001', designation: 'Associate Professor', room: 'Room 305', phone: '+91 98765 00001' },
    { email: 'vikram.desai@sfit.edu', role: 'ADMIN', name: 'Dr. Vikram Desai', avatar: { initial: 'V', color: '#8B5CF6' }, department: 'AI/ML' },
    { email: 'meera.nair@sfit.edu', role: 'ADMIN', name: 'Prof. Meera Nair', avatar: { initial: 'M', color: '#EC4899' }, department: 'AI/ML' },
] : []

function buildMockUserData(mockUser) {
    const isStudent = mockUser.role === 'STUDENT'
    const isFaculty = mockUser.role === 'FACULTY'
    return {
        id: mockUser.studentId || mockUser.employeeId || `MOCK_${Date.now()}`,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        avatar: mockUser.avatar,
        ...(isStudent && {
            studentId: mockUser.studentId,
            semester: mockUser.semester,
            roll: mockUser.roll,
            section: mockUser.section,
            phone: mockUser.phone,
            batchId: mockUser.batchId,
            stats: {
                attendance: 85,
                attendanceTrend: '+2% this month',
                cgpa: 8.2,
                cgpaTrend: '+0.1 this sem',
                assignmentsCompleted: 10,
                assignmentsTotal: 15,
                careerScore: 72,
                careerScoreTrend: '+3 points',
            },
        }),
        ...(isFaculty && {
            employeeId: mockUser.employeeId,
            department: mockUser.department,
            designation: mockUser.designation,
            room: mockUser.room,
            phone: mockUser.phone,
        }),
        ...(!isStudent && !isFaculty && {
            department: mockUser.department,
        }),
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session from localStorage or sessionStorage on mount
    useEffect(() => {
        try {
            const token = getAccessToken()
            const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
            if (token && savedUser) {
                const parsed = JSON.parse(savedUser)
                setUser(parsed)
                setRole(parsed.role)
            }
        } catch {
            clearTokens()
        }
        setLoading(false)
    }, [])

    // Step 1: Send email + password -> backend responds with OTP prompt
    // Falls back to mock auth if backend is unavailable
    async function login(email, password, rememberMe = true) {
        // Try real API first
        try {
            const result = await authAPI.login(email, password)
            // Backend sends OTP to email, returns message
            // Store rememberMe preference for use during OTP verification
            sessionStorage.setItem('_rememberMe', rememberMe ? '1' : '0')
            return { success: true, needsOtp: true, email, message: result.message }
        } catch (err) {
            // If it's a credential error from a running backend, surface it
            // (e.g. 401/403 means backend is up but creds are wrong)
            if (err.response && err.response.status >= 400 && err.response.status < 500) {
                return { success: false, error: err.message || 'Invalid email or password' }
            }

            // Network error / backend not running — fall back to dev mock auth
            // only if VITE_DEV_PASSWORD was set at build time. In production
            // builds MOCK_USERS is empty, so this short-circuits to failure.
            if (MOCK_USERS.length > 0 && password === DEV_PASSWORD) {
                const mockUser = MOCK_USERS.find(u => u.email === email)
                if (mockUser) {
                    const userData = buildMockUserData(mockUser)
                    const mockToken = 'mock_token_' + Date.now()
                    setTokens(mockToken, mockToken, rememberMe)
                    setUser(userData)
                    setRole(userData.role)
                    const userStorage = rememberMe ? localStorage : sessionStorage
                    userStorage.setItem('user', JSON.stringify(userData))
                    return { success: true, mockLogin: true, role: userData.role }
                }
            }

            return { success: false, error: 'Invalid email or password' }
        }
    }

    // Step 2: Verify OTP -> receive tokens + user data (real API flow only)
    async function verifyOtp(email, otp) {
        try {
            const rememberMe = sessionStorage.getItem('_rememberMe') !== '0'
            sessionStorage.removeItem('_rememberMe')
            const result = await authAPI.verifyOtp(email, otp)
            setTokens(result.accessToken, result.refreshToken, rememberMe)
            const userData = result.user
            setUser(userData)
            setRole(userData.role)
            const userStorage = rememberMe ? localStorage : sessionStorage
            userStorage.setItem('user', JSON.stringify(userData))
            return { success: true, role: userData.role }
        } catch (err) {
            return { success: false, error: err.message }
        }
    }

    async function logout() {
        // Best-effort server-side invalidation; always clear local state.
        try { await authAPI.logout() } catch { /* ignore — token may already be gone */ }
        setUser(null)
        setRole(null)
        clearTokens()
    }

    // Don't render children until session is checked
    if (loading) return null

    return (
        <AuthContext.Provider value={{ user, role, login, verifyOtp, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
