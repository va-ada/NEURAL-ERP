import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Eager-load the landing + login (first paint)
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

// Lazy-load the heavier scroll-presentation page (uses framer-motion)
const PresentationPage = lazy(() => import('./pages/PresentationPage'))

// Lazy-load everything behind auth
const StudentLayout = lazy(() => import('./layouts/StudentLayout'))
const StudentHome = lazy(() => import('./pages/student/StudentHome'))
const AttendancePage = lazy(() => import('./pages/student/AttendancePage'))
const TimetablePage = lazy(() => import('./pages/student/TimetablePage'))
const AssignmentsPage = lazy(() => import('./pages/student/AssignmentsPage'))
const GradesPage = lazy(() => import('./pages/student/GradesPage'))
const CareerPage = lazy(() => import('./pages/student/CareerPage'))
const NotesPage = lazy(() => import('./pages/student/NotesPage'))
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'))
const ExamsPage = lazy(() => import('./pages/student/ExamsPage'))
const FeesPage = lazy(() => import('./pages/student/FeesPage'))
const LibraryPage = lazy(() => import('./pages/student/LibraryPage'))
const ForumPage = lazy(() => import('./pages/student/ForumPage'))
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const FacultyLayout = lazy(() => import('./layouts/FacultyLayout'))
const FacultyHome = lazy(() => import('./pages/faculty/FacultyHome'))
const MarkAttendance = lazy(() => import('./pages/faculty/MarkAttendance'))
const GradeSubmissions = lazy(() => import('./pages/faculty/GradeSubmissions'))
const FacultyTimetable = lazy(() => import('./pages/faculty/FacultyTimetable'))
const FacultyProfile = lazy(() => import('./pages/faculty/FacultyProfile'))
const FacultySmartboardNotes = lazy(() => import('./pages/faculty/FacultySmartboardNotes'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary, #666)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        Loading...
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/presentation" element={<PresentationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="career" element={<CareerPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['FACULTY']}>
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyHome />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="assignments" element={<GradeSubmissions />} />
        <Route path="timetable" element={<FacultyTimetable />} />
        <Route path="smartboard" element={<FacultySmartboardNotes />} />
        <Route path="profile" element={<FacultyProfile />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}

export default App
