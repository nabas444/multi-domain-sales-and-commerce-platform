# Multi-Domain Sales & Commerce Platform

Enterprise-grade, configuration-first, multi-tenant B2B2C commercial operating system built according to the **Master Documentation v1.0**.

---

## 🏛️ Architecture Overview

The system is implemented as a **Disciplined Modular Monolith**:
* **Backend:** NestJS 11+ modular architecture with TypeScript, AsyncLocalStorage tenant context, and action-based RBAC.
* **Frontend:** Next.js 15+ App Router with React 19, Tailwind CSS, and centralized design tokens.
* **UI Design System (`@platform/ui`):** Monochromatic, light, clean, professional, high-density B2B design system with CSS variable tokens.
* **Database:** PostgreSQL 18 partitioned across 13 schemas with relational integrity, structured attributes, and immutable audit logs.
* **Cache & Queues:** Redis 7+ with BullMQ for asynchronous jobs and rate limiting.
* **Storage:** S3-compatible object storage (MinIO for local dev) with direct pre-signed uploads.

---

## 📂 Repository Structure

```
├── apps/
│   ├── api/                 # NestJS Modular Backend
│   │   ├── src/common/      # Tenant context, RBAC guards, filters, interceptors
│   │   ├── src/modules/     # Identity, Organizations, Audit, Health
│   │   └── test/            # Tenant isolation security suites & RBAC tests
│   └── web/                 # Next.js 15+ App Router Web Application
│       └── src/app/         # Control Room, Auth, Organizations, Audit
├── packages/
│   ├── ui/                  # Monochromatic design system tokens & components
│   ├── types/               # Shared TypeScript domain types & permissions
│   ├── validation/          # Zod validation schemas
│   ├── config/              # Environment config loader & Zod validation
│   └── database/            # PostgreSQL migrations (001-005), client & seed
├── infra/
│   └── docker/              # Docker Compose (PostgreSQL 18, Redis 7, MinIO)
├── .env.example             # Documented environment variables template
├── pnpm-workspace.yaml      # Monorepo package layout
└── turbo.json               # Turborepo task pipeline
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** >= 20.0.0 (Node v24 recommended)
* **pnpm** >= 9.0.0 (pnpm v11 recommended)
* **Docker** & **Docker Compose**

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Start Infrastructure Containers
```bash
pnpm docker:up
```
This launches:
* **PostgreSQL 18:** `localhost:5432` (database: `platform_core`)
* **Redis 7:** `localhost:6379`
* **MinIO Storage:** `localhost:9000` (Console at `http://localhost:9001`)

### 4. Install Dependencies & Build Packages
```bash
pnpm install
pnpm build
```

### 5. Run Database Migrations & Seed
```bash
# Execute controlled migrations (001_foundation through 005_audit)
pnpm --filter @platform/database migrate

# Seed initial system roles, Super Admin, and Partner Organization
pnpm --filter @platform/database seed
```

### 6. Start Development Servers
```bash
# Start backend API (http://localhost:4000) and Web Frontend (http://localhost:3000)
pnpm dev
```

---

## 👥 Seed Accounts (Local Development)

| Role | Email | Password | Organization Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@platform.local` | `AdminPass123!` | System Provider Global |
| **Partner Admin** | `partner@apexrealty.et` | `PartnerPass123!` | Apex Real Estate Group |
| **Sales Agent** | `agent@apexrealty.et` | `AgentPass123!` | Apex Real Estate Group (Bole HQ) |

---

## 🔒 Security & Tenant Isolation

1. **Authentication:** Argon2 / bcrypt password hashing, JWT bearer tokens, and secure HTTP-only cookies.
2. **Tenant Context:** Enforced via `TenantContextService` using Node.js `AsyncLocalStorage`. The verified `organizationId` is automatically injected into all service and repository queries.
3. **Cross-Tenant Protection:** `TenantGuard` verifies that non-super-admin users cannot access or spoof records belonging to another tenant (`ForbiddenException: Cross-tenant access denied`).
4. **Immutable Audit Trail:** PostgreSQL trigger `prevent_audit_log_modification()` strictly rejects any `UPDATE` or `DELETE` on `audit.audit_logs`.
