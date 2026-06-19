# AgilePilot — Flows, Roles & Access

This document describes every major workflow in the AgilePilot backend, who can perform each action, and how roles interact across the system.

**Base URL:** `http://localhost:8080`  
**API prefix:** `/api`  
**Auth:** JWT Bearer token in `Authorization: Bearer <token>` header (except login and health check).

---

## Table of contents

1. [Role model](#1-role-model)
2. [Recommended onboarding flow](#2-recommended-onboarding-flow)
3. [Authentication flow](#3-authentication-flow)
4. [User management flow](#4-user-management-flow)
5. [Organization flow](#5-organization-flow)
6. [Project flow](#6-project-flow)
7. [Project members flow](#7-project-members-flow)
8. [Milestones flow](#8-milestones-flow)
9. [Tasks flow](#9-tasks-flow)
10. [Cost estimation flow](#10-cost-estimation-flow)
11. [Budget & expenses flow](#11-budget--expenses-flow)
12. [Progress reports flow](#12-progress-reports-flow)
13. [Export flow](#13-export-flow)
14. [Access matrix (quick reference)](#14-access-matrix-quick-reference)

---

## 1. Role model

### Organization roles (`user.orgRole`)

| Role | Purpose |
|------|---------|
| `superAdmin` | Platform owner. Seeded once. Creates `admin` users only. Lists all organizations and users. **Not linked to any organization.** **No project access.** |
| `admin` | Organization owner. Creates their org, manages users, creates/deletes projects, full org visibility. |
| `projectManager` | Account type. Assigned as PM on one or more projects by admin. Manages project work, members, budget, estimates. |
| `teamMember` | Account type. Added to projects as `teamMember` or promoted to `teamLead`. Works on assigned tasks. |

### Project roles (per project)

| Role | How assigned | Notes |
|------|--------------|-------|
| `projectManager` | Set on `project.projectManagerId` by admin | Exactly one PM per project. Same user can be PM on multiple projects. |
| `teamLead` | Promoted from `teamMember` by admin or PM | **Max 1 team lead per project.** |
| `teamMember` | Added to project by admin or PM | Default role when a member is added. |

### Effective project access

When a user opens a project-scoped endpoint, the service resolves their **effective project role**:

1. **Admin** (same org as project) → treated as `"admin"`
2. **Assigned PM** on that project → `"projectManager"`
3. **Project member** → `teamLead` or `teamMember` from membership record
4. Otherwise → **403 Forbidden**

> **Note:** `superAdmin` bypasses the organization check but is never PM or a member, so they **cannot access project endpoints**.

---

## 2. Recommended onboarding flow

This is the intended setup order for a new deployment.

```
Step 1  npm run seed                    → Create superAdmin (from .env)
Step 2  POST /api/auth/login            → superAdmin logs in
Step 3  POST /api/users                 → superAdmin creates admin (no org yet)
Step 4  POST /api/auth/login            → admin logs in
Step 5  POST /api/organizations         → admin creates organization (linked to admin)
Step 6  POST /api/users                 → admin creates projectManager + teamMember users
Step 7  POST /api/projects              → admin creates project with projectManagerId
Step 8  POST /api/projects/:id/members  → admin/PM adds team members
Step 9+ Milestones → Tasks → Estimates → Budget → Reports → Export
```

### Prerequisites

| Actor | Requirement before next step |
|-------|------------------------------|
| `admin` | Must create organization before managing users or projects |
| `projectManager` | Must be assigned to a project by admin |
| `teamMember` | Must be added as a project member |
| Budget expenses | Budget must be set (`PUT /budget`) before adding expenses |

---

## 3. Authentication flow

### Endpoints

| Method | Path | Auth | Who |
|--------|------|------|-----|
| `POST` | `/api/auth/login` | None | Anyone with valid credentials |
| `GET` | `/api/auth/me` | JWT | Any authenticated active user |
| `GET` | `/health` | None | Public health check |

### Flow: Login

1. Client sends `email` + `password`.
2. Server finds user, checks `isActive`, verifies password hash.
3. Server returns JWT + safe user object (no password).

### Flow: Get profile

1. Client sends JWT.
2. `auth` middleware validates token and loads `req.user`.
3. Server returns current user profile.

### Access rules

- Inactive users cannot log in.
- Invalid credentials return `401` (generic message).
- All routes under `/api/users`, `/api/organizations`, `/api/projects` require JWT except `POST /api/auth/login`.

---

## 4. User management flow

### Endpoints

| Method | Path | Route permission | Service rules |
|--------|------|------------------|---------------|
| `POST` | `/api/users` | `CREATE_USER` | Role creation rules below |
| `GET` | `/api/users` | `MANAGE_USERS` | superAdmin: all non-superAdmin users; admin: own org only |
| `GET` | `/api/users/:id` | `MANAGE_USERS` | Same org scope |
| `PUT` | `/api/users/:id` | `MANAGE_USERS` | Same org scope |
| `PATCH` | `/api/users/:id/deactivate` | `MANAGE_USERS` | Cannot deactivate self or superAdmin |

### Who can create which roles

| Actor | Can create |
|-------|------------|
| `superAdmin` | `admin` only (always `organizationId: null`) |
| `admin` | `projectManager`, `teamMember` only (auto-assigned to admin's org) |
| Others | **Denied** |

### Who can manage users

| Actor | Scope |
|-------|-------|
| `superAdmin` | All users except other superAdmins |
| `admin` | Users in their organization only (must have created org first) |
| `projectManager`, `teamMember` | **Denied** |

### Flow: superAdmin creates admin

1. superAdmin logs in.
2. `POST /api/users` with `{ name, email, password, orgRole: "admin" }`.
3. New admin has no organization until they create one.

### Flow: admin creates org users

1. Admin must have created organization (`organizationId` set).
2. `POST /api/users` with `orgRole: "projectManager"` or `"teamMember"`.
3. User is created inside admin's organization.

### Deactivation rules

- Cannot deactivate your own account.
- Cannot deactivate a `superAdmin`.
- Deactivated users cannot log in.

---

## 5. Organization flow

### Endpoints

| Method | Path | Route permission | Who can use |
|--------|------|------------------|-------------|
| `POST` | `/api/organizations` | `CREATE_ORGANIZATION` | `admin` without existing org |
| `GET` | `/api/organizations/me` | `VIEW_ORGANIZATION` | `admin` with org |
| `GET` | `/api/organizations` | `LIST_ORGANIZATIONS` | `superAdmin` only |

### Flow: Admin creates organization

1. Admin logs in (must not already belong to an org).
2. `POST /api/organizations` with `{ name, slug?, defaultCurrency? }`.
3. Organization is created; admin's `organizationId` is updated automatically.
4. Admin can now create users and projects.

### Access rules

| Actor | Create org | View own org | List all orgs |
|-------|------------|--------------|---------------|
| `superAdmin` | No | No (not linked to org) | Yes |
| `admin` (no org) | Yes | No (404 until created) | No |
| `admin` (with org) | No (409 already belongs) | Yes | No |
| `projectManager`, `teamMember` | No | No | No |

---

## 6. Project flow

### Endpoints

| Method | Path | Route permission | Effective project roles |
|--------|------|------------------|-------------------------|
| `POST` | `/api/projects` | `CREATE_PROJECT` | `admin` only |
| `GET` | `/api/projects` | JWT only | See list rules below |
| `GET` | `/api/projects/:projectId` | JWT only | Any project member role + admin |
| `PUT` | `/api/projects/:projectId` | JWT only | `admin`, `projectManager` |
| `PATCH` | `/api/projects/:projectId/change-manager` | `CREATE_PROJECT` | `admin` only |
| `DELETE` | `/api/projects/:projectId` | `CREATE_PROJECT` | `admin` only |

### Flow: Create project

1. Admin (with org) sends project details + `projectManagerId`.
2. PM must be an active user in the same organization.
3. Project is created with one assigned PM.

### Flow: List projects

| Actor | Sees |
|-------|------|
| `admin` | All projects in their organization |
| `projectManager` | Projects where they are the assigned PM |
| `teamMember` | Projects where they are a member (via `ProjectMember`) |
| `superAdmin` | **Denied** |

### Flow: Update project

- **Admin** or **PM** can update name, description, status, dates, currency, etc.
- Only **admin** can change `projectManagerId` via `PUT` (PM cannot reassign themselves).
- Use `PATCH .../change-manager` for admin-only PM reassignment.

### Flow: Delete project

- **Admin only.** Deletes all project members, then the project.

---

## 7. Project members flow

### Endpoints

| Method | Path | Effective project roles |
|--------|------|-------------------------|
| `GET` | `/api/projects/:projectId/members` | `admin`, `projectManager`, `teamLead` |
| `POST` | `/api/projects/:projectId/members` | `admin`, `projectManager` |
| `DELETE` | `/api/projects/:projectId/members/:userId` | `admin`, `projectManager` |
| `PATCH` | `.../members/:userId/promote-lead` | `admin`, `projectManager` |
| `PATCH` | `.../members/:userId/demote-lead` | `admin`, `projectManager` |

### Flow: Add member

1. Admin or PM adds a user by `userId`.
2. User must be active and in the same organization.
3. User cannot already be the project's PM.
4. User cannot already be a member.
5. New members start as `teamMember`.

### Flow: Promote to team lead

1. Admin or PM promotes an existing `teamMember`.
2. **Only one `teamLead` per project.** Demote existing lead first if needed.

### Flow: Demote team lead

1. Admin or PM demotes `teamLead` back to `teamMember`.

### Who can view members

- `teamMember` **cannot** list members (403).
- `teamLead` can list members.

---

## 8. Milestones flow

### Endpoints

| Method | Path | Manage (`create/update/delete`) | View (`list/get`) |
|--------|------|--------------------------------|-------------------|
| `POST` | `/api/projects/:projectId/milestones` | admin, PM, teamLead | — |
| `GET` | `/api/projects/:projectId/milestones` | — | admin, PM, teamLead, teamMember |
| `GET` | `.../milestones/:milestoneId` | — | admin, PM, teamLead, teamMember |
| `PUT` | `.../milestones/:milestoneId` | admin, PM, teamLead | — |
| `DELETE` | `.../milestones/:milestoneId` | admin, PM, teamLead | — |

### Milestone statuses

`pending` · `in_progress` · `completed`

### Flow: Create milestone

1. Caller must have manage access on the project.
2. Milestone is scoped to `projectId` with optional `order` (auto-incremented if omitted).

---

## 9. Tasks flow

### Endpoints

| Method | Path | Manage | View |
|--------|------|--------|------|
| `POST` | `/api/projects/:projectId/tasks` | admin, PM, teamLead | — |
| `GET` | `/api/projects/:projectId/tasks` | — | admin, PM, teamLead, teamMember |
| `GET` | `.../tasks/:taskId` | — | admin, PM, teamLead, teamMember |
| `PUT` | `.../tasks/:taskId` | See update rules below | — |
| `DELETE` | `.../tasks/:taskId` | admin, PM, teamLead | — |
| `POST` | `.../tasks/:taskId/comments` | See comment rules below | — |
| `GET` | `.../tasks/:taskId/comments` | — | admin, PM, teamLead, teamMember |

### Task statuses & priorities

**Status:** `todo` · `in_progress` · `done`  
**Priority:** `low` · `medium` · `high`

### Flow: Create task

1. Manage role required (admin, PM, teamLead).
2. Task belongs to a milestone in the same project.
3. Optional: assignee (must be PM or project member), parent task (subtask), dependencies.
4. **Subtasks cannot have nested subtasks** (one level only).
5. Dependencies are validated (no self-reference, no circular chains).

### Flow: Update task

| Actor | Can update |
|-------|------------|
| admin, PM, teamLead | Any task field |
| teamMember | **Only their own assigned tasks**, and **only** `status` and `actualHours` |

### Flow: Delete task

- Manage roles only.
- Cannot delete a task that still has subtasks.

### Flow: Comments

| Actor | Can comment |
|-------|-------------|
| admin, PM, teamLead | On any task |
| teamMember | **Only on tasks assigned to them** |

Everyone with view access can read comments.

---

## 10. Cost estimation flow

### Endpoints

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/api/projects/:projectId/estimate` | admin, PM |
| `PUT` | `/api/projects/:projectId/estimate` | admin, PM |
| `GET` | `/api/projects/:projectId/estimate/summary` | admin, PM |

### Blocked roles

`teamLead` and `teamMember` **cannot** view or manage estimates.

### Flow: Upsert estimate

1. Admin or PM sets line items (materials, software, travel, etc.), contingency %, notes.
2. Labor is **auto-computed** from tasks: `Σ (estimatedHours × hourlyRate)` per task.

### Flow: Summary

Returns:

- Labor from tasks (with per-task breakdown)
- Line items total
- Subtotal, contingency amount, grand total

---

## 11. Budget & expenses flow

### Endpoints

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/api/projects/:projectId/budget` | admin, PM |
| `PUT` | `/api/projects/:projectId/budget` | admin, PM |
| `POST` | `/api/projects/:projectId/budget/expenses` | admin, PM |
| `DELETE` | `.../budget/expenses/:expenseId` | admin, PM |
| `GET` | `/api/projects/:projectId/budget/analysis` | admin, PM |

### Blocked roles

`teamLead` and `teamMember` **cannot** access budget.

### Flow: Set budget

1. Admin or PM sets `allocatedAmount` and currency.
2. Creates or updates the single budget document per project.

### Flow: Add expense

1. Budget must exist first.
2. Admin or PM adds expense with date, category, amount, description.

### Flow: Budget analysis

Returns:

| Metric | Description |
|--------|-------------|
| `allocatedAmount` | Budget cap |
| `estimatedCost` | From cost estimation grand total |
| `actualLaborCost` | From tasks: `Σ (actualHours × hourlyRate)` |
| `expensesTotal` | Sum of manual expenses |
| `totalSpent` | Labor + expenses |
| `variance` | allocated − spent |
| `utilizationPercent` | spent / allocated |
| `burnRatePerWeek` | spent per week since project creation |

---

## 12. Progress reports flow

### Endpoints

| Method | Path | Submit | View all | View own only |
|--------|------|--------|----------|---------------|
| `POST` | `/api/projects/:projectId/reports` | All project roles | — | — |
| `GET` | `/api/projects/:projectId/reports` | — | admin, PM, teamLead | teamMember (own reports) |
| `GET` | `.../reports/:reportId` | — | admin, PM, teamLead | teamMember (own reports) |

### Flow: Create report

1. Any project participant (admin, PM, teamLead, teamMember) can submit.
2. Provide `periodStart`, `periodEnd`, optional `manualNotes`.
3. Scope: entire project (default), or `milestoneId`, or `taskId` (not both).
4. **Auto completion %** is calculated:
   - **Task scope:** 100% if task is `done`, else 0%
   - **Milestone / project scope:** `(done tasks / total tasks) × 100`
5. `combinedSummary` merges auto % and manual notes.

### Flow: List / view reports

| Actor | Sees |
|-------|------|
| admin, PM, teamLead | All reports on the project |
| teamMember | Only reports they submitted |

---

## 13. Export flow

### Endpoint

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/api/projects/:projectId/reports/:reportId/export?format=pdf` | admin, PM, teamLead |
| `GET` | `/api/projects/:projectId/reports/:reportId/export?format=excel` | admin, PM, teamLead |

### Blocked roles

`teamMember` **cannot** export (even their own reports).

### Flow: Export report

1. Caller must be admin, PM, or teamLead on the project.
2. `format` query param: `pdf` or `excel`.
3. Response is a file download (not JSON).
4. Export includes report summary + project task list.

---

## 14. Access matrix (quick reference)

### Organization-level permissions (`config/permissions.js`)

| Permission | Roles |
|------------|-------|
| `CREATE_ADMIN` | superAdmin |
| `CREATE_USER` | superAdmin, admin |
| `MANAGE_USERS` | superAdmin, admin |
| `CREATE_ORGANIZATION` | admin |
| `VIEW_ORGANIZATION` | admin |
| `LIST_ORGANIZATIONS` | superAdmin |
| `CREATE_PROJECT` | admin |

### Project-scoped feature access

| Feature | admin | PM | teamLead | teamMember | superAdmin |
|---------|:-----:|:--:|:--------:|:----------:|:----------:|
| View project | ✓ | ✓ | ✓ | ✓ | ✗ |
| Create/delete project | ✓ | ✗ | ✗ | ✗ | ✗ |
| Update project | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change PM | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ | ✗ |
| List members | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage milestones | ✓ | ✓ | ✓ | ✗ | ✗ |
| View milestones | ✓ | ✓ | ✓ | ✓ | ✗ |
| Create/delete tasks | ✓ | ✓ | ✓ | ✗ | ✗ |
| View tasks | ✓ | ✓ | ✓ | ✓ | ✗ |
| Update any task | ✓ | ✓ | ✓ | ✗ | ✗ |
| Update own task (status, hours) | — | — | — | ✓ | ✗ |
| Comment on any task | ✓ | ✓ | ✓ | ✗ | ✗ |
| Comment on own task | — | — | — | ✓ | ✗ |
| Cost estimate | ✓ | ✓ | ✗ | ✗ | ✗ |
| Budget & analysis | ✓ | ✓ | ✗ | ✗ | ✗ |
| Submit progress report | ✓ | ✓ | ✓ | ✓ | ✗ |
| View all reports | ✓ | ✓ | ✓ | ✗ | ✗ |
| View own reports | — | — | — | ✓ | ✗ |
| Export reports | ✓ | ✓ | ✓ | ✗ | ✗ |

### Legend

- **✓** = allowed  
- **✗** = denied (403)  
- **—** = not applicable (another rule applies)

---

## Authentication header example

```http
GET /api/projects HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Related files

| File | Purpose |
|------|---------|
| `config/roles.js` | Org and project role constants |
| `config/permissions.js` | Route-level permission map |
| `middleware/auth.js` | JWT verification |
| `middleware/authorize.js` | Org-role permission check |
| `services/ProjectService.js` | `assertProjectAccess` — core project RBAC |
| `postman/AgilePilot-API.postman_collection.json` | Full API test collection |
