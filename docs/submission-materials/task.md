# Neural ERP — Launch Completion Task List

**Goal:** Ship the web application to production-ready state.  
**Scope:** Web only (no mobile app). No Smart Board OCR (plan only). Predictive ML deferred (plan only).  
**Date:** 2026-04-10

---

## Status Legend

- [ ] Not started
- [x] Done
- [~] Partial / needs work

---

## Phase 1 — Critical Bugs & Broken Code

These must be fixed before anything else.

### 1.1 TimetableBuilder.jsx — Undefined `res` variable (BUG)
- **File:** `web/src/pages/TimetableBuilder.jsx`
- **Issue:** Around line 206, `conflictsData = Array.isArray(res) ? res : ...` references `res` which is never defined in that scope. Should be the result of the `checkConflicts` API call. Same issue at line ~238 with `if (res && (res.slots || res.data?.slots))`.
- **Fix:** Replace `res` with the actual variable holding the API response.
- [x] Fix conflict detection response handling
- [x] Fix timetable save response handling
- [x] Also fixed AM/PM labels on time slots
- [ ] Test both flows end-to-end

### 1.2 Security — Exposed API Key in `.env`
- **File:** `backend/.env` line 55
- **Issue:** `GEMINI_API_KEY=<REDACTED — was a real key, has been rotated>` was hardcoded historically. Key has been scrubbed; new keys live in `.env.local` (gitignored).
- [ ] Rotate the Gemini API key in Google Cloud Console (manual — do this yourself)
- [x] Add `.env` to `.gitignore`
- [x] Create `.env.example` with placeholder values
- [x] Ensure `client_secret_*.json` (root dir) is gitignored (added to root .gitignore)

### 1.3 Security — Hardcoded JWT Secrets
- **File:** `backend/.env` lines 5-6
- **Issue:** `JWT_SECRET=your-super-secret-jwt-key-change-in-production` is a placeholder. For production, generate real 256-bit random secrets.
- [ ] Generate production-grade JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Document secret rotation procedure

### 1.4 Missing Backend Dependency — `@google/genai`
- **File:** `backend/package.json`
- **Issue:** Career service uses `@google/genai` (Gemini SDK) but it's not listed in package.json dependencies. Service will crash on fresh install.
- [x] Verified: `@google/genai` is in career-service/package.json (workspace handles it)
- [x] Added `ioredis` to root backend/package.json

---

## Phase 2 — Backend Completeness

### 2.1 Admin Analytics API — Currently Stub
- **File:** `backend/services/admin-service/src/controllers/admin.controller.js`
- **Issue:** Admin dashboard's Analytics tab shows mock data. No backend aggregation queries exist.
- [x] Add `GET /api/admin/analytics/attendance` — attendance trends per dept/batch (last 6 months)
- [x] Add `GET /api/admin/analytics/performance` — grade distribution per dept, avg CGPA trends
- [x] Add `GET /api/admin/analytics/placements` — placement funnel (applied → interview → offered → accepted)
- [x] Add `GET /api/admin/analytics/departments` — dept comparison (students, avg CGPA, attendance, placement rate)

### 2.2 Placements Backend — No Dedicated Endpoints
- **Issue:** Admin "Placements" tab exists in UI but uses mock data. Career service handles student-facing placements but admin needs aggregate views.
- [x] Placement stats covered by `GET /api/admin/analytics/placements` (funnel + company breakdown)
- [x] Wired into AdminDashboard Placements tab via live data with mock fallback

### 2.3 Audit Log Population
- **File:** `backend/services/*/src/controllers/*.js`
- **Issue:** AuditLog model exists in schema but only the admin service creates logs via explicit API call. Other services (auth, academic, attendance, etc.) don't write audit logs on CRUD operations.
- [x] Created shared `auditLog()` utility in `backend/shared/utils/auditLog.js`
- [x] Added audit logging to: user registration, faculty CRUD, grade creation, attendance marking
- [x] Audit logs capture userId, action, entity, entityId, and details

### 2.4 Redis Caching — Exists but Unused
- **File:** `backend/shared/utils/redis.js` — Redis client is initialized but no service uses it.
- [x] Created `shared/utils/cache.js` with `cacheGet` and `cacheInvalidate` helpers
- [x] Cached: departments, subjects, batches (600s TTL), timetables (300s), admin dashboard (120s)
- [x] Cache invalidation on all create/update/delete operations

