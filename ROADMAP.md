# ROADMAP — Neural ERP

The original launch task list lives at
[`docs/submission-materials/task.md`](./docs/submission-materials/task.md).
This file distils what was finished in the last sprint and what is queued next.

---

## Done in this sprint

- [x] **13 backend microservices** + an api-gateway, all running cleanly under
      `npm run dev` via `concurrently`.
- [x] **Python ML service (FastAPI + scikit-learn)** with two trained models:
      dropout risk (LR / GB picked by 5-fold CV ROC-AUC, achieved **0.9292**) and
      placement probability (RandomForest n=200, achieved **0.8008**).
- [x] **500-row deterministic synthetic dataset** (`np.random.seed(42)`) shipped
      so cloning the repo gives instant working AI without DB seeding.
- [x] **Demo↔Live data toggle** (`ML_DATA_MODE`) read per request — no restart
      needed. Falls back to demo and tags `dataMode: "demo-fallback"` if the DB
      is unreachable in live mode.
- [x] **Career recommendations** (`CAREER_AI_MODE=demo|live`) — Gemini 2.5 Flash
      with rule-based fallback so the demo works without an API key.
- [x] **AI transparency** — every prediction and recommendation carries the
      literal disclosure `"AI-generated — review before saving."` plus a Demo /
      Live source pill rendered by `<AIInsightBadge>`.
- [x] **Faculty role + dashboard** — full layout, today's classes, mark
      attendance, grade submissions, timetable, profile.
- [x] **Admin analytics** — attendance trends, grade distribution, placement
      funnel, department comparison, settings — all wired to real endpoints
      with mock fallback.
- [x] **Validators** on every mutating endpoint via shared `validateRequest`
      middleware (academic, attendance, grade, fee, assignment, career, notes,
      forum, library, notification, timetable, admin, auth).
- [x] **Audit log** — shared `auditLog()` utility writing on user registration,
      faculty CRUD, grade creation, attendance marking, refresh-reuse detection.
- [x] **Refresh-token rotation with reuse detection** — bcrypt-hashed at rest;
      reusing an old token revokes the entire family.
- [x] **Per-user rate limiting** — 100/min by user ID falling back to IP, on
      top of the 200/min global and 10/min auth limits in the gateway.
- [x] **Redis cache** — `cacheGet` / `cacheInvalidate` on departments / subjects /
      batches (600s), timetables (300s), admin dashboard (120s).
- [x] **Tests:** 132 Jest cases across 15 suites, 9 Vitest cases, 16 pytest
      cases. CI (GitHub Actions) runs all three in parallel.
- [x] **Docker:** per-service Dockerfiles, `docker-compose.yml` (dev),
      `docker-compose.prod.yml` (full prod with nginx).
- [x] **Standardised UI patterns** — `PageSkeleton`, `ErrorState` (with retry),
      `ToastContext`, `<AIInsightsCard>`, `NotFoundPage`, `ErrorBoundary`.
