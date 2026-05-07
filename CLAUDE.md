# CLAUDE.md — Neural ERP codebase guide

> Project-scoped contract for any AI agent (or human) editing this repo. The
> global `~/Desktop/CLAUDE.md` still applies; this file specialises it for
> Neural ERP's structure, conventions, and gotchas.

---

## Codebase layout

```
neural-erp/
├── backend/
│   ├── api-gateway/                  Express gateway. Proxies /api/<svc>/* to the right service.
│   │                                 Owns rate limiting, request-id, CORS, helmet, /health/services.
│   ├── services/
│   │   ├── auth-service/             JWT + OTP + refresh rotation. THE auth boundary.
│   │   ├── academic-service/         Departments, subjects, batches.
│   │   ├── attendance-service/       Marks, queries, bulk inserts.
│   │   ├── timetable-service/        Slot generation, conflict detection.
│   │   ├── assignment-service/       Assignments + submissions.
│   │   ├── grade-service/            Grades, semester results, exams.
│   │   ├── career-service/           Opportunities, applications, skills, AI recommendations.
│   │   ├── notes-service/            Folders, notes, sharing, smartboard imports.
│   │   ├── fee-service/              Fees + payments.
│   │   ├── library-service/          Books + issues.
│   │   ├── forum-service/            Posts + replies.
│   │   ├── notification-service/     Notifications + announcements.
│   │   ├── admin-service/            Aggregate analytics, settings, audit-log API, predictions proxy.
│   │   └── ml-service/               Python 3.11 + FastAPI + scikit-learn.
│   ├── shared/
│   │   ├── bootstrap/createApp.js    The express boilerplate every Node service wraps with.
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    `authenticate`, `authorize(...roles)` — JWT-aware.
│   │   │   ├── validate.js           `validateRequest` — express-validator → 422 envelope.
│   │   │   └── errorHandler.js       Unified error envelope, AppError class.
│   │   └── utils/
│   │       ├── prisma.js             Singleton Prisma client.
│   │       ├── logger.js             Winston JSON, rotated 20MB / 14 days.
│   │       ├── auditLog.js           Fire-and-forget audit writer. Failures NEVER propagate.
│   │       ├── cache.js              cacheGet / cacheInvalidate (Redis).
│   │       ├── redis.js              Singleton ioredis client.
│   │       ├── env.js                loadEnv + requireEnv (every service boots through this).
│   │       ├── errorAlert.js         5xx alert middleware + optional ERROR_WEBHOOK_URL.
│   │       ├── mailer.js             Nodemailer wrapper used for OTP + reset emails.
│   │       ├── rateLimiter.js        Per-user limiter shared across services.
│   │       └── s3.js                 (Stub — not currently wired up.)
│   ├── database/
│   │   ├── prisma/schema.prisma      Single source of truth for all 31 models + 11 enums.
│   │   └── seed.js                   `npm run db:seed` — full demo dataset.
│   ├── tests/                        Jest + supertest. 15 suites, 132 cases.
│   ├── docker-compose.yml            Dev — only datastores + ml-service.
│   ├── docker-compose.prod.yml       Prod — every service + nginx.
│   ├── nginx.conf                    SPA + /api proxy.
│   └── start.sh                      Entrypoint for prod containers.
├── web/
│   ├── src/
│   │   ├── pages/                    student/, faculty/, admin/, landing/, …
│   │   ├── layouts/                  StudentLayout, FacultyLayout, AdminLayout
│   │   ├── components/               AIInsightsCard, AIInsightBadge, ErrorState, Modal, Skeleton
│   │   ├── context/                  AuthContext, ThemeContext, ToastContext
│   │   ├── services/                 api.js (axios + token mgmt), logger.js
│   │   └── __tests__/                Vitest specs
│   └── netlify.toml                  SPA fallback + security headers
├── docs/submission-materials/        College submission artefacts (PDF, speech, etc.)
├── DEPLOY.md                         How to deploy (Docker, Render, single VPS).
├── ARCHITECTURE.md                   Sequence diagrams + design notes.
├── ROADMAP.md                        Done / Next up / Nice-to-have.
└── .github/workflows/ci.yml          Parallel CI for backend / web / ml-service.
```

