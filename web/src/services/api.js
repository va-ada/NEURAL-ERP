// ────────────────────────────────────────────────────────
// Neural ERP — Central API Service
// Handles all HTTP communication with the backend.
// ────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Token Management ───────────────────────────────────
// Tokens are stored in localStorage (persistent) or sessionStorage (tab-only)
// based on the "Remember me" preference set during login.

function getAccessToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

function getRefreshToken() {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

function setTokens(access, refresh, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    // Clear both storages first to avoid stale tokens in the other
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    storage.setItem('accessToken', access);
    if (refresh) storage.setItem('refreshToken', refresh);
}

function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
}

// ─── Core Fetch Wrapper ─────────────────────────────────

/**
 * Parse the unified error envelope produced by the backend:
 *   { error: { code, message, requestId, details? } }
 * Returns a plain Error whose .code / .details / .requestId are accessible
 * for call-site logic (e.g. detecting TOKEN_EXPIRED).
 */
function errorFromBody(body, status) {
    const err = body?.error || {}
    const message = err.message || body?.error || `Request failed: ${status}`
    const e = new Error(typeof message === 'string' ? message : `Request failed: ${status}`)
    e.code = err.code || null
    e.details = err.details || null
    e.requestId = err.requestId || null
    e.status = status
    return e
}

async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    let res = await fetch(url, { ...options, headers })

    // Auto-refresh on 401 when the server explicitly says the token expired.
    if (res.status === 401) {
        const body = await res.clone().json().catch(() => ({}))
        const code = body?.error?.code || body?.code
        if (code === 'TOKEN_EXPIRED') {
            const refreshed = await refreshAccessToken()
            if (refreshed) {
                headers['Authorization'] = `Bearer ${getAccessToken()}`
                res = await fetch(url, { ...options, headers })
            } else {
                clearTokens()
                window.location.href = '/login'
                throw new Error('Session expired. Please log in again.')
            }
        }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw errorFromBody(body, res.status)
    }

    if (res.status === 204) return null

    const body = await res.json().catch(() => ({}))
    // Unwrap the `{ data: ... }` envelope so existing call sites read the
    // payload directly. Endpoints that pre-date the envelope still work.
    return Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body
}

async function refreshAccessToken() {
    try {
        const refresh = getRefreshToken();
        if (!refresh) return false;

        const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh }),
        });

        if (!res.ok) return false;
        const body = await res.json();
        const data = body?.data || body;
        if (!data?.accessToken) return false;
        // Preserve the current storage type when refreshing
        const rememberMe = localStorage.getItem('accessToken') !== null;
        setTokens(data.accessToken, data.refreshToken, rememberMe);
        return true;
    } catch {
        return false;
    }
}

// ─── Convenience Methods ────────────────────────────────