### 2.5 Faculty Dashboard / Layout
- **Issue:** Routes exist for ADMIN and STUDENT roles, but there is no FACULTY role routing or dashboard. Faculty can't log in and see their classes, mark attendance, grade assignments, etc.
- [x] Created `FacultyLayout.jsx` with sidebar navigation
- [x] Created `FacultyHome.jsx` — dashboard with today's classes, stats, quick actions
- [x] Created `MarkAttendance.jsx` — batch/subject selector, student list with P/A/L toggles
- [x] Created `GradeSubmissions.jsx` — assignment selector, marks/feedback per submission
- [x] Created `FacultyTimetable.jsx` — day-by-day schedule view
- [x] Created `FacultyProfile.jsx` — profile with editable contact form
- [x] Added `/faculty/*` routes to `App.jsx` with ProtectedRoute
- [x] Added FACULTY mock user to AuthContext + login redirect
- [x] Added `facultyAPI` to api.js

### 2.6 Database Seed — Verify Completeness
- **File:** `backend/database/seed.js`
- [x] Verified: seed creates all models (institution, depts, batches, faculty, students, subjects, assignments, grades, fees, library, forum, etc.)
- [x] Fixed: 4 mock student emails + 1 mock faculty email now explicitly created in seed
- [x] Reserved mock emails in `usedEmails` set to prevent collisions

---

## Phase 3 — Frontend Completeness

### 3.1 AdminDashboard — Wire Mock Tabs to Real APIs
- **File:** `web/src/pages/AdminDashboard.jsx` (4,297 lines — should be split)
- **Issue:** Analytics, Placements, Reports, and Settings tabs use mock/hardcoded data.
- [x] Wire Analytics tab to `GET /api/admin/analytics/*` endpoints
- [x] Wire Placements tab to real placement data with mock fallback
- [x] Wire Reports tab — CSV export helper created, all 4 export buttons functional
- [x] Wire Settings tab — backend endpoint created (GET/PUT `/api/admin/settings`), form loads/saves institution data
- [x] Split AdminDashboard.jsx into 9 tab components in `web/src/pages/admin/` (1043 → 320 lines)

### 3.2 Admin — Student Detail View
- **Issue:** Admin can see student list but "View Profile" needs to show complete student data (attendance, grades, assignments, career) in one place.
- [x] Student detail view shows: info, attendance, CGPA, assignments, career score, status badge
- [x] Add ability to edit student info — backend PUT `/api/students/:id/profile` + ProfilePage wired to real API

### 3.3 Error Handling & Loading States
- **Issue:** Pages have inconsistent error/loading patterns. Some show skeleton, some show nothing.
- [x] Standardize loading skeleton — PageSkeleton component used in StudentHome, Attendance, Grades, Career pages
- [x] Standardize error states — ErrorState.jsx component with meaningful messages
- [x] Add retry buttons on API failure states (ErrorState has onRetry prop)

### 3.4 Toast Notifications
- **File:** `web/src/context/ToastContext.jsx`
- [x] Verified: toast used in 17 files — all key pages have showToast on actions
- [x] Covers: assignments, attendance, grades, fees, notes, forum, library, profile, admin CRUD, faculty actions

### 3.5 Responsive Design Audit
- [x] Dashboard.css: responsive grid at 768px (1-col grid, 2-col stats) and 480px (1-col stats, stacked header)
- [x] TimetableBuilder: already has overflow-x: auto with min-width: 800px
- [x] Sidebar collapses with hamburger menu on mobile (already implemented)

### 3.6 Profile Page — Avatar Upload
- **File:** `web/src/pages/student/ProfilePage.jsx`
- **Issue:** Avatar shows initials with color. Avatar customization (color picker) may not be fully wired.
- [x] Avatar color/initial changes persist via PUT `/api/students/:id/profile`
- [x] Profile edit form wired to real API with toast feedback

---

## Phase 4 — Production Hardening

### 4.1 Environment Configuration
- [x] `.env.example` created for backend and web
- [ ] Create `backend/.env.production` with actual production secrets (manual step)
- [ ] Configure CORS for production domain once known