---

## Conventions

Match what is already in the file you are editing. Specifically:

### Backend (Node)
- **Indent: 4 spaces.** No tabs. Don't reformat existing files — only the lines you touched.
- **Quotes: single quotes** (`'...'`). Use template literals for interpolation.
- **Semicolons: yes.** Every statement ends with one.
- **CommonJS.** `require` / `module.exports`. The repo is Node 20 but stays on CJS for Prisma compatibility and to keep Jest config simple.
- **Async/await.** Never raw `.then()`. Always `try/catch` with `next(err)` in Express handlers.
- **Error envelope.** Throw `new AppError(message, statusCode, code)` — the global error handler turns it into the unified JSON envelope. Don't `res.status(...).send(...)` directly for errors.
- **Response shape.** Successful responses are `{ data: {...} }` (most newer endpoints) or just `{...}` (older). When adding a new endpoint, prefer `{ data: ... }`.
- **Imports of shared code.** Use the relative path `../../../../shared/...` (4 dots up from a controller, 3 from `src/index.js`). There is no path alias.

### Backend (Python — ml-service)
- **PEP 8, type hints everywhere.** Signature: `def foo(x: int) -> str:`.
- **f-strings** for formatting. Never `%` or `.format()`.
- **`pathlib`** for paths.
- **Pydantic 2** for request/response models.
- **scikit-learn pipelines** — preprocessing belongs inside the `Pipeline`, never in the handler.

### Web (React)
- **Indent: 2 spaces.**
- **Quotes:** match existing file (`'` preferred).
- **JSX:** functional components only. Hooks. No class components.
- **Routing:** React Router 7. Lazy-load every page-level route via `React.lazy` + `<Suspense>`.
- **Styling:** plain CSS modules colocated next to the component (e.g. `LoginPage.css`). No CSS-in-JS, no Tailwind.
- **State:** Context for auth/theme/toast; component-local `useState` for everything else. No Redux.
- **API calls:** always go through `web/src/services/api.js`. Don't sprinkle raw `fetch` across components.

### Naming
- File names: `kebab-case.js` for backend (`auth.controller.js`, `attendance.validators.js`), `PascalCase.jsx` for React components, `camelCase.js` for utilities.
- Exports: named exports for utilities; default export only for React components and `module.exports = router` in Express routes.

---

## How to run tests

```bash
# Backend (Jest + supertest) — 132 cases across 15 suites
cd backend && npm test

# Web (Vitest + Testing Library) — 9 cases
cd web && npm test

# ML service (pytest) — 16 cases
cd backend/services/ml-service && source venv/bin/activate && pytest -q
```

CI runs all three in parallel on every push to `main` / `develop` and every PR.

---

## How to add a new microservice

Follow the existing pattern exactly. Skipping a step breaks the gateway proxy.

1. **Pick a port.** Add `<NAME>_SERVICE_PORT=<port>` and `<NAME>_SERVICE_URL=http://localhost:<port>` to `backend/.env.example`. Use the next free port after 3014.
2. **Scaffold the directory.** Copy an existing simple service (e.g. `library-service`):
   ```
   services/<name>-service/
   ├── package.json
   ├── Dockerfile
   └── src/
       ├── index.js
       ├── controllers/<name>.controller.js
       ├── routes/<name>.routes.js
       └── validators/<name>.validators.js
   ```
3. **Wire `src/index.js`** with `createApp` from `shared/bootstrap`:
   ```js
   const { createApp, startApp } = require('../../../shared/bootstrap/createApp');
   const routes = require('./routes/<name>.routes');
   const serviceName = '<name>-service';
   const port = process.env.<NAME>_SERVICE_PORT || <port>;
   const app = createApp({ serviceName, port, registerRoutes: (a) => a.use('/api/<name>', routes) });
   startApp(app, { serviceName, port });
   ```