- [x] **Lazy-loaded routes** — main bundle 694KB → 269KB.
- [x] **Documentation** — `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `DEPLOY.md`,
      `ROADMAP.md` (this file), per-service READMEs.

---

## Next up — high impact (ranked)

### 1. Smart Board OCR pipeline

**Goal:** Faculty can stream their LG CreateBoard session into Neural ERP and
get searchable, indexed notes automatically attached to the right subject.

- Integrate **LG CreateBoard SDK** for screen capture / session export.
- Run captured frames through **Tesseract OCR** (or Google Cloud Vision if
  the institution opts in for higher accuracy).
- Store OCR text in the existing `SmartboardNote` Prisma model alongside the
  raw image.
- Index for full-text search via Postgres `tsvector` on the OCR text column.
- UI: `web/src/pages/student/NotesPage.jsx` — add a "Search board notes" input
  that hits `GET /api/notes/smartboard/search?q=...`.

**Dependencies:** LG SDK access, test hardware.
**Estimate:** 2–3 weeks after SDK access.

### 2. Real-time at-risk alert system

**Goal:** Catch dropout-risk and academic-risk students before the end of term.

- Cron job (node-cron in `notification-service`) runs nightly.
- Triggers: attendance < 75% in any month, CGPA drop > 0.5 in a semester,
  3+ overdue assignments, dropout-risk score > 0.6 from `ml-service`.
- Delivery: in-app notification + email to student + email to advisor / HOD.
- Pluggable SMS via Twilio (env-gated; degrades to email-only if absent).
- Admin dashboard widget surfacing the daily at-risk list with one-click
  "send check-in email" action (logged to AuditLog).

**Estimate:** 1.5–2 weeks.

### 3. Career field migration to proper Prisma enums

**Goal:** Type-safety + DB-level constraints on `CareerOpportunity.type`,
`CareerApplication.status`, `StudentSkill.proficiency`.

Currently these are free-form strings, validated only at the API layer.
Tighten to enums in `schema.prisma`, write a data migration script that
maps existing string values, update the validators, ship.

**Estimate:** 2–3 days. Strictly an internal refactor; no UI change.

### 4. Runtime ML data-mode toggle without restart

**Goal:** An admin UI toggle that flips `ML_DATA_MODE` between demo / live
without a deploy.

The ml-service already reads `ML_DATA_MODE` at request time, so the plumbing
is in place. What is missing:
- A `POST /admin/data-mode` endpoint on `ml-service` (admin-token guarded)
  that mutates an in-process variable shadowing the env var.
- An admin UI toggle in `AdminDashboard` that calls it via the gateway.
- A persistence layer (small JSON file or Redis key) so the override
  survives a restart.

**Estimate:** 3–4 days.

### 5. Mobile app (Expo)

**Goal:** Bring the gitignored `app/` (Expo / React Native) into the repo as
a third deliverable alongside the web app.

- Decide whether to keep it monorepo-internal (`app/` workspace) or in a
  sibling repo.
- Reuse `web/src/services/api.js` shape — keep token storage in
  `expo-secure-store` instead of `localStorage`.
- Push notifications via `expo-notifications` against the existing
  `notification-service`.
- Scope down for v1: student attendance, grades, assignments, fees, career.
  No faculty / admin surfaces on mobile.

**Estimate:** 3–4 weeks for the v1 student surface.

---

## Nice-to-have (not blocking anything)

- **Internationalisation (i18n).** `react-i18next` on the web; start with
  English + Hindi + Marathi. Server-side messages in the unified error
  envelope are already structured to support this.
- **Per-tenant theming.** Each institution can pick a primary colour and a
  logo URL; the `Institution.settings` JSON field is already there to hold it.
  Web reads it from the auth response and applies CSS custom properties.
- **WebSocket-driven attendance live updates.** Faculty marks attendance →
  enrolled students see a live update without refresh. socket.io or native
  WebSockets in the gateway, broadcast on a per-batch room.
- **Two-factor backup codes.** Single-use OTP fallback for users who lose
  email access.
- **OpenAPI / Swagger spec** generated per service. Right now the contract is
  documented per route in JSDoc — formalising it would help downstream
  integrations (mobile app, third-party LMS).
- **End-to-end Cypress / Playwright tests** for the critical flows (login →
  attendance → assignment submit). The unit + integration coverage is
  reasonable; what is missing is the cross-service smoke test.
- **Per-service distributed tracing** (OpenTelemetry → a hosted backend).
  The gateway already stamps `x-request-id` on every request and forwards
  it; tracing would give the visual graph.

---

## Things explicitly NOT planned

- A second ORM. Prisma stays.
- A frontend rewrite. React 19 + Vite is fine.
- A move to GraphQL. The REST surface is small and the audience benefits
  from JSON-with-OpenAPI more than from GraphQL.
- A move to Kubernetes. Single-VPS Docker Compose is the right level of
  ops for the user count this project will realistically see, and is
  documented in [DEPLOY.md](./DEPLOY.md). If the deployment story changes,
  k8s manifests are mechanical to add later.

---

## Tracking

When picking up an item from this list:
1. Open an issue / PR against the relevant subsection here.
2. Update [`docs/submission-materials/task.md`](./docs/submission-materials/task.md)
   if the work touches a Phase 1–6 commitment.
3. Strike through the line in this file when shipped (don't delete — the
   archaeology is useful).

---

See also: [README.md](./README.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) ·
[CLAUDE.md](./CLAUDE.md) · [DEPLOY.md](./DEPLOY.md).