const api = {
    get: (path) => apiFetch(path),
    post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

// ═══════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════

export const authAPI = {
    login: (email, password) => api.post('/api/auth/login', { email, password }),
    verifyOtp: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
    refresh: () => refreshAccessToken(),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
    logout: () => api.post('/api/auth/logout', {}),
    getProfile: () => api.get('/api/users/me'),
};

// ═══════════════════════════════════════════════════════
//  ACADEMIC
// ═══════════════════════════════════════════════════════

export const academicAPI = {
    // Students
    getStudent: (id) => api.get(`/api/students/${id}`),
    getStudents: () => api.get('/api/students'),
    updateStudent: (id, data) => api.put(`/api/students/${id}/profile`, data),

    // Faculty
    getFaculty: () => api.get('/api/faculty'),
    getFacultyById: (id) => api.get(`/api/faculty/${id}`),
    createFaculty: (data) => api.post('/api/faculty', data),
    updateFaculty: (id, data) => api.put(`/api/faculty/${id}`, data),
    deleteFaculty: (id) => api.delete(`/api/faculty/${id}`),

    // Departments
    getDepartments: () => api.get('/api/departments'),

    // Subjects
    getSubjects: () => api.get('/api/subjects'),

    // Batches
    getBatches: () => api.get('/api/batches'),
};

// ═══════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════

export const attendanceAPI = {
    getByStudent: (studentId, params = '') => api.get(`/api/attendance/student/${studentId}${params}`),
    getByBatch: (params = '') => api.get(`/api/attendance/batch?${params}`),
    getStats: (params = '') => api.get(`/api/attendance/stats?${params}`),
    mark: (data) => api.post('/api/attendance', data),
};

// ═══════════════════════════════════════════════════════
//  TIMETABLE
// ═══════════════════════════════════════════════════════

export const timetableAPI = {
    getByBatch: (batchId) => api.get(`/api/timetable/batch/${batchId}`),
    create: (data) => api.post('/api/timetable', data),
    update: (id, data) => api.put(`/api/timetable/${id}`, data),
    remove: (id) => api.delete(`/api/timetable/${id}`),
    bulkUpdate: (batchId, slots) => api.put(`/api/timetable/batch/${batchId}/bulk`, { slots }),
    clearBatch: (batchId) => api.delete(`/api/timetable/batch/${batchId}/clear`),
    checkConflicts: (batchId, slots) => api.post('/api/timetable/conflicts', { batchId, slots }),
};

// ═══════════════════════════════════════════════════════
//  ASSIGNMENTS
// ═══════════════════════════════════════════════════════

export const assignmentAPI = {
    getAll: (params = '') => api.get(`/api/assignments?${params}`),
    getById: (id) => api.get(`/api/assignments/${id}`),
    create: (data) => api.post('/api/assignments', data),
    submit: (id, data) => api.post(`/api/assignments/${id}/submit`, data),
    getSubmissions: (assignmentId) => api.get(`/api/submissions/assignment/${assignmentId}`),
};

// ═══════════════════════════════════════════════════════
//  GRADES
// ═══════════════════════════════════════════════════════

export const gradeAPI = {
    getByStudent: (studentId) => api.get(`/api/grades/student/${studentId}`),
    getBySemester: (studentId, sem) => api.get(`/api/grades/student/${studentId}/semester/${sem}`),
    getStats: (studentId) => api.get(`/api/grades/student/${studentId}/stats`),
    create: (data) => api.post('/api/grades', data),
};

// ═══════════════════════════════════════════════════════
//  EXAMS
// ═══════════════════════════════════════════════════════

export const examAPI = {
    getAll: (params = '') => api.get(`/api/exams?${params}`),
    getByBatch: (batchId) => api.get(`/api/exams/batch/${batchId}`),
    create: (data) => api.post('/api/exams', data),
};

// ═══════════════════════════════════════════════════════
//  CAREER
// ═══════════════════════════════════════════════════════

export const careerAPI = {
    getOpportunities: () => api.get('/api/career/opportunities'),
    getRecommendations: (studentId, data = {}) => api.post(`/api/career/recommendations/${studentId}`, data),
    getEvents: () => api.get('/api/career/events'),
    getApplications: (studentId) => api.get(`/api/career/applications/${studentId}`),
    apply: (data) => api.post('/api/career/applications', data),
    getSkills: (studentId) => api.get(`/api/career/skills/${studentId}`),
    updateSkills: (studentId, skills) => api.put(`/api/career/skills/${studentId}`, { skills }),
    getStats: (studentId) => api.get(`/api/career/stats/${studentId}`),
    updatePreference: (studentId, data) => api.put(`/api/career/preferences/${studentId}`, data),
};

// ═══════════════════════════════════════════════════════
//  NOTES
// ═══════════════════════════════════════════════════════

export const notesAPI = {
    getFolders: (studentId) => api.get(`/api/notes/folders/${studentId}`),
    createFolder: (data) => api.post('/api/notes/folders', data),
    getNotes: (studentId, params = '') => api.get(`/api/notes/${studentId}${params}`),
    getRecent: (studentId) => api.get(`/api/notes/${studentId}/recent`),
    getBookmarked: (studentId) => api.get(`/api/notes/${studentId}/bookmarked`),
    getShared: (studentId) => api.get(`/api/notes/${studentId}/shared`),
    create: (data) => api.post('/api/notes', data),
    toggleBookmark: (id) => api.put(`/api/notes/${id}/bookmark`),
    share: (id, data) => api.post(`/api/notes/${id}/share`, data),
};

// ═══════════════════════════════════════════════════════
//  FEES
// ═══════════════════════════════════════════════════════

export const feeAPI = {
    getByStudent: (studentId) => api.get(`/api/fees/${studentId}`),
    getSummary: (studentId) => api.get(`/api/fees/${studentId}/summary`),
    create: (data) => api.post('/api/fees', data),
    pay: (feeId, data) => api.post(`/api/fees/${feeId}/pay`, data),
};

// ═══════════════════════════════════════════════════════
//  LIBRARY
// ═══════════════════════════════════════════════════════

export const libraryAPI = {
    getBooks: (params = '') => api.get(`/api/library/books?${params}`),
    addBook: (data) => api.post('/api/library/books', data),
    issue: (data) => api.post('/api/library/issue', data),
    returnBook: (issueId) => api.put(`/api/library/return/${issueId}`),
    getIssued: (studentId) => api.get(`/api/library/issued/${studentId}`),
};

// ═══════════════════════════════════════════════════════
//  FORUM
// ═══════════════════════════════════════════════════════

export const forumAPI = {
    getPosts: (params = '') => api.get(`/api/forum/posts?${params}`),
    createPost: (data) => api.post('/api/forum/posts', data),
    getPost: (id) => api.get(`/api/forum/posts/${id}`),
    reply: (id, data) => api.post(`/api/forum/posts/${id}/reply`, data),
    like: (id) => api.put(`/api/forum/posts/${id}/like`),
};

// ═══════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════

export const notificationAPI = {
    get: (userId) => api.get(`/api/notifications/${userId}`),
    create: (data) => api.post('/api/notifications', data),
    markRead: (id) => api.put(`/api/notifications/${id}/read`),
    markAllRead: (userId) => api.put(`/api/notifications/read-all/${userId}`),
};

// ═══════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════

export const announcementAPI = {
    getAll: () => api.get('/api/announcements'),
    create: (data) => api.post('/api/announcements', data),
};

// ═══════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════

export const adminAPI = {
    getDashboard: () => api.get('/api/admin/dashboard'),
    getAtRisk: () => api.get('/api/admin/at-risk'),
    getActivity: () => api.get('/api/admin/activity'),
    getStudentReport: () => api.get('/api/admin/reports/students'),
    getAuditLog: (params = '') => api.get(`/api/admin/audit-log?${params}`),
    createAuditLog: (data) => api.post('/api/admin/audit-log', data),
    getAnalyticsAttendance: () => api.get('/api/admin/analytics/attendance'),
    getAnalyticsPerformance: () => api.get('/api/admin/analytics/performance'),
    getAnalyticsPlacements: () => api.get('/api/admin/analytics/placements'),
    getAnalyticsDepartments: () => api.get('/api/admin/analytics/departments'),
    getSettings: () => api.get('/api/admin/settings'),
    updateSettings: (data) => api.put('/api/admin/settings', data),
};

// ═══════════════════════════════════════════════════════
//  SMARTBOARD NOTES
// ═══════════════════════════════════════════════════════

export const smartboardAPI = {
    upload: (formData) => {
        const token = getAccessToken();
        return fetch(`${API_BASE}/api/notes/smartboard`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData, // multipart/form-data — do NOT set Content-Type header
        }).then(res => {
            if (!res.ok) return res.json().then(e => { throw new Error(e.error || 'Upload failed') });
            return res.json();
        });
    },
    saveFromQr: (data) => api.post('/api/notes/smartboard/from-url', data),
    getAll: (params = '') => api.get(`/api/notes/smartboard${params ? `?${params}` : ''}`),
};

