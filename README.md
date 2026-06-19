# AgilePilot Backend

REST API for **AgilePilot** — a web-based project management platform with role-based access control, milestones, tasks, cost estimation, budget tracking, progress reports, and PDF/Excel export.

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Validation | Zod |
| Auth | JWT (custom implementation) |
| Password hashing | Node.js `crypto.scrypt` |

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
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: `8080`) |
| `SEED_SUPER_ADMIN_*` | For seed | Credentials for the initial super admin |

> Use a direct `mongodb://` URI if `mongodb+srv` DNS lookup fails on your network.

### 3. Seed the super admin

```bash
npm run seed
```

Creates the first `superAdmin` user. Run once per fresh database.

### 4. Start the server

```bash
npm start
```

Server runs at `http://localhost:8080` with file watching enabled (`node --watch`).

### 5. Verify

```bash
curl http://localhost:8080/health
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

Obtain a token via login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

## API overview

Base path: `/api`

| Resource | Prefix | Description |
|----------|--------|-------------|
| Auth | `/api/auth` | Login, current user profile |
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
  → create admin user
  → admin login
  → create organization
  → create projectManager + teamMember users
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

Set `baseUrl` to `http://localhost:8080` and run login requests first to populate the `token` variable.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server with hot reload |
| `npm run seed` | Create initial super admin |

## Features

- JWT authentication with org-scoped RBAC
- Multi-tenant ready (organization-scoped data)
- Projects with PM assignment and member management
- Milestones and tasks (subtasks, dependencies, comments)
- Cost estimation (task labor roll-up + line items + contingency)
- Budget tracking with expense logging and burn-rate analysis
- Progress reports with auto-completion percentage
- PDF and Excel export (custom builders, no external PDF/Excel libs)

## License

ISC