### 4.2 API Rate Limiting
- **File:** `backend/api-gateway/src/index.js` line 46
- **Issue:** Current rate limit is 200 req/min globally. Too loose for auth endpoints, too tight for read-heavy pages.
- [x] Added strict auth limiter: 10 req/min per IP on `/api/auth/*`
- [x] Global limiter remains at 200/min for other routes
- [x] Added per-user rate limiting: 100 req/min by user ID (falls back to IP)

### 4.3 Input Validation
- **Issue:** Only auth service has validators (`auth.validators.js`). Other services trust input blindly.
- [x] Created validators for attendance (bulk records), grade, fee (create + pay), assignment services
- [x] All validators use express-validator with UUID, enum, type, and range checks
- [x] Wired into routes with validateRequest middleware

### 4.4 HTTPS & Security Headers
- [x] Helmet already configured in API gateway
- [x] No cookies used — JWT in localStorage + Authorization header
- [ ] Add Content Security Policy headers (configure once domain is finalized)
- [ ] Configure CORS to only allow production frontend domain

### 4.5 Database Backups
- [x] Created `backend/scripts/backup.sh` — pg_dump with gzip, 30-backup retention
- [x] Health check aggregator already added (`/health/services`)
- [x] Document restore procedure in README (backup & restore section added)

### 4.6 Logging & Monitoring
- [x] Added `requestLogger(serviceName)` middleware — logs method, path, status, duration, IP
- [x] Integrated into auth-service, academic-service, fee-service
- [x] Log rotation: maxsize 20MB, maxFiles 14 days
- [x] Added 5xx error alerting — critical log file + optional webhook via ERROR_WEBHOOK_URL

### 4.7 Build & Deploy Pipeline
- [x] `docker-compose.prod.yml` created with nginx reverse proxy + resource limits
- [x] `nginx.conf` created — SPA serving + API proxy
- [x] `start.sh` updated — loads .env, runs prisma generate + migrate before starting
- [x] `/health/services` endpoint aggregator (gateway pings all 13 services)
- [x] Document full deploy steps in README (deployment section with prerequisites, setup, Docker, health check)

---

## Phase 5 — Testing

### 5.1 Backend Tests (49 passing)
- [x] Gateway configuration: all 13 services + 20 API paths verified
- [x] Prisma schema: all 31 models + 11 enums verified
- [x] Shared utilities: auditLog, cache, auth middleware, error handler verified
- [ ] Auth service: login, OTP verify, token refresh, password reset (needs running DB)
- [ ] Integration tests with seeded DB (needs running services)

### 5.2 Frontend Tests (9 passing)
- [x] Vitest + React Testing Library + jsdom configured
- [x] App routing: landing, login, auth redirect, 404 verified
- [x] API module: all exports verified (authAPI, attendanceAPI, gradeAPI, careerAPI, adminAPI)
- [ ] Component-level tests: StudentHome, AttendancePage, CareerPage (needs mocking setup)

### 5.3 Integration Tests
- [ ] Full flow: register → login → OTP → view attendance → submit assignment (needs running stack)
- [ ] Admin flow: login → view dashboard → create announcement → view audit log
- [ ] API gateway: verify all 13 service proxies route correctly

---

## Phase 6 — UX Polish

### 6.1 Landing Page
- [x] Demo request form wired to mailto: link (opens email client with pre-filled fields)
- [ ] Add testimonials section (if real ones exist)
- [ ] Optimize images (compress, use WebP)
- [x] Meta tags already in index.html (title, description, theme-color)

### 6.2 Login Page
- [x] Added "Remember me" checkbox — unchecked uses sessionStorage (session-only), checked uses localStorage (persistent)
- [x] Added password visibility toggle (eye/eye-off SVG icons)
- [x] OTP input: added `inputMode="numeric"`, `autoComplete="one-time-code"`, `aria-label`
- [x] Added `autoComplete` attributes to email and password inputs

### 6.3 404 / Error Pages
- [x] Created NotFoundPage.jsx with clean 404 UI
- [x] Added catch-all `<Route path="*">` in App.jsx
- [x] ErrorBoundary already wraps App in main.jsx (verified)

### 6.4 Accessibility
- [x] Added `aria-label` to hamburger, theme toggle, logout buttons (StudentLayout + FacultyLayout)
- [x] Added `role="navigation"` and `aria-label` to sidebar nav
- [x] Added `aria-live="polite"` to login messages, `role="alert"` to errors
- [x] Added skip-to-content link on LandingPage with CSS
- [ ] Check color contrast ratios in both light and dark mode (manual audit)

