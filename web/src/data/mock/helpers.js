// ============================================================
// Auth + lookup helpers (operate on the in-memory mock data)
// ============================================================

import { students } from './students.js'
import { admins } from './admins.js'

export function authenticate(email, password) {
    for (const student of Object.values(students)) {
        if (student.email === email && student.password === password) {
            return { user: student, role: 'student' }
        }
    }
    for (const admin of Object.values(admins)) {
        if (admin.email === email && admin.password === password) {
            return { user: admin, role: 'admin' }
        }
    }
    return null
}

export function getStudent(id) {
    return students[id] || null
}

export function getAllStudents() {
    return Object.values(students)
}
