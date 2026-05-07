# Neural ERP — Backend

Multi-tenant ERP backend built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**, organized as 13 microservices behind an API Gateway.

## Architecture

```
Client (:5173) → API Gateway (:3000) → Microservices (:3001–3013) → PostgreSQL
```

| Service | Port | Routes |
|---------|------|--------|
| **API Gateway** | 3000 | Proxy to all services |
| Auth | 3001 | `/api/auth`, `/api/users` |
| Academic | 3002 | `/api/students`, `/api/faculty`, `/api/departments`, `/api/subjects`, `/api/batches` |
| Attendance | 3003 | `/api/attendance` |
| Timetable | 3004 | `/api/timetable` |
| Assignment | 3005 | `/api/assignments`, `/api/submissions` |
| Grade | 3006 | `/api/grades`, `/api/exams` |
| Career | 3007 | `/api/career` |
| Notes | 3008 | `/api/notes` |
| Fee | 3009 | `/api/fees` |
| Library | 3010 | `/api/library` |
| Forum | 3011 | `/api/forum` |
| Notification | 3012 | `/api/notifications`, `/api/announcements` |
| Admin | 3013 | `/api/admin` |

## Tech Stack

- **Runtime**: Node.js + Express
- **ORM**: Prisma 5 (PostgreSQL)
- **Auth**: JWT (access + refresh) + bcrypt + 2FA via email OTP
- **Gateway**: http-proxy-middleware + helmet + rate-limiting
- **Email**: Nodemailer (SMTP)
- **File Storage**: AWS S3 (assignments)
- **Logging**: Winston
- **Monorepo**: npm workspaces
- **Infra**: Docker Compose (PostgreSQL, MongoDB, Redis)

## Prerequisites

- **Node.js** ≥ 18
- **Docker & Docker Compose** (for PostgreSQL, MongoDB, Redis)
- **npm** ≥ 8

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
cp .env.local.example .env.local
```

`.env` holds shared dev defaults and is safe to share.
`.env.local` holds real secrets (API keys, SMTP creds) and is **gitignored**.
Both are loaded at service boot — values in `.env.local` take precedence.

Generate fresh JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Services will refuse to start if a required variable is missing or still looks
like a placeholder (e.g. `your-super-secret-...`, `CHANGE_ME`).

### 3. Start infrastructure (PostgreSQL, MongoDB, Redis)

```bash
npm run docker:up
# Or: docker-compose up -d
```

### 4. Run database migrations & seed

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Populate with sample data
```

### 5. Start all services

```bash
npm run dev
# Starts API Gateway + all 13 services concurrently
```

The API Gateway will be available at `http://localhost:3000`.

### Health Check

```bash
curl http://localhost:3000/health
```

## Project Structure

```
backend/
├── api-gateway/          # Express proxy (port 3000)
│   └── src/index.js
├── services/
│   ├── auth-service/     # Authentication & user management
│   ├── academic-service/ # Students, faculty, departments, subjects, batches
│   ├── attendance-service/
│   ├── timetable-service/
│   ├── assignment-service/  # Includes S3 file uploads
│   ├── grade-service/       # Grades + exams
│   ├── career-service/      # Opportunities, events, applications, skills
│   ├── notes-service/       # Folders, notes, bookmarks, sharing
│   ├── fee-service/         # Fees & payments
│   ├── library-service/     # Books, issue/return, fines
│   ├── forum-service/       # Posts, replies, likes
│   ├── notification-service/ # Notifications + announcements
│   └── admin-service/       # Dashboard, reports, audit logs
├── shared/
│   ├── bootstrap/         # createApp, startApp — one-line service boot
│   ├── http/              # response helpers (ok, created, paginated)
│   ├── middleware/        # auth, errorHandler, validate
│   └── utils/             # env, prisma, mailer, s3, logger, redis, cache, auditLog, rateLimiter
├── database/
│   ├── prisma/schema.prisma  # 30+ models, 760 lines
│   └── seed.js               # Sample data seeder
├── docker-compose.yml
├── package.json           # npm workspaces root
└── .env.example
```

## Authentication Flow