### 6.5 Performance
- [x] All route-level pages lazy-loaded with React.lazy + Suspense (bundle: 694KB → 269KB main chunk)
- [x] AdminDashboard lazy-loaded as separate 54KB chunk
- [x] Add pagination to large lists (forum posts 10/page, notifications 20/page, audit logs 25/page)

---

## Phase 7 — Deferred Features (Plan Only)

### 7.1 Smart Board Integration (LG CreateBoard)
**Plan — do not implement now:**
1. LG CreateBoard Share app handles screen sharing/casting natively
2. Integration approach:
   - Faculty starts a class session in Neural ERP → generates a session code
   - CreateBoard Share streams the board to students' devices via LG's SDK
   - Neural ERP captures session recordings (screen capture API or LG's export)
   - Recordings stored in Notes module, tagged by subject/date
   - OCR pipeline (future): Google Cloud Vision API or Tesseract on exported images → searchable text → stored in Notes
3. **Dependencies:** LG CreateBoard SDK/API documentation, test hardware access
4. **Estimate:** 2-3 weeks after SDK access

### 7.2 Predictive ML Pipeline
**Plan — do not implement now:**
1. **Dropout Risk Prediction**
   - Model: Logistic regression or gradient boosting (XGBoost)
   - Features: attendance % (last 3 months), grade trend (declining CGPA), assignment completion rate, fee payment status
   - Training data: historical student records (need 2+ years of data)
   - Output: risk score 0-100, threshold alerts at 60+ (warning) and 80+ (critical)
   - Integration: New `/api/admin/predictions/dropout-risk` endpoint, surfaced in Admin Analytics tab
2. **Placement Probability**
   - Model: Random forest classifier
   - Features: CGPA, skills count, internship count, career score, department, projects
   - Training data: past placement outcomes (placed vs not placed)
   - Output: probability %, top contributing factors
   - Integration: Shown on student CareerPage and Admin Placements tab
3. **Real-Time Alert System**
   - Triggers: attendance drops below 75% in any month, CGPA drops >0.5 in a semester, 3+ overdue assignments
   - Delivery: in-app notification + email to student + alert to advisor/HOD
   - Integration: Cron job runs nightly, uses notification service
4. **Tech stack:** Python (scikit-learn or XGBoost), served via FastAPI microservice on port 3014, called by admin-service
5. **Data requirement:** Minimum 500 student-semester records for meaningful training
6. **Estimate:** 3-4 weeks (model dev + API + frontend integration)

---

## Priority Order for Execution

| Order | Phase | What | Why |
|-------|-------|------|-----|
| 1 | 1.1-1.4 | Critical bugs & security | App crashes or leaks keys without these |
| 2 | 2.5 | Faculty dashboard | Major missing role — faculty can't use the system |
| 3 | 2.1-2.4 | Backend completeness | Admin dashboard needs real data, not mocks |
| 4 | 3.1-3.6 | Frontend wiring | Connect UI to real APIs |
| 5 | 5.1-5.3 | Testing | Verify everything works before hardening |
| 6 | 4.1-4.7 | Production hardening | Security, performance, deployment |
| 7 | 6.1-6.5 | UX polish | Final touches before launch |
| 8 | 7.1-7.2 | Deferred features | Post-launch roadmap |

---

## Files to Create

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template env file without secrets |
| `backend/.gitignore` | Ensure .env, node_modules, prisma client are excluded |
| `web/.env.example` | Template with VITE_API_URL |
| `web/src/pages/faculty/FacultyHome.jsx` | Faculty dashboard |
| `web/src/pages/faculty/MarkAttendance.jsx` | Faculty marks attendance |
| `web/src/pages/faculty/GradeSubmissions.jsx` | Faculty grades assignments |
| `web/src/layouts/FacultyLayout.jsx` | Faculty sidebar + layout |
| `web/src/pages/NotFoundPage.jsx` | 404 page |
| `backend/services/admin-service/src/controllers/analytics.controller.js` | Analytics endpoints |
| `backend/services/admin-service/src/routes/analytics.routes.js` | Analytics routes |
| `backend/shared/utils/auditLog.js` | Shared audit logging utility |

---

**Total estimated work:** ~3-4 weeks for Phases 1-6 (one developer, full-time).  
**MVP shippable after:** Phase 4 (security + deploy) — roughly 2 weeks.
