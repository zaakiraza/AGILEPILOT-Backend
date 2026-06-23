# AgilePilot Backend

REST API for **AgilePilot** — a web-based project management platform with role-based access control, milestones, tasks, cost estimation, budget tracking, progress reports, and PDF/Excel export.

**Live API:** `https://agilepilot-backend.vercel.app`

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Validation | Zod |
| Auth | JWT (custom implementation) |
| Password hashing | Node.js `crypto.scrypt` |
| Email OTP | Nodemailer (SMTP) |

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- npm

## Getting started

### 1. Install dependencies

```bash
cd Backend
npm install
```

### 2. Environment variables

Create a `.env` file in the `Backend` folder:

```env
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/agilepilot
JWT_SECRET=your-long-random-secret

# Used by npm run seed
SEED_SUPER_ADMIN_NAME=Super Admin
SEED_SUPER_ADMIN_EMAIL=superadmin@example.com
SEED_SUPER_ADMIN_PASSWORD=change-me-123

# Email OTP (required for user verification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="AgilePilot" <your-email@gmail.com>

# Optional: return OTP in create-user response for Postman/testing (never in production)
DEV_EXPOSE_OTP=true
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: `8080`) |
| `SEED_SUPER_ADMIN_*` | For seed | Credentials for the initial super admin |
| `SMTP_*` | For email OTP | SMTP settings to send verification codes |
| `DEV_EXPOSE_OTP` | No | If `true`, includes `devOtp` in create-user response when mail is not configured |

> Use a direct `mongodb://` URI if `mongodb+srv` DNS lookup fails on your network.
>
> If SMTP is not configured, OTPs are logged to the server console instead of being emailed.

### 3. Seed the super admin

```bash
npm run seed
```

Creates the first `superAdmin` user. Run once per fresh database.

### 4. Start the server

```bash
npm start
```

Server runs at `https://agilepilot-backend.vercel.app` when deployed. For local development, `npm start` uses `PORT` from `.env` (default `8080`) with file watching enabled (`node --watch`).

### 5. Verify

```bash
curl https://agilepilot-backend.vercel.app/health
```

Expected response:

```json
{ "status": "ok", "message": "AgilePilot API is running" }
```

## Authentication

Most endpoints require a JWT in the request header:

```http
Authorization: Bearer <token>
```

Obtain a token via login (email must be verified first — see below):

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Email OTP verification

When **superAdmin** or **admin** creates a user via `POST /api/users`, the new account has `isEmailVerified: false` and a **6-digit OTP** is sent to their email. The user **cannot log in** until verified.

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

Resend a code (60-second cooldown):

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

- Seeded **superAdmin** is pre-verified (no OTP).
- OTP expires in **10 minutes**.
- Max **5** failed verification attempts per code.

## API overview

Base path: `/api`

| Resource | Prefix | Description |
|----------|--------|-------------|
| Auth | `/api/auth` | Login, verify email, resend OTP, profile |
| Users | `/api/users` | User CRUD (superAdmin / admin) |
| Organizations | `/api/organizations` | Create and view organizations |
| Projects | `/api/projects` | Projects and nested resources |

### Project-nested resources

All nested under `/api/projects/:projectId`:

| Path | Features |
|------|----------|
| `/members` | Add, remove, promote/demote team lead |
| `/milestones` | Milestone CRUD |
| `/tasks` | Tasks, subtasks, dependencies, comments |
| `/estimate` | Cost estimation and summary |
| `/budget` | Budget, expenses, variance analysis |
| `/reports` | Progress reports, PDF/Excel export |

### Response format

Successful responses:

```json
{
  "status": "success",
  "message": "Human-readable message",
  "data": { }
}
```

Errors:

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Recommended setup flow

```
npm run seed
  → superAdmin login
  → create admin user → verify email (OTP)
  → admin login
  → create organization
  → create projectManager + teamMember users → verify each email
  → create project (assign PM)
  → add members → milestones → tasks → estimates → budget → reports
```

Full role and permission details: **[docs/FLOWS_AND_ACCESS.md](./docs/FLOWS_AND_ACCESS.md)**

## Roles (summary)

### Organization roles

| Role | Capabilities |
|------|--------------|
| `superAdmin` | Creates admins, lists orgs/users. No project access. |
| `admin` | Owns org, manages users and projects. |
| `projectManager` | Manages assigned projects. |
| `teamMember` | Works on assigned tasks within projects. |

### Project roles

| Role | Notes |
|------|-------|
| `projectManager` | One per project (set by admin). |
| `teamLead` | Max one per project (promoted from member). |
| `teamMember` | Default when added to a project. |

## Project structure

```
Backend/
├── app.js                 # Express entry point
├── config/                # Roles, permissions, enums
├── controllers/           # HTTP layer (req/res)
├── docs/                  # Documentation
├── middleware/            # Auth, authorization, validation, errors
├── models/                # Mongoose schemas
├── postman/               # API collection & environment
├── repositories/          # Database queries
├── routes/                # Route definitions
├── scripts/               # seed.js
├── services/              # Business logic
├── utils/                 # DB, JWT, response helpers, export builders
└── validators/            # Zod schemas
```

**Request flow:** `routes` → `middleware` → `controllers` → `services` → `repositories` → `models`

## Postman

Import these files for API testing:

- `postman/AgilePilot-API.postman_collection.json`
- `postman/AgilePilot-Local.postman_environment.json`

The collection includes a **Recommended Flow** (32 steps) that exercises the full API end-to-end.

Set `baseUrl` to `https://agilepilot-backend.vercel.app` and run login requests first to populate the `token` variable.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server with hot reload |
| `npm run seed` | Create initial super admin |

## Features

- JWT authentication with org-scoped RBAC
- Email OTP verification for newly created users
- Multi-tenant ready (organization-scoped data)
- Projects with PM assignment and member management
- Milestones and tasks (subtasks, dependencies, comments)
- Cost estimation (task labor roll-up + line items + contingency)
- Budget tracking with expense logging and burn-rate analysis
- Progress reports with auto-completion percentage
- PDF and Excel export (custom builders, no external PDF/Excel libs)

## License

ISC
