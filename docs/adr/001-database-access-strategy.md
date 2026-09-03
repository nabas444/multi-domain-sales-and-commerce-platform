# ADR 001: PostgreSQL Native Multi-Schema Architecture, Query Discipline & Type Safety

## Status
**ACCEPTED** (Architectural Decision Record)

## Context
The Multi-Domain Sales & Commerce Platform requires deep support for complex commercial operations across 12 distinct database schemas:
1. `identity` — Core users, credentials, multi-factor auth, sessions
2. `organizations` — Multi-tenant hierarchies, branches, legal entities
3. `rbac` — Granular role-permission matrices
4. `audit` — Cryptographically verifiable, trigger-enforced immutable event stream
5. `settings` — Hierarchical configuration resolution engine with JSONB overrides
6. `domains` — Dynamic vertical definitions, category taxonomies, structured attributes
7. `inventory` & `media` — Dynamic schema attributes, stock movements, S3-backed asset links
8. `crm` — Leads, deals, activities, appointments, pipeline stages
9. `workflows` — Step execution graphs, transition engines, notifications
10. `commercial` — Multi-tier commission contracts, fee waterfalls, fee calculation engines
11. `finance` — Double-entry compliant append-only financial ledger, invoices, payout settlements
12. `marketing` — Attribution tracking, campaign UTM tracking, signed webhook dispatch

The Master Documentation (Section 2) required selecting an access strategy. Both Prisma and Drizzle were evaluated against our PostgreSQL multi-schema architecture.

## Decision Drivers & Evaluation
1. **Multi-Schema DDL & RLS/Triggers**:
   - Prisma historically struggles with complex multi-schema architectures, cross-schema foreign keys, and raw SQL triggers.
   - Drizzle ORM provides good SQL parity, but adding an ORM abstraction on top of 12 production-grade, hand-written, idempotent SQL migrations introduces maintenance duplication without added runtime safety.
2. **PostgreSQL 18 Advanced Capabilities**:
   - Immutability triggers (`prevent_audit_log_modification`) that raise exceptions on `UPDATE` or `DELETE`.
   - Native Full-Text Search (`to_tsvector`, `plainto_tsquery`, `ts_rank`) combined with JSONB GIN indexing (`attributes @> $1::jsonb`).
   - Transactional advisory locking and strict serializable isolation levels required by the financial waterfall.
3. **Performance & Zero Overhead**:
   - Raw `pg` connection pooling (`pg.Pool`) provides zero abstraction overhead, deterministic execution plans, and microsecond-level query dispatching.

## Decision
We formally adopt **Native PostgreSQL Migration Architecture with Strong TypeScript Query Discipline**:
1. **Migrations as Source of Truth**: All DDL changes are maintained in sequential, versioned SQL migration files (`packages/database/migrations/*.sql`), executed strictly in chronological order by the programmatic migration runner.
2. **Strict Compile-Time Typing via `@platform/types`**:
   - No query runs untyped. Every database invocation must specify the expected row shape: `dbPool.query<ListingRecord>(sql, params)`.
   - All models, enums, and request/response payloads are defined and shared monorepo-wide in `packages/types`.
3. **Parameterization Guard**:
   - Dynamic query composition strictly utilizes positional parameters (`$1, $2, ...`), preventing SQL injection.
   - String concatenation for SQL values is prohibited by lint and review rules.
4. **Future Path**:
   - If schema reflection is required for automated API documentation or GraphQL/OpenAPI schema generation in future phases, Drizzle schema introspection can be layered on top of the existing PostgreSQL tables without modifying runtime query semantics.