4. **Add it to npm workspaces.** Already covered by `services/*` glob — but you must add the `dev` invocation to the root `backend/package.json` `dev` script so `concurrently` boots it.
5. **Wire the gateway.** Add to `SERVICES` map in `backend/api-gateway/src/index.js` and to the proxy registration list further down.
6. **Wire docker-compose.** Add a service block to both `backend/docker-compose.yml` (dev — usually you do *not* need this for Node services since they run on host) and `backend/docker-compose.prod.yml` (prod — required, build from source, set env vars).
7. **Add Prisma models** if needed — edit `backend/database/prisma/schema.prisma`, then `npm run db:migrate` to create a migration.
8. **Tests.** Add a Jest suite under `backend/tests/` exercising the validators and at least one happy-path / failure-path pair through `supertest`.

---

## How to add a validator to an existing service

Reference: `backend/services/auth-service/src/validators/auth.validators.js` and how it's wired in `backend/services/auth-service/src/routes/auth.routes.js`.

1. Open or create `services/<svc>/src/validators/<thing>.validators.js`.
2. Export an array of express-validator chains:
   ```js
   const { body, param } = require('express-validator');
   exports.createThingValidation = [
       body('name').isString().trim().notEmpty().withMessage('name is required'),
       body('count').isInt({ min: 0, max: 1000 }).withMessage('count must be 0..1000'),
       param('id').optional().isUUID().withMessage('id must be a UUID'),
   ];
   ```
3. In the route file, place `validateRequest` *between* the validation array and the handler:
   ```js
   const { validateRequest } = require('../../../../shared/middleware/validate');
   const { createThingValidation } = require('../validators/thing.validators');
   router.post('/', createThingValidation, validateRequest, controller.createThing);
   ```
4. Add a Jest suite under `backend/tests/` that POSTs invalid bodies through supertest and asserts the 422 envelope shape (`error.code === 'VALIDATION_ERROR'`, `error.details.fields[0].field`).

**Why this matters:** the unified 422 envelope is what the web client parses to surface inline field errors. Custom error shapes break the UX.

---

## How to add an audit-log call

Reference: `backend/services/auth-service/src/controllers/auth.controller.js` (look for `await auditLog(...)`).

```js
const auditLog = require('../../../../shared/utils/auditLog');

// inside a controller, after a successful mutation:
await auditLog(req.user?.id, 'CREATE', 'Thing', thing.id, { name, count });
```

Rules:
- `userId` may be `null` for anonymous events — the helper short-circuits since the schema requires it.
- `action` is a free-form string convention: `CREATE` / `UPDATE` / `DELETE` / `LOGIN_SUCCESS` / `LOGIN_FAILED` / `REFRESH_REUSE_DETECTED` / etc. Be consistent with neighbouring code.
- `details` accepts an object (auto JSON-stringified) or a string. Don't put PII or tokens in here.
- The call is fire-and-forget — never `await` it inside a transaction or block the user-visible response on it.

---

## How AI features work

### 1. Career recommendations (`career-service`)

Toggle: `CAREER_AI_MODE=demo` (default — rule-based, no API key) or `live` (Gemini 2.5 Flash via `@google/genai`).

- Demo: scoring rules over `CareerOpportunity` rows + the student's CGPA / skills / department.
- Live: builds a structured prompt, calls Gemini, validates the JSON response, falls back to demo on any error and surfaces `aiSource: "fallback"` so the UI can label it.
- Every response carries the AI disclaimer string `'AI-generated — review before saving.'`.

### 2. Predictions (`ml-service`, FastAPI on :3014)

Toggle: `ML_DATA_MODE=demo` (default — synthetic CSV) or `live` (Postgres feature assembly).