1. `POST /api/auth/login` — validates email + password, generates a 6-digit OTP, hashes + stores it (10 min TTL), emails it to the user. In dev, if SMTP is not configured the OTP is printed to the service console.
2. `POST /api/auth/verify-otp` — validates the OTP against the hash, issues a JWT access token (15 min) + a refresh token (7 d) whose hash is stored server-side.
3. Attach the access token as `Authorization: Bearer <token>` on all subsequent requests.
4. `POST /api/auth/refresh-token` — rotates the refresh token. **Reuse is detected:** presenting a previously-rotated refresh token invalidates the entire token family and forces re-login on every device.
5. `POST /api/auth/logout` — clears the server-side refresh token (best-effort from the client; token is also removed locally).

Rate limiting:
- Gateway: 200 req/min global, 10 req/min on `/api/auth/*`, 100 req/min per user.
- Auth service: 5 failed OTP attempts per email per 15 min → 429 `OTP_RATE_LIMITED`.
- Redis outage falls open (rate limits disabled) rather than locking everyone out, with a warning logged.

## API Response Shape

Every endpoint returns one of two envelopes.

**Success:**

```json
{ "data": <payload>, "meta": <optional object> }
```

**Error:**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "requestId": "...", "details": { ... } } }
```

Common codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `ROLE_REQUIRED`, `RATE_LIMITED`, `OTP_RATE_LIMITED`, `OTP_INVALID`, `REFRESH_REUSE`, `SERVER_ERROR`.

Every request is stamped with an `X-Request-ID` header (generated at the gateway if missing) and the same id is echoed in every log line and every error response — use it to trace a request across services.

## Database

PostgreSQL via Prisma ORM. Key models:

- **Multi-tenant**: `Institution` → `User` → `Student`/`Faculty`
- **Academic**: `Department`, `Subject`, `Batch`, `FacultySubject`
- **Operations**: `Attendance`, `TimetableSlot`, `Assignment`, `Submission`, `Grade`, `SemesterResult`, `Exam`
- **Student Life**: `CareerOpportunity`, `CareerApplication`, `StudentSkill`, `NoteFolder`, `Note`, `Fee`, `Payment`, `LibraryBook`, `BookIssue`, `ForumPost`, `ForumReply`
- **System**: `Notification`, `Announcement`, `AuditLog`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services in dev mode |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (destructive) |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm test` | Run the Jest test suite |
| `bash start.sh` | One-command full startup (Docker → migrate → services → tunnel) |
| `bash start.sh --force-kill-ports` | Skip the interactive confirmation before killing stale listeners |
| `bash start.sh --no-tunnel` | Start services locally without Cloudflare tunnel |

## Deployment

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 15
- **MongoDB** ≥ 6
- **Redis** ≥ 7
- **Docker & Docker Compose** (optional, for containerized deployment)

### Environment Setup

```bash
cp .env.example .env
```

Fill in all values. Critical variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Access token signing key (64 hex bytes) |
| `JWT_REFRESH_SECRET` | yes | Refresh token signing key (different from above) |
| `REDIS_URL` | optional | Redis connection string — enables OTP rate limiting + caching |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | optional | SMTP credentials — if blank in dev, OTPs print to the service console |
| `ERROR_WEBHOOK_URL` | optional | Slack/Discord webhook for 5xx alerts |
| `GEMINI_API_KEY` | optional | Google Gemini API key — only needed for AI features |

### Database Setup

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed with initial data
```

### Development

```bash
npm run dev
```

Starts all 14 services concurrently (API Gateway + 13 microservices).

### Production with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

The production compose file includes an nginx reverse proxy that serves frontend static files and proxies `/api/*` requests to the API Gateway.

### Health Check

```bash
curl http://localhost:3000/health/services
```

Returns the status of all 13 microservices.

### Secret Rotation

- **JWT secrets** (`JWT_SECRET`, `JWT_REFRESH_SECRET`): Rotating these invalidates all active sessions. Users will need to re-authenticate.
- **`GEMINI_API_KEY`**: Rotate via [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Update `.env` and restart affected services.

## Backup & Restore

### Backup

```bash
bash scripts/backup.sh
```

Creates a gzip'd `pg_dump` in `backups/`. Retains the last 30 backups automatically.

### Restore

```bash
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL
```

### Full Reset (Development Only)

```bash
npm run db:reset
npm run db:seed
```

**Warning**: `db:reset` drops all tables and recreates the schema. Do not run in production.