// ═══════════════════════════════════════════════════════
//  FACULTY
// ═══════════════════════════════════════════════════════

export const facultyAPI = {
    getMySchedule: (facultyId) => api.get(`/api/timetable/faculty/${facultyId}`),
    getMyAssignments: (facultyId) => api.get(`/api/assignments?facultyId=${facultyId}`),
    gradeSubmission: (submissionId, data) => api.put(`/api/submissions/${submissionId}/grade`, data),
};

// ═══════════════════════════════════════════════════════
//  PREDICTIONS (ML service via gateway proxy)
// ═══════════════════════════════════════════════════════
//
// All responses include `disclaimer: 'AI-generated — review before saving.'`
// and a `dataMode` field ('demo' | 'live' | 'demo-fallback'). Wrap UI output
// in <AIInsightBadge /> so users always see the disclosure.

export const predictionsAPI = {
    getDropoutRisk: (studentId) =>
        api.post('/api/predictions/predict/dropout', { student_id: studentId }),
    getPlacementProbability: (studentId) =>
        api.post('/api/predictions/predict/placement', { student_id: studentId }),
    // Admin-only: top-N at-risk students + placement funnel.
    // These hit admin-service which fans out to ml-service with the shared admin token.
    getAdminDropoutRisk: () => api.get('/api/admin/predictions/dropout-risk'),
    getAdminPlacementFunnel: () => api.get('/api/admin/predictions/placement-funnel'),
    health: () => api.get('/api/predictions/health'),
    getDataMode: () => api.get('/api/predictions/health/data-mode'),
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

export { setTokens, clearTokens, getAccessToken };
export default api;