- The mode is read **per request** at the top of each handler, so flipping the env var doesn't require a restart.
- Demo: loads `data/synthetic_v1.csv` (500 rows, seed=42) and serves a model trained on it.
- Live: SQLAlchemy assembles features from real Postgres rows. If `DATABASE_URL` is unset/unreachable, falls back to demo and tags the response `dataMode: "demo-fallback"`.
- Models persist as joblib files in `models/` (`dropout_v1.joblib`, `placement_v1.joblib`). They auto-train on first request if missing.

### Wiring a new prediction

1. Add fields to `NUMERIC_FEATURES` / `CATEGORICAL_FEATURES` in `src/models/train.py`.
2. Re-run training: `python -c "from src.models.train import train_all; print(train_all())"` (or hit `POST /train` with `X-ML-Admin-Token`).
3. Add a Pydantic schema in `src/routers/predict.py` and a handler that calls `predict.run(...)` with the new feature dict.
4. Surface in the web UI via `web/src/services/api.js` and an `<AIInsightsCard>` showing the AI disclaimer pill.

### What the Demo/Live pill is for

Reviewers and recruiters can see immediately whether the prediction came from synthetic data (Demo) or live Postgres rows (Live). It is rendered by `<AIInsightBadge>` from the `dataMode` field of every prediction response. **Don't strip this** — transparency is a feature, not a bug.

---

## Things to NOT do

- **Don't commit `.env`.** It is gitignored. Real secrets live in `.env.local` (also gitignored). The committed `.env.example` has placeholders only.
- **Don't bypass `validateRequest`.** Every mutating endpoint must run validators before the controller. If you find a route without them, fix it — don't add another.
- **Don't add new top-level dependencies casually.** The root `backend/package.json` lists shared deps; service-specific deps go in `services/<name>/package.json`. New deps need a justification (size, maintenance, license).
- **Don't introduce a new ORM.** Prisma is the law. If a query is awkward, use `prisma.$queryRaw` — don't reach for Knex / TypeORM / Sequelize / Mongoose-for-Postgres.
- **Don't introduce a new logger.** Winston via `shared/utils/logger.js` is the law. Don't `console.log` in production code (a few `console.log`s in seed scripts and dev-only paths are tolerated).
- **Don't skip `auditLog`** on a mutation that affects another user (grade changes, attendance edits, fee waivers, faculty CRUD, role changes). If the action would matter in a "who did this?" investigation, log it.
- **Don't leak the Gemini API key.** It was scrubbed from history; don't paste a real key into any committed file. The career-service gracefully handles a missing key.
- **Don't strip the AI disclaimer.** Every AI surface must show `'AI-generated — review before saving.'` and the Demo/Live source pill. This is a Step-0 requirement from the global `~/Desktop/CLAUDE.md`.
- **Don't fabricate test results.** If a test is flaky or skipped, mark it with `it.skip` and explain why in a comment. Don't silently delete failing assertions.
- **Don't inline-style.** No `style={{ ... }}` in React unless you genuinely cannot express it in a stylesheet.
- **Don't break the unified error envelope.** All errors should flow through `AppError` → the global error handler. The web client parses one shape; surprise it and the UX breaks silently.
- **Don't auto-format the whole file.** Editors and AI agents both love to "fix" trailing whitespace and quote style across an entire file. Touch only the lines your change requires.

---

## When in doubt

1. Read 3–5 nearby files in the same service before writing anything.
2. If the convention is genuinely unclear, ask in PR review — don't invent a new one.
3. Keep changes minimal. The smallest possible diff that solves the problem is the right diff.

---

## See also

- [README.md](./README.md) — outward-facing project overview.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — sequence diagrams and design rationale.
- [DEPLOY.md](./DEPLOY.md) — every supported deployment path.
- [ROADMAP.md](./ROADMAP.md) — what's done and what's next.
- Global agent contract: `~/Desktop/CLAUDE.md`.
