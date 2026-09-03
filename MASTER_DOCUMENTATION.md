MULTI-DOMAIN SALES & COMMERCE PLATFORM

FINAL PRODUCT • BUSINESS • UX • ARCHITECTURE • ENGINEERING • OPERATIONS DOCUMENTATION

SaaS + Marketplace + Inventory + CRM + Sales Agency + Marketing + Commission + Billing/Settlement + Domain Configuration Engine

Version 1.0  |  September 2026

Implementation strategy: Phase-by-phase, production-ready foundation first, extensibility built into the core.

This document consolidates the supplied Business Provider / Partner / Owner Model and Expandable Master Product Specification into one buildable master plan. It preserves the source concepts while adding an implementation path, modern technical architecture, UX system, scalable settings architecture, operational controls, quality gates, and delivery sequencing.


# 0. DOCUMENT PURPOSE, SOURCE BASIS & DESIGN CONTRACT

This master documentation is the canonical build reference for the platform. It combines two supplied specifications: the Business Provider / Partner / Owner Model v3 and the Expandable Master Product Specification v2. The first establishes the commercial operating model—System Provider, partners, inventory ownership, contracts, fees, commissions, attribution, billing and settlement. The second establishes the configurable product model—domains, categories, dynamic attributes, media, workflows, CRM, marketing, search, portals, APIs, security and administration.

The source vision is explicitly configuration-first: important behavior should be represented as configuration rather than permanently hard-coded. The business model further requires strict separation between platform ownership, inventory ownership, selling authority, sales representation and financial entitlement.

| Design Contract | Meaning | Implementation consequence |
| --- | --- | --- |
| Configuration over code | Business verticals should be creatable without rebuilding the core. | Build metadata/configuration engines before domain-specific screens. |
| Provider vs owner separation | The platform owner and inventory owner are distinct parties. | Every commercial and inventory record carries explicit ownership context. |
| Tenant isolation | Partner administrators must never escape their tenant boundary. | Authorization is enforced server-side on every protected query/mutation. |
| Auditable money | Balances cannot be reconstructed only from dashboard totals. | Use immutable-ish ledger entries and compensating adjustments. |
| Versioned rules | Historical deals must retain the contract/rule version that governed them. | Never overwrite effective financial rules in place. |
| Hybrid domain model | Core entities are normalized; flexible attributes use structured definitions and JSONB where useful. | PostgreSQL remains queryable and reportable. |
| Mobile-first execution | Customers and field salespeople need fast mobile workflows. | Responsive UX and field-ready flows are first-class. |
| Settings at scale | Thousands of configurations must remain manageable. | Typed settings registry, scopes, inheritance, validation, audit, search and bulk operations. |

The supplied documents also state that commission, agency, tax, payment, brokerage and contract structures must be adapted to Ethiopian law and applicable rules for each domain. This documentation therefore defines software capabilities and control points, not legal rates or legal advice.


# 1. EXECUTIVE VISION

Build a professional multi-tenant commercial operating system that begins with real-estate sales and can expand into automotive, commerce, elevators, construction/heavy equipment, electronics, agriculture, energy, industrial equipment, professional services, building materials and logistics without creating a separate codebase for every industry.

The mature product is a coordinated ecosystem: organizations bring inventory; the platform supplies discovery, workflow and infrastructure; buyers create demand; sales teams execute opportunities; marketing creates and attributes leads; the commercial engine calculates fees and commissions; finance reconciles invoices, payments and settlements; configuration enables new domains.

SYSTEM PROVIDER    ↓PARTNERS / OWNERS / SELLERS    ↓BRANCHES / TEAMS / USERS    ↓AUTHORIZED INVENTORY    ↓BUYERS → LEADS → ASSIGNMENT → ACTIVITIES → APPOINTMENTS / QUOTES    ↓DEALS → CONTRACT/RULE EVALUATION → LEDGER → INVOICE / SETTLEMENT    ↓REPORTING / ANALYTICS / AUDIT


## 1.1 Golden rule

The platform owner remains the PLATFORM OWNER while each partner remains the OWNER/SELLER of its inventory. The system must always be able to answer: who owns the asset, who is authorized to sell it, who generated the lead, who handled the customer, which contract applies, what event triggered the fee, who earns the commission and who must be paid.


## 1.2 Business lanes

| Lane | Purpose | Primary revenue logic |
| --- | --- | --- |
| SaaS subscription | Platform access, CRM, inventory, marketing, hosting/services. | Recurring subscription. |
| Success fee | Platform-attributed deals. | Fixed or percentage fee at contractual trigger. |
| Sales-assisted commission | Provider sales team actively closes partner inventory. | Separate commission according to contract/rule. |
| Listing/lead/usage fees | Optional usage monetization. | Per listing, qualified lead, appointment, credit or other configured event. |
| Hybrid/custom contract | Partner-specific negotiated commercial model. | Contract overrides standard plan where authorized. |


# 2. BUSINESS OPERATING MODEL — HOW THE BUSINESS RUNS

The system is not merely an inventory website. It is the operating infrastructure for a platform company that can simultaneously function as SaaS provider, marketplace operator, marketing provider and, when contractually authorized, sales/agency participant.


## 2.1 Operating units

| Unit | Responsibility | System boundary |
| --- | --- | --- |
| System Provider | Owns platform, domains, global policy, plans, fees, moderation, contracts and platform analytics. | Global. |
| Partner / Owner | Owns or is authorized to sell inventory and operates its organization. | Tenant. |
| Branch / Department | Runs regional/team operations. | Organization branch. |
| Manager / Sub-admin | Operates within assigned scope. | Organization + assigned scopes. |
| Sales Agent | Handles leads, customers, appointments and deals. | Assigned records. |
| Inventory Staff | Creates and maintains listings. | Assigned inventory/category. |
| Customer / Buyer | Searches, contacts, books, purchases. | Own customer activity. |
| Finance | Handles invoices, payments, ledger, settlement and adjustments. | Financial scope. |
| Moderator / Verifier | Controls content and verification workflows. | Assigned approval scope. |


## 2.2 Partner lifecycle

* Draft
* Pending Verification
* Needs Correction
* Approved
* Contract Pending
* Active
* Restricted
* Suspended
* Terminated
* Archived
Every status transition is timestamped, attributable and auditable. Suspension, restriction and termination must not silently destroy historical commercial records.


## 2.3 Partner onboarding

* Start partner application.
* Select organization type and intended domain(s).
* Create organization account.
* Capture legal/business identity, contacts and authorized representative.
* Upload verification documents.
* Accept platform terms and privacy references.
* Select/request commercial plan.
* Provider reviews and either approves, rejects or requests corrections.
* Create or attach commercial contract.
* Activate the organization after required conditions are satisfied.
* Generate entitlements from plan + contract.
* Grant domain/category/inventory permissions.
* Open partner portal.

# 3. COMMERCIAL AGREEMENT, PRICING, FEES & COMMISSION ENGINE

Commercial logic must never be hard-coded around one percentage. Each partner may have a contract with effective dates, domains, categories, territories, fee model, rate, minimum commitments, payment/settlement cycles, attribution rules, cancellation/refund/dispute rules and authorized sales activities.


## 3.1 Contract model

| Field group | Required capability |
| --- | --- |
| Identity | Contract ID, partner, version, status. |
| Effective period | Effective date, expiry/renewal date. |
| Scope | Domains, categories, branches/territories, listings where needed. |
| Economics | Fee model, fixed/percentage rate, min/max, currency. |
| Operations | Payment cycle, settlement cycle, attribution rules. |
| Risk | Cancellation, refund, dispute, tax/VAT treatment fields. |
| Authority | Authorized sales activities, exclusivity/non-exclusivity. |
| Evidence | Attachments, approval/signature state, audit trail. |


## 3.2 Supported fee models

* Subscription: monthly, quarterly or annual; plan limits for listings, users, storage, leads, domains and featured slots.
* Listing fee: publication, category-specific, featured, renewal or priority placement.
* Lead fee: per lead, qualified lead, appointment or prepaid lead credits.
* Success/deal commission: percentage, fixed amount, tiered rate or category-specific rule.
* Sales-agent commission: provider/agent share when the provider sales organization directly handles the transaction.
* Hybrid: subscription plus reduced success/usage fee.
* Contract-specific: negotiated agreement overrides standard plan/rules within its scope.

## 3.3 Commission trigger

A commission is not simply 'commission on sale'. The system records the exact event that causes a fee to become estimated, pending, earned, invoiced, payable or paid.

| Event | Default financial behavior |
| --- | --- |
| Lead created | No success fee; optional lead fee. |
| Qualified lead | Optional qualified-lead charge. |
| Appointment completed | Optional appointment fee. |
| Offer/quotation accepted | Optional milestone. |
| Reservation paid | Commission may become pending. |
| Contract signed | Pending or earned depending on contract. |
| Buyer payment received | May become payable. |
| Deal closed | Success fee finalized if this is the trigger. |
| Refund/cancellation | Reversal/clawback according to contract. |


## 3.4 Financial state machine

ESTIMATED → PENDING → EARNED → INVOICED → PAYABLE → PAID                     ↘ DISPUTED                     ↘ REVERSED / CLAWBACK


## 3.5 Waterfall

The distribution engine supports a configurable waterfall rather than one universal formula.

BUYER TRANSACTION VALUE        ↓CONTRACT-DEFINED GROSS BASIS        ↓PLATFORM FEE        ↓SALES / AGENT COMMISSION        ↓PARTNER / OWNER NET        ↓TAXES / ADJUSTMENTS        ↓SETTLEMENT

The source specification explicitly warns that real-estate, automotive and elevator/project agreements may require different waterfalls.


# 4. FINANCIAL LEDGER, BILLING & SETTLEMENT


## 4.1 Ledger principles

* Ledger entries are the financial source of truth for platform-side calculations.
* Do not mutate historical financial events to 'fix' balances; create adjustment/reversal entries.
* Each calculation records the contract version and fee rule that produced it.
* Every money movement has status, currency, dates and external/internal references.
* Dashboards are projections over ledger/invoice/payment data, not the underlying accounting record.

## 4.2 Ledger record

| Field | Purpose |
| --- | --- |
| Transaction ID | Stable unique identifier. |
| Partner / Contract | Commercial ownership and governing agreement. |
| Listing / Lead / Deal | Business origin. |
| Agent | Sales commission attribution. |
| Fee rule | Exact rule version. |
| Gross value / fee base | Calculation basis. |
| Provider fee / partner share / agent commission | Distribution outputs. |
| Taxes / adjustments | Explicit additions/deductions. |
| Currency | Currency context. |
| Status | Financial lifecycle. |
| Created / earned / due / paid dates | Timeline. |
| Reference / notes | Traceability. |


## 4.3 Billing

Support subscription invoices, usage invoices, lead/listing invoices, commission invoices, credit purchases, receipts, refunds, credit notes/adjustments and downloadable statements. When payment processing is integrated, payment events are reconciled with invoices and ledger entries.


## 4.4 Credits

Credits are ledger-based, not merely a mutable numeric balance. Support lead credits, featured listing credits, advertising credits, media/storage credits, API usage credits and appointment credits, plus purchase, grant, deduction, expiry and refund transactions.


# 5. SALES OPERATING SYSTEM


## 5.1 Provider sales organization

* Sales Director / Manager
* Sales Agent
* Lead Qualifier
* Account Manager
* Partner Success Manager
* Marketing Specialist

## 5.2 Lead attribution

* Platform-generated
* Partner-generated
* Agent-generated
* Marketing-campaign generated
* Organic website
* Referral
* Imported lead
* Existing customer
Attribution can support first-touch, last-touch, assigned-agent, partner-inventory, campaign, manual override with reason and multi-touch analytics. The commercial contract determines which attribution rule establishes financial entitlement.


## 5.3 Lead assignment

* Partner / branch / provider sales team / partner sales team
* Round-robin
* Weighted distribution
* Geographic
* Category expertise
* Language
* Workload
* Availability
* Manual assignment
* SLA escalation

## 5.4 Sales pipeline

A universal CRM pipeline is configurable by domain. The system must support stages, required fields/documents, approvals, tasks, notifications, timers, escalation, automatic assignment and conditional branches. Domain workflows may impose additional stage requirements.


## 5.5 Agent mobile/field mode

* Mobile lead inbox
* One-tap call/WhatsApp where integrated
* GPS/location
* Site-visit checklist
* Camera capture
* Phone document upload
* Voice-note transcription where supported
* Offline draft mode where feasible
* Calendar
* Follow-up reminders
* Quick inventory search
* Client history
* Commission dashboard

# 6. INVENTORY, OWNERSHIP, AUTHORIZATION & LISTING OPERATIONS

Every inventory/listing record must distinguish inventory owner, authorized seller, platform publisher, assigned sales organization, assigned agent, exclusive/non-exclusive sales right, contract reference, authorization dates and verification status.


## 6.1 Inventory models

| Model | Examples |
| --- | --- |
| Unique item | Used vehicle VIN, machine serial number. |
| Stock quantity | Retail products, electronics, building materials. |
| Unit inventory | Apartment/unit/building/room inventory. |
| Variant inventory | Color/size/configuration combinations. |
| Project | Real-estate development or construction project. |
| Service capacity | Consulting, installation, logistics. |
| Quotation-based | Elevators, industrial systems, engineering. |
| Rental asset | Vehicle/equipment/property rental. |


## 6.2 Listing lifecycle

DRAFT → VALIDATION → PENDING REVIEW → APPROVED → PUBLISHED                     ↓                 ↓                 CORRECTION         REJECTEDPUBLISHED → PAUSED / EXPIRED / SOLD / RENTED / ARCHIVED


## 6.3 Partner publishing rights

A partner can publish only domains/categories enabled by the provider. Example: a partner may have Real Estate Residential Apartments enabled while Land and Automotive are disabled. Provider can change these permissions at any time.


# 7. DOMAIN CATALOG & DOMAIN-AGNOSTIC IMPLEMENTATION

The supplied master specification defines a broad domain catalog. The platform should implement these as configuration packages rather than hard-coded application forks.

| Domain | Scope |
| --- | --- |
| Real Estate | Residential apartments/houses/villas, commercial, land, rental, projects, short stay. Core workflow: Inquiry → Qualification → Matching → Presentation → Site Visit → Follow-up → Negotiation → Reservation → Documentation → Contract → Payment → Handover → Referral. |
| Automotive | Cars, SUVs, MPV/vans, pickups, commercial trucks/buses, motorcycles, special-purpose vehicles, parts/accessories. Core data includes VIN/stock, vehicle condition, service history, inspection, warranty and cash/finance terms. |
| General Commerce / E-commerce | Electronics, home, fashion, beauty, sports, office, tools, industrial products. Supports SKU, barcode, variants, stock, warehouse/bin, pricing, tax, discount, shipping and return/refund policies. |
| Elevators & Vertical Transportation | Passenger, home, hospital, freight, service, panoramic, vehicle elevators, platform/stair lifts, escalators and moving walkways. Supports technical specification, survey, quotation, contract, procurement, installation, testing, handover and maintenance. |
| Construction & Heavy Equipment | Excavators, loaders, bulldozers, graders, cranes, rollers, forklifts, generators, compressors, drilling/mining equipment and tractors. |
| Electronics & Technology | Phones, tablets, laptops, desktops, monitors, TVs, cameras, networking, servers, printers, storage, components and smart home. |
| Agriculture & Farming | Agricultural land, tractors, harvesters, planters, irrigation, pumps, greenhouse systems, livestock equipment and farm tools. |
| Solar, Energy & Power | Solar panels, inverters, batteries, charge controllers, complete systems, generators, UPS, transformers and electrical equipment. |
| Industrial & Business Equipment | Manufacturing machinery, pumps, compressors, generators, HVAC, refrigeration, packaging, food-processing and laboratory equipment. |
| Professional & Business Services | Software, IT, consulting, construction services, installation, maintenance, logistics, design, marketing, training and engineering. |
| Building Materials & Home Improvement | Cement/concrete products, steel, blocks, tiles, flooring, roofing, doors/windows, paint, plumbing, electrical materials, sanitary ware and kitchen systems. |
| Logistics / Transport Services | Freight, moving, courier, vehicle transport, warehousing and last-mile delivery. |


# 8. CONFIGURATION-FIRST PLATFORM

The administration layer is the control plane of the entire product. It must support platform-wide defaults, domain overrides, organization overrides, category overrides, role/user permissions and individual listing overrides.


## 8.1 Feature state model

| State | Behavior |
| --- | --- |
| ON | Visible and usable. |
| OFF | Disabled. |
| READ ONLY | Visible but cannot be changed by current role. |
| HIDDEN | Not displayed in current context. |
| CONDITIONAL | Shown only when a rule evaluates true. |
| BETA | Enabled for selected tenants/users. |
| REQUIRES APPROVAL | Action creates an approval request. |


## 8.2 Inheritance

PLATFORM DEFAULT   ↓DOMAIN OVERRIDE   ↓ORGANIZATION OVERRIDE   ↓CATEGORY OVERRIDE   ↓LISTING / CONTEXT OVERRIDE

The effective configuration resolver evaluates the hierarchy in deterministic order and records the source of each resolved value so administrators can understand why a setting is active.


## 8.3 No-code domain builder

* Create domain, slug, icon, branding and status.
* Choose currency, measurement system and timezone.
* Create category tree.
* Create attribute groups and fields with validation.
* Create category templates.
* Choose listing card fields and detail-page sections.
* Choose search filters and sorting.
* Configure inquiry and lead qualification forms.
* Create sales pipeline, appointment types and quotation template.
* Define media/document requirements.
* Define moderation and verification.
* Configure SEO templates and notifications.
* Enable/disable modules.
* Preview and publish the domain.

# 9. SETTINGS PLATFORM — THOUSANDS OF CONFIGURATIONS WITHOUT CHAOS

The requested settings architecture is a first-class subsystem, not a giant static settings page. It must remain usable when the platform contains thousands of keys, rules, templates, overrides, integrations and policy records.


## 9.1 Settings registry

| Concept | Implementation |
| --- | --- |
| Setting definition | Stable key, data type, label, description, category, sensitivity, allowed scopes, validation schema, default. |
| Setting value | Stored value at a specific scope and owner. |
| Scope | Platform, domain, organization, branch, role, user, category, listing/context. |
| Source | Default, inherited, overridden, contract-derived or rule-derived. |
| Version | Revision number and effective timestamps. |
| Validation | Type + schema + cross-setting constraints. |
| Audit | Who changed it, why, when, previous/new value. |
| Dependency | Required features, settings or permissions. |
| Secret | Stored through secret-management mechanism, never plain-text in ordinary settings UI. |
| Environment | Development/staging/production where relevant. |


## 9.2 Settings UI

* Global Settings home with search, favorites, recently changed, pending approvals and health indicators.
* Left navigation by setting family with counts and status indicators.
* Universal settings search by name, key, description, domain, module or tag.
* Filter by scope, state, sensitivity, owner, last changed date and environment.
* Detail view showing effective value, inherited source and override chain.
* Compare current value against inherited/default value.
* Preview impact before saving.
* Bulk edit for safe, compatible setting groups.
* Import/export configuration packages with validation and dry-run.
* Change history with rollback for approved reversible settings.
* Approval queue for sensitive changes.
* Conflict/dependency warnings.
* Configuration templates for domains, partners and business packages.

## 9.3 Settings data model

settings_definitionssettings_valuessettings_scopessettings_overridessettings_versionssettings_dependenciessettings_validationssettings_approvalssettings_audit_logssettings_templatessettings_import_jobssettings_export_jobs


## 9.4 Example keys

* platform.general.timezone
* platform.general.default_currency
* platform.marketplace.public_registration
* platform.security.mfa_required
* platform.media.max_upload_mb
* domain.real_estate.listing.require_title_status
* domain.real_estate.lead.sla_minutes
* category.used_car.require_vin
* organization.partner_123.feature.advanced_crm
* organization.partner_123.commercial.plan_id
* commission.real_estate.success_fee.trigger
* notifications.lead.assignment.escalation_hours
* theme.public.default
* theme.partner.allow_custom_branding

## 9.5 Theme changer

Theme is part of settings, but should be modeled as a dedicated design-token system. The product must provide a theme changer in Settings with immediate preview and safe persistence.

* Light / dark / system mode, if enabled by platform policy.
* Monochromatic light default theme for the product.
* Neutral grayscale design tokens with a restrained accent.
* Typography scale, spacing, radius, shadows, borders and density tokens.
* Role-aware branding where permitted: provider, partner and domain themes.
* Accessibility checks for contrast and focus states.
* Theme presets + custom token editing for authorized administrators.
* Preview before publish.
* Scope-aware themes: platform → domain → organization → user.
* Do not allow arbitrary custom CSS for ordinary administrators; use controlled tokens.

# 10. UX / UI DESIGN SYSTEM

The default interface is monochromatic, light, calm and information-dense without feeling crowded. The design should communicate professional B2B software rather than a colorful consumer dashboard.


## 10.1 Visual language

| Element | Direction |
| --- | --- |
| Base palette | White/off-white surfaces, neutral grays, near-black text, subtle borders. |
| Accent | One restrained configurable accent used for primary actions and status emphasis. |
| Cards | Low visual noise, consistent radius, minimal shadow, clear hierarchy. |
| Typography | Modern sans-serif, strong numeric readability for dashboards. |
| Tables | Dense but breathable; sticky headers, column controls and saved views. |
| Forms | Progressive disclosure, inline validation, grouped sections, autosave for safe drafts. |
| Feedback | Toast for minor success, inline errors for actionable problems, banners for system-level issues. |
| Navigation | Contextual sidebar + breadcrumbs + global command/search. |
| Mobile | Bottom action bar or compact toolbar for high-frequency field operations. |


## 10.2 Core UX principles

* Every screen has one obvious primary action.
* Do not make users navigate through settings to perform common operational work.
* Use contextual actions near the record being acted upon.
* Keep financial and permission-sensitive actions visibly distinct.
* Preserve filters, table views and workspace state.
* Use empty states that explain what to do next.
* Support keyboard navigation for desktop power users.
* Use optimistic UI only where rollback is safe; financial state changes remain confirmed.
* Every long workflow shows progress and required blockers.
* Every configuration page explains scope and inheritance.

# 11. PUBLIC CLIENT EXPERIENCE

* Mobile-first responsive design.
* Fast search with advanced filters.
* List/map toggle where location applies.
* Favorites, comparison and saved searches.
* Price and availability alerts.
* Recently viewed.
* Personalized recommendations.
* Media-rich product/listing detail pages.
* Seller/company profiles and verification badges.
* Chat/contact and appointment booking.
* Quote request.
* Shareable URLs and social preview cards.
* Client dashboard.

## 11.1 Detail-page builder

* Hero media
* Price block
* Availability badge
* Verification badge
* Key specification strip
* Description
* Specification groups
* Feature list
* Media gallery
* Video / 360°
* Documents
* Location/map
* Seller profile
* Reviews
* FAQ
* Related/similar inventory
* Compare/favorite/share
* Contact / WhatsApp / call
* Request quote
* Book appointment
* Custom CTA

# 12. CRM, FORMS, WORKFLOWS & AUTOMATION


## 12.1 Unified CRM

* Customer profile
* Lead capture from web/ads/social/import/referral/manual
* Domain-specific requirements
* Lead scoring
* Assignment
* Tasks/reminders
* Notes/calls/messages
* Interaction timeline
* Pipeline/deal management
* Lost reasons and competitor tracking
* Follow-up automation
* Consent/communication preferences

## 12.2 Workflow engine

| Block | Examples |
| --- | --- |
| Stage | Inquiry, Qualification, Site Visit, Proposal, Contract, Delivery. |
| Entry condition | Lead has required source/category. |
| Exit condition | Required action completed. |
| Required fields/docs | Property ID, survey, VIN, technical specification. |
| Approval | Manager/partner/provider approval. |
| Automation | Create task, notify, webhook. |
| Timer/SLA | Contact lead within configured period. |
| Escalation | Manager after SLA breach. |
| Assignment | Round-robin, weighted, geography, expertise. |
| Conditional branch | Different path by category, price or deal type. |


## 12.3 Form builder

* Drag-and-drop fields
* Conditional questions
* Required/optional
* Domain/category forms
* Lead/contact/quote/site visit/inspection/technical survey forms
* Seller and agent onboarding
* Custom forms
* Spam protection
* Rate limiting
* Consent
* Webhook/API submission

# 13. MARKETING, ADVERTISING & CMS

* Campaigns by domain, category and listing.
* Objective, audience, budget, creative and landing page.
* UTM tracking and lead attribution.
* Conversion events and cost-per-lead / qualified-lead / appointment / acquisition.
* Revenue and commission attribution.
* Retargeting integrations where supported.
* Content calendar and A/B testing.
* Campaign approval workflow.
* Drag-and-drop landing page builder.
* Reusable content blocks and templates.
* Scheduled publishing.
* SEO controls.
* Blog/CMS.

# 14. SEARCH, FILTERING & MATCHING ENGINE


## 14.1 Search builder

* Attribute-based filters
* Range/select/map/date/numeric filters
* Filter ordering and importance
* Saved filter presets
* SEO landing pages from approved combinations
* Sorting by price/newest/popularity/distance/relevance/domain score
* Synonyms and search aliases
* No-result and popular-search analytics

## 14.2 Matching engine

* Configurable weights
* Exact match
* Range tolerance
* Location radius
* Budget tolerance
* Must-have vs nice-to-have
* Exclude unavailable
* Boost verified/featured inventory
* Explain why an item matched
* Domain/category-specific tuning

# 15. UNIVERSAL MEDIA & DOCUMENT SYSTEM

* Images
* Video
* 360° / panorama
* Audio
* PDF brochures
* Certificates
* Contracts
* Inspection reports
* Technical drawings
* CAD/BIM where infrastructure supports them
* Spreadsheets/price lists
* Future 3D models

## 15.1 Media rules

* Minimum/maximum image count
* Required image roles
* Video count/duration
* Required documents
* File size and MIME restrictions
* Watermark policy
* Public/private policy
* Optimization and thumbnails
* Video transcoding
* CDN delivery
* Alt text/caption
* Copyright/ownership
* Document expiry

## 15.2 Upload UX

* Drag/drop
* Multiple selection
* Mobile camera capture
* Progress
* Retry
* Chunked uploads
* Compression
* Orientation
* Duplicate detection
* Bulk metadata editing
* Reordering
* Bulk tagging
* Collections/folders
* Version history

# 16. VERIFICATION, MODERATION, TRUST & SECURITY


## 16.1 Separate approvals

* Partner approval
* Domain approval
* Category approval
* Listing approval
* Document verification
* Promotion approval
* Commercial agreement approval

## 16.2 Security baseline

* Tenant isolation
* RBAC + ABAC where needed
* MFA
* Secure sessions
* Rate limiting
* CSRF/XSS/SQL injection protection
* Secure file scanning
* Private document URLs
* Encryption in transit and appropriate encryption at rest
* Backups/disaster recovery
* Data retention
* Consent/opt-out
* PII minimization
* Audit logs

## 16.3 Sensitive financial access

Provider salespeople must not automatically receive partner financial data. Financial contract visibility, ledger visibility, settlement controls and exports are separately permissioned.


# 17. MODERN TECHNICAL ARCHITECTURE

The source specification recommends a component-based responsive frontend, modular backend/service architecture, PostgreSQL with JSON/JSONB where appropriate, separate object storage, optional dedicated search, background jobs, caching, CDN and observability. The implementation below turns that direction into a concrete modern stack.

| Layer | Recommended stack | Role |
| --- | --- | --- |
| Web frontend | Next.js + React + TypeScript | Public marketplace, admin, partner and sales workspaces. |
| UI | Tailwind CSS + accessible component system such as shadcn/ui | Monochromatic design system and reusable components. |
| Forms | React Hook Form + Zod | Typed forms and validation. |
| Data fetching | TanStack Query | Server-state caching and mutation lifecycle. |
| Backend | NestJS + TypeScript | Modular API, authorization, workflows and business services. |
| API | REST first; GraphQL optional for selected read-heavy clients | Stable versioned service boundary. |
| Database | PostgreSQL | Relational source of truth; JSONB for controlled dynamic attributes/config payloads. |
| ORM/query | Prisma or Drizzle (choose one before implementation) | Typed persistence layer. |
| Cache | Redis | Caching, rate limiting, locks and short-lived state. |
| Jobs | BullMQ/Redis or equivalent queue | Media processing, notifications, imports, indexing and scheduled tasks. |
| Object storage | S3-compatible storage | Media/documents; never store large files in PostgreSQL. |
| CDN | Cloud CDN provider | Public media and cacheable assets. |
| Search | PostgreSQL FTS initially; OpenSearch/Elasticsearch when justified by scale | Search, faceting and relevance. |
| Observability | OpenTelemetry + metrics/logging/error tracking | Tracing and operational visibility. |
| Deployment | Docker + CI/CD; managed PostgreSQL/Redis/object storage | Repeatable production delivery. |
| Auth | OIDC/OAuth-compatible identity layer or managed auth | MFA, sessions, organizations and SSO readiness. |


## 17.1 Architecture rule

Start as a modular monolith, not microservices. The domain boundaries must be explicit in code so modules can later be extracted if scale or organizational needs justify it. Premature microservices would add deployment and data-consistency complexity before the business model is proven.


## 17.2 Core backend modules

* Identity & Access
* Organizations/Tenants
* Domains & Categories
* Configuration/Settings
* Attributes
* Inventory
* Media/Documents
* Search
* Customers/CRM
* Leads & Attribution
* Assignments
* Appointments
* Quotes
* Deals
* Workflow
* Contracts
* Fees/Commissions
* Ledger
* Billing
* Payments
* Settlements
* Marketing/CMS
* Notifications
* Analytics
* Verification/Moderation
* Integrations
* Audit

# 18. POSTGRESQL DATA ARCHITECTURE

Use normalized relational tables for core entities and structured attribute-definition/value tables for domain-specific fields. JSONB is appropriate for flexible payloads and some configuration documents, but the source specification explicitly cautions against putting every dynamic field into one unstructured JSON blob.


## 18.1 Core schemas

identity.*organizations.*configuration.*domains.*inventory.*media.*crm.*sales.*commercial.*finance.*marketing.*content.*notifications.*integrations.*audit.*


## 18.2 Key tables

| Schema | Tables |
| --- | --- |
| organizations | tenants, organization_relationships, branches, memberships |
| identity | users, roles, permissions, role_permissions, sessions, mfa_methods |
| domains | domains, domain_settings, categories, category_templates, attribute_definitions, attribute_options, category_attributes |
| inventory | listings, listing_attribute_values, variants, inventory_items, stock_movements, ownership_authorizations |
| media | media_assets, media_links, documents, document_versions |
| crm | customers, leads, lead_requirements, lead_activities, tasks, conversations, messages |
| sales | pipelines, pipeline_stages, assignments, appointments, quotations, deals, deal_items |
| commercial | plans, plan_features, entitlements, contracts, contract_versions, fee_rules, fee_events, commission_rules, commission_transactions |
| finance | financial_ledger, invoices, invoice_items, payments, settlements, credits, credit_transactions, adjustments |
| marketing | campaigns, campaign_assets, landing_pages, attribution_events |
| trust | verification_requests, verification_records, approval_requests, disputes |
| platform | settings_definitions, settings_values, feature_flags, notification_rules, integrations, webhooks, audit_logs |


## 18.3 Multi-tenancy strategy

Recommended initial strategy: shared PostgreSQL database with explicit organization_id/tenant_id on tenant-owned tables, strong service-layer authorization, database constraints and automated tests. For high-sensitivity tables, add PostgreSQL Row Level Security where it materially improves defense in depth. Never rely on frontend hiding.


## 18.4 Indexing

* Composite indexes beginning with tenant_id for tenant-scoped high-volume tables
* Unique indexes scoped by organization/domain where required
* Partial indexes for active/published records
* GIN indexes for selected JSONB/search fields
* Time-based indexes for event/ledger tables
* Foreign-key indexes
* Full-text indexes before adding a dedicated search cluster

# 19. API & INTEGRATION CONTRACT


## 19.1 API rules

* Version APIs
* Use consistent pagination/filter/sort conventions
* Idempotency keys for financial/webhook-sensitive operations
* Structured error codes
* Correlation/request IDs
* Authorization on every mutation and protected read
* Optimistic concurrency/version checks for configuration and financial changes
* Rate limits by actor/client
* OpenAPI documentation

## 19.2 Events

* lead.created
* lead.assigned
* appointment.booked
* listing.submitted
* listing.approved
* listing.published
* deal.stage_changed
* deal.closed
* payment.received
* payment.reversed
* commission.earned
* invoice.issued
* settlement.created
* document.expired
* subscription.expired

## 19.3 Webhooks

Partners and external systems can subscribe only to events permitted by their entitlement and API scope. Webhooks must be signed, retried, idempotent and observable.


# 20. IDENTITY, ROLES & FINE-GRAINED PERMISSIONS

| Role | Typical scope |
| --- | --- |
| Super Admin | Global platform. |
| Platform Operations | Global operational modules. |
| Domain Admin | Specific domain configuration. |
| Tenant/Organization Admin | Organization. |
| Branch Manager | Branch. |
| Sales Manager | Sales team. |
| Sales Agent | Assigned customers/leads/deals. |
| Marketing Manager | Campaigns/content. |
| Inventory Manager | Inventory. |
| Content Editor | Content. |
| Finance | Finance. |
| Support | Support. |
| Moderator | Content approvals. |
| Verifier/Inspector | Verification. |
| Customer | Own client experience. |
| Seller/Vendor | Own authorized inventory. |

Permissions should be action-based: view, create, edit, delete, publish, approve, export, download, assign, contact, refund, configure and manage permissions. Permission evaluation should combine role, tenant, resource scope, domain/category scope, record assignment and contextual policies where needed.


# 21. ADMIN CONTROL ROOM


## 21.1 Recommended navigation

Dashboard | Domains | Categories | Attributes | Inventory | Media | Leads | CRM | Sales |Appointments | Quotes | Customers | Organizations | Agents | Marketing | CMS | Analytics |Commissions | Finance | Verification | Integrations | Settings | Audit Logs


## 21.2 Control-room dashboard

* Global health
* Feature flags
* Active domains
* Inventory status
* Lead volume
* System alerts
* Pending approvals
* Failed imports
* Storage usage
* Integration status
* Security events
* Recent configuration changes

## 21.3 Partner dashboard

* Inventory count
* Active listings
* Pending approvals
* Leads
* Appointments
* Deals
* Conversion rate
* Sales value where permitted
* Platform fees
* Subscription status
* Usage limits
* Team activity
* Agent performance
* Marketing performance

# 22. PARTNER / SELLER PORTAL

* Dashboard
* My Company
* Branches
* Team
* Inventory
* Media
* Leads
* Customers
* Appointments
* Deals
* Quotes
* Marketing
* Analytics
* Billing
* Contract
* Usage
* Support

## 22.1 Partner self-service boundary

Partner users may manage their company profile, own users, listings and permitted categories within the provider-defined scope. They cannot unilaterally change platform fees, global domains, their commercial contract or global search rules. Branding and API access are configurable but provider-controlled.


# 23. BULK INVENTORY, IMPORTS & DATA QUALITY

* CSV/Excel import
* API inventory feed
* Bulk media upload
* Bulk price update
* Bulk availability update
* Bulk archive
* Validation report
* Duplicate detection
* Approval queue
* Scheduled synchronization

## 23.1 Import pipeline

UPLOAD → PARSE → MAP FIELDS → VALIDATE → DUPLICATE CHECK → PREVIEW → APPROVE → COMMIT → INDEX → REPORT

Imports must be resumable, observable and safe. Failed rows should not invalidate successful rows unless the selected import policy requires atomic behavior. Financial or authorization-sensitive imports require explicit approval.


# 24. NOTIFICATIONS & AUTOMATION

| Trigger | Possible actions |
| --- | --- |
| New lead | In-app, email, SMS/WhatsApp where integrated, task. |
| Assignment | Notify agent; start SLA timer. |
| Appointment | Confirmation, reminder, reschedule notice. |
| Listing change | Notify subscribers or partner. |
| Stock low | Partner/inventory manager alert. |
| Document expiry | Owner + manager reminder; escalation. |
| Deal stage change | Task, notification, webhook. |
| Payment | Receipt, invoice state, reconciliation alert. |
| SLA breach | Escalate to manager. |
| Subscription expiry | Warnings, grace period, enforcement. |

Automation rules support conditions by domain, category, agent and customer segment, delayed actions, reminders, escalation and stop conditions when a record converts or a user opts out.


# 25. ANALYTICS & REPORTING

* Executive dashboard
* Domain performance
* Category performance
* Inventory aging
* Lead funnel
* Source attribution
* Agent performance
* Campaign ROI
* Listing performance
* Search behavior
* No-result searches
* Appointment conversion
* Deal conversion
* Commission
* Revenue
* Customer retention/referrals
* Partner churn
* MRR/ARR where applicable
* Outstanding settlements

## 25.1 Analytics architecture

Operational queries remain in PostgreSQL. Add materialized views or reporting tables for heavy recurring dashboards. Introduce a warehouse/event analytics system only after real volume and reporting requirements justify it. Do not turn the transactional database into an unbounded analytics workload.


# 26. CONTROLLED AI LAYER — OPTIONAL

* Listing description assistance
* Lead summarization
* Suggested next action
* Search query understanding
* Recommendation explanations
* Document extraction where legally and technically appropriate
* Sales note summarization
AI must be feature-flagged, entitlement-aware, privacy-controlled and auditable. Sensitive financial decisions and contractual calculations must remain deterministic and rule-driven.


# 27. BUSINESS RULES ENGINE

Use a declarative rules model for conditions and actions while keeping a safe execution boundary. Example rules from the supplied business specification include premium-plan feature activation, required real-estate developer data, required used-car VIN/stock identifier, elevator technical quotation workflow, subscription-expiry enforcement, deal-close commission creation and payment-reversal commission reversal.

WHEN partner.plan == PREMIUMTHEN entitlement.analytics.advanced = trueWHEN listing.category == USED_CARTHEN require(vin_or_stock_identifier)WHEN deal.status == CLOSEDTHEN create_commission_ledger_entry()WHEN payment.status == REVERSEDTHEN create_contractual_commission_reversal()

Rules must have version, effective date, scope, owner, status, test cases and audit history. Financial rules require extra approval and should be executable deterministically.


# 28. DISPUTES, CLAWBACKS & CHANGE PROTECTION

* Partner can dispute a fee.
* Provider reviews evidence.
* Lead timeline proves attribution.
* Deal timeline proves milestones.
* Contract version is attached to calculation.
* Commission may be held while disputed.
* Approved adjustment creates a ledger adjustment rather than silently editing history.
* Dispute states: opened, under review, accepted, rejected, adjusted, closed.

## 28.1 Contract versioning

If a partner's commission changes, historical deals retain the contract version that governed them. New transactions use the new version. Historical statements remain reproducible.


# 29. SUBSCRIPTION & ENTITLEMENT ENFORCEMENT

Subscription expiry must not immediately delete inventory. Use warning notifications, configurable grace periods, publishing restrictions and optional visibility/lead-access restrictions. Renewal restores access. Provider override is possible for authorized administrators.


## Entitlement model

PLAN + CONTRACT + PROVIDER OVERRIDES + ORGANIZATION SETTINGS                         ↓                   EFFECTIVE ENTITLEMENTS                         ↓              SERVER-SIDE AUTHORIZATION CHECK

Entitlements are enforced server-side. Frontend hiding is only a presentation optimization.


# 30. WHITE-LABEL & PARTNER BRANDING

* Partner logo
* Partner profile page
* Custom contact details
* Branded listing pages
* Branded brochures
* Partner subdomain
* Optional custom domain
* Provider branding requirement according to plan/contract
Branding must use controlled design tokens. The provider can restrict which tokens partners can change. This keeps the platform visually coherent while enabling partner identity.


# 31. MARKETPLACE, AGENCY & HYBRID MODES

| Mode | Behavior |
| --- | --- |
| Marketplace | Partner owns inventory and handles the sale; platform earns agreed platform fees. |
| Agency / Sales-assisted | Provider sales team actively handles buyer; separate sales commission may apply. |
| Hybrid | Buyer chooses partner contact or requests provider assistance. |

Mode is part of the commercial and operational context of the listing/partner relationship, not simply a UI toggle.


# 32. SECURITY, PRIVACY & DATA GOVERNANCE


## 32.1 Security architecture

* Least privilege
* Tenant boundary checks
* Server-side authorization
* MFA
* Session rotation/revocation
* Rate limiting
* Input/schema validation
* Parameterized queries/ORM safeguards
* File malware scanning
* Signed private document URLs
* Secrets manager
* Encryption in transit
* Encryption at rest where appropriate
* Backup encryption
* Audit logs
* Security alerting

## 32.2 Data governance

* Explicit data ownership
* Consent and communication preferences
* Retention policies
* Deletion/anonymization workflows where permitted
* Export controls
* Private financial records
* Document access logging
* Partner-to-partner data separation

# 33. DEVOPS, ENVIRONMENTS & OBSERVABILITY

| Environment | Purpose |
| --- | --- |
| Local | Developer workflow with seeded configuration. |
| Development | Integrated feature development. |
| Staging | Production-like verification and acceptance. |
| Production | Customer/business operation. |


## CI/CD

* Lint/typecheck
* Unit tests
* Integration tests
* Database migration validation
* API contract tests
* Build
* Security/dependency scan
* Container build
* Staging deploy
* Smoke tests
* Manual approval for production
* Rollback plan

## Observability

* Structured logs
* Metrics
* Distributed traces
* Error tracking
* Queue health
* Database performance
* Storage health
* Integration/webhook failures
* Security events
* Configuration-change feed

# 34. TESTING & QUALITY GATES

| Area | Minimum acceptance |
| --- | --- |
| Authorization | Cross-tenant access tests fail safely. |
| Configuration | Inheritance and overrides resolve deterministically. |
| Financial | Same inputs produce deterministic calculations. |
| Contract versioning | Historical calculations remain unchanged. |
| Inventory | Ownership and sales authorization cannot be bypassed. |
| Workflow | Required actions block invalid transitions. |
| Media | Large/invalid uploads are rejected safely. |
| Imports | Validation and duplicate detection work at scale. |
| API | Idempotency and permission checks are tested. |
| UX | Mobile and desktop critical journeys are usable. |
| Performance | Defined p95 targets are met for core operations. |
| Recovery | Backup restore is tested, not merely configured. |


## 34.1 Definition of Done

* Requirements implemented
* Database migration reviewed
* API documented
* Authorization tests
* Unit/integration tests
* Error states
* Loading/empty states
* Audit events
* Telemetry
* Accessibility review
* Responsive review
* Security review
* Rollback plan

# 35. PHASE-BY-PHASE BUILD ROADMAP

Do not attempt to build the entire mature platform at once. The roadmap below establishes a safe sequence. Each phase produces a usable increment and creates infrastructure needed by later phases.

| Phase | Scope | Exit gate |
| --- | --- | --- |
| Phase 0 — Product Foundation | Lock terminology, architecture, UX system, repo structure, environments, CI/CD, coding standards, security baseline, database conventions and configuration strategy. | Architecture approved; CI passes; design tokens exist; environment bootstraps repeatably. |
| Phase 1 — Identity & Tenant Core | Users, organizations, memberships, roles, permissions, tenant isolation, sessions, MFA foundation, audit events. | Provider can create organizations and users with tested tenant boundaries. |
| Phase 2 — Configuration Control Plane | Settings registry, scoped values, inheritance, feature flags, approvals, versioning, theme changer and configuration audit. | Admin can safely configure hundreds/thousands of settings without code changes. |
| Phase 3 — Domains, Categories & Attributes | Domain builder, category builder, attribute definitions/options, templates, validation and search/filter metadata. | Provider can create a new domain/category without changing backend entity tables. |
| Phase 4 — Inventory & Media | Listings, variants, inventory items, ownership authorization, media library, document system, upload UX and moderation. | Partner can publish governed inventory through the portal. |
| Phase 5 — Public Marketplace | Search, filters, detail pages, seller profiles, favorites, comparison, saved searches, contact and appointment requests. | A buyer can discover inventory and create a lead. |
| Phase 6 — CRM & Sales | Customers, leads, attribution, assignment, activities, tasks, appointments, pipelines, deals and agent workspace. | Provider/partner sales teams can run an end-to-end sales process. |
| Phase 7 — Workflow & Automation | Workflow builder, SLA timers, escalation, notifications, forms and rule-driven actions. | Business processes become configurable by domain. |
| Phase 8 — Commercial Engine | Plans, entitlements, contracts, contract versions, fee rules, commission rules, financial ledger and disputes. | Platform can calculate commercial obligations deterministically. |
| Phase 9 — Billing & Settlement | Invoices, payments, credits, settlement statements, reconciliation and adjustments. | Provider can operate monetization and settlement workflows. |
| Phase 10 — Marketing & CMS | Campaigns, attribution, landing pages, content, SEO, promotions and analytics. | Marketing becomes a measurable acquisition channel. |
| Phase 11 — Integrations & Scale | Webhooks, partner API, imports, search service, queues, CDN, caching and advanced observability. | Platform supports larger partner operations and external systems. |
| Phase 12 — Domain Expansion | Package domain templates for automotive, elevators, commerce, heavy equipment, energy and other domains. | New verticals become configuration packages rather than forks. |
| Phase 13 — Enterprise Hardening | Advanced security, SSO, advanced audit, disaster recovery, performance engineering, data warehouse and enterprise controls. | Platform is ready for large organizations and operational scale. |


# 36. PHASE 0–3: FOUNDATION TO CONFIGURABLE CORE


## Phase 0 deliverables

* Monorepo or clearly separated apps/packages
* Next.js/React frontend
* NestJS backend
* PostgreSQL
* Redis
* Object storage integration
* Docker Compose local environment
* CI pipeline
* Environment configuration
* Design-token library
* API error conventions
* Logging/tracing foundation
* Migration strategy

## Phase 1 deliverables

* User registration/login
* Organization creation
* Memberships
* Role/permission engine
* Provider admin shell
* Tenant-scoped repository patterns
* Audit logging
* MFA foundation
* Session management

## Phase 2 deliverables

* Settings registry
* Typed values
* Scope resolver
* Inheritance chain
* Feature flags
* Approval workflow
* Theme changer
* Configuration audit/history
* Import/export with dry-run
* Searchable settings catalog

## Phase 3 deliverables

* Domain CRUD
* Category tree
* Attribute groups
* Attribute types
* Validation rules
* Conditional visibility
* Category templates
* Search/filter metadata
* Detail-page section configuration
* Domain preview/publish

# 37. PHASE 4–7: INVENTORY TO SALES OPERATIONS


## Phase 4

Build the reusable listing/inventory model before implementing the full domain-specific taxonomies. Every inventory record must connect ownership, authorization, category, attributes, media, verification and publication state.


## Phase 5

Build the public client journey around search → detail → contact → lead. Optimize the fastest path to demand generation before adding secondary discovery features.


## Phase 6

Build the CRM around the user's real work: inbox, lead detail, next action, customer history, appointment, quote, negotiation and deal. Do not create a CRM that is merely a database of contacts.


## Phase 7

Turn repeated business behavior into configurable workflows and notifications. Use domain-specific templates to demonstrate how one engine can serve real estate, automotive and elevator/project sales.


# 38. PHASE 8–10: COMMERCIALIZATION & GROWTH


## Phase 8 — Financial core

This phase is a high-risk boundary. Freeze terminology and accounting semantics before implementation. Create contract versioning first, then fee rules, then commission calculation, then ledger events. Every calculation needs a reproducible explanation.


## Phase 9 — Billing

Connect invoice/payment events to the ledger. Reconciliation should expose mismatches rather than silently correcting them. Build settlement statements for partners and commission statements for agents.


## Phase 10 — Growth

Marketing and CMS should consume the same domain/category/inventory primitives. Campaign attribution must connect to leads, deals and commercial outcomes so marketing ROI can be measured.


# 39. PHASE 11–13: SCALE, DOMAINS & ENTERPRISE


## Scale triggers

| Trigger | Response |
| --- | --- |
| Search volume becomes complex | Introduce dedicated search engine. |
| Background jobs grow | Separate worker capacity and queue monitoring. |
| Public traffic grows | CDN + cache + read optimization. |
| Transactional DB becomes reporting bottleneck | Materialized reporting tables or warehouse. |
| Tenant sizes diverge greatly | Evaluate partitioning or tenant-specific deployment strategy. |
| Enterprise identity requirement | Add SSO/OIDC/SAML layer. |
| Large media volume | Optimize object storage/CDN lifecycle. |


## Domain expansion

Each new domain should be delivered as a package: taxonomy, attributes, templates, workflows, forms, media rules, validation, search configuration, terminology, notification defaults and commercial rules. The core inventory/CRM/deal/ledger engines remain unchanged.


# 40. STANDARD PROCESS FOR ADDING A NEW DOMAIN

* Define business vocabulary and lifecycle.
* Create domain record.
* Define categories/subcategories.
* Define normalized core relationships needed by the domain.
* Define dynamic attributes.
* Mark attributes required/public/searchable/filterable/sortable.
* Define media/document requirements.
* Define verification requirements.
* Define listing/detail templates.
* Define search filters and ranking.
* Define inquiry/lead forms.
* Define pipeline and workflow.
* Define appointment/quote/inspection types.
* Define notifications and SLA.
* Define commercial model and fee triggers.
* Create test fixtures.
* Preview domain.
* Run acceptance tests.
* Publish.

# 41. REFERENCE END-TO-END WORKFLOWS


## 41.1 Real-estate partner

PARTNER APPLICATION→ VERIFICATION→ CONTRACT→ ENTITLEMENTS→ PROPERTY/PROJECT UPLOAD→ VALIDATION→ MODERATION→ PUBLISH→ BUYER INQUIRY→ ATTRIBUTION→ SALES ASSIGNMENT→ QUALIFICATION→ SITE VISIT→ FOLLOW-UP→ OFFER / RESERVATION→ CONTRACT / PAYMENT→ COMMISSION TRIGGER→ LEDGER→ SETTLEMENT→ PARTNER STATEMENT


## 41.2 Automotive

DEALER ONBOARDING → VEHICLE IMPORT → VIN/QUALITY VALIDATION → PUBLISH→ BUYER INQUIRY → TEST DRIVE → OFFER → FINANCE/QUOTE → RESERVATION→ PAYMENT / CONTRACT → DELIVERY → DEAL CLOSE → COMMISSION / SETTLEMENT


## 41.3 Elevator/project

LEAD → BUILDING INFORMATION → SITE SURVEY → TECHNICAL MEASUREMENT→ SPECIFICATION → PROPOSAL → QUOTATION → NEGOTIATION → CONTRACT→ PROCUREMENT/MANUFACTURING → DELIVERY → INSTALLATION → TESTING→ HANDOVER → MAINTENANCE


## 41.4 General commerce

BROWSE → PRODUCT → CART → CHECKOUT → PAYMENT → FULFILLMENT→ SHIPMENT → DELIVERY → REVIEW / RETURN


# 42. SETTINGS GOVERNANCE & OPERATING PROCEDURE


## 42.1 Change classification

| Class | Examples | Approval |
| --- | --- | --- |
| Low risk | Labels, display ordering, non-sensitive UI preferences. | Role-based or immediate. |
| Operational | SLA, notification timing, publishing rules. | Manager/admin depending on scope. |
| Security | MFA policy, session/rate limits, access rules. | Privileged approval. |
| Financial | Fee rates, commission triggers, settlement rules. | Two-person approval recommended. |
| Legal/content | Terms references, verification policies, retention. | Privileged approval + audit. |
| Infrastructure | Storage, integrations, environment-sensitive settings. | Engineering/operations approval. |


## 42.2 Safe configuration workflow

DRAFT → VALIDATE → IMPACT PREVIEW → APPROVAL (IF REQUIRED) → PUBLISH                                           ↓                                        AUDIT                                           ↓                                       MONITOR                                           ↓                                     ROLLBACK/ADJUST


## 42.3 Configuration packages

Allow administrators to export/import a domain configuration package containing categories, attributes, templates, workflows, forms, notification defaults, search rules and theme tokens. Imports must support dependency validation and dry-run reporting.


# 43. CORE SCREEN INVENTORY

| Audience | Screen | Purpose |
| --- | --- | --- |
| Provider | Control Room | Global health, alerts, approvals, revenue and operational status. |
| Provider | Organizations | Partner onboarding, verification, lifecycle and entitlements. |
| Provider | Contracts | Contract versions, scope, rates, approvals and attachments. |
| Provider | Commercial | Plans, fee rules, commission rules, ledger, invoices, payments, settlements. |
| Provider | Domains | Domain builder, category tree, attributes, templates, workflows. |
| Provider | Settings | Thousands of settings with search, inheritance, preview, audit and theme. |
| Partner | Workspace | Inventory, leads, customers, appointments, deals, billing and performance. |
| Sales | Lead Inbox | Assigned leads, SLA, next action, priority and quick contact. |
| Sales | Deal Workspace | Timeline, milestones, quote, approvals, documents and commercial state. |
| Public | Search | Fast search, filters, map/list, saved search. |
| Public | Detail | Media, specs, trust, seller, CTA and related inventory. |
| Finance | Settlement | Statement, ledger evidence, invoices, payment reconciliation and disputes. |


# 44. PERFORMANCE & SCALABILITY TARGETS

Set explicit service-level targets before production. The exact numbers should be validated against hosting and usage assumptions; the following are engineering targets rather than guarantees.

| Area | Initial target |
| --- | --- |
| Public page server response | p95 under ~500 ms for cacheable/read-heavy pages under expected load. |
| Core API reads | p95 under ~300–500 ms for common tenant-scoped reads. |
| Search | p95 under ~500 ms for common filtered searches. |
| Mutations | p95 under ~800 ms excluding external providers. |
| Background jobs | Visible queue latency and retry policy; no silent failures. |
| Uploads | Immediate client feedback; processing asynchronous for large media. |
| Availability | Define business-tier SLA before selling enterprise plans. |
| Recovery | Define RPO/RTO per environment and commercial tier. |


## Scale principles

* Cache public immutable/slow-changing data
* Paginate all lists
* Never load unbounded related records
* Use cursor pagination for high-volume event/ledger feeds
* Queue heavy processing
* Separate media from DB
* Use database indexes intentionally
* Measure before introducing distributed infrastructure

# 45. BACKUP, DISASTER RECOVERY & BUSINESS CONTINUITY

* Automated PostgreSQL backups
* Point-in-time recovery where supported
* Object storage versioning/lifecycle
* Encrypted backups
* Restore drills
* Infrastructure-as-code for rebuild
* Documented RPO/RTO
* Queue replay strategy
* Webhook replay/dead-letter handling
* Incident runbook
* Admin communication procedure
A backup is not considered operationally complete until a restore has been tested and the result recorded.


# 46. ENGINEERING DOCUMENTATION STANDARD

* Architecture decision records (ADR)
* Database ERD
* API/OpenAPI
* Permission matrix
* Settings catalog
* Event catalog
* Workflow catalog
* Commercial calculation examples
* Deployment runbook
* Incident runbook
* Backup/restore runbook
* Domain onboarding guide
* UX component catalog

## Code documentation

Document why a rule exists when the rule encodes business policy. Avoid comments that merely restate code. For financial calculations, include examples and invariants.


# 47. PRIORITIZED PRODUCT BACKLOG

| Priority | Backlog |
| --- | --- |
| P0 | Tenant isolation, auth, roles, permissions, audit, PostgreSQL schema, settings registry, domain/category/attributes, inventory, CRM lead flow, provider/partner boundaries. |
| P1 | Media, public marketplace, appointments, workflows, notifications, partner portal, sales workspace, contracts, fee rules, ledger. |
| P2 | Billing, settlements, credits, marketing, CMS, advanced search, bulk import/API, white-label. |
| P3 | Dedicated search, AI features, advanced analytics/warehouse, SSO, plugins, 3D/CAD enhancements. |


# 48. KEY RISKS & MITIGATIONS

| Risk | Mitigation |
| --- | --- |
| Over-hardcoding domains | Metadata-driven domains, templates and workflows. |
| Settings become unmanageable | Typed registry, scope, search, dependencies, audit, bulk operations. |
| Cross-tenant data leak | Server-side authorization, scoped repositories, automated isolation tests, optional RLS. |
| Financial disputes | Versioned contracts, deterministic rules, ledger evidence and disputes workflow. |
| Database JSON becomes unqueryable | Hybrid normalized + structured attributes + selective JSONB. |
| Premature microservices | Modular monolith first; extract only when justified. |
| Poor field-sales adoption | Mobile-first lead inbox, quick actions and offline drafts where feasible. |
| Media costs grow | Object storage + CDN + optimization + lifecycle policies. |
| Integration failures | Queues, retries, idempotency, dead-letter queues and observability. |
| Feature creep delays launch | Phase gates and P0/P1/P2 prioritization. |


# 49. MASTER RELEASE GATES

* Provider can create a partner.
* Partner cannot access another partner's private data.
* Provider can grant a domain/category to a partner.
* Partner can create authorized inventory.
* Inventory can be validated, moderated and published.
* Buyer can search and create a lead.
* Lead is attributed and assigned according to configured rules.
* Agent can execute follow-up and appointments.
* Deal can progress through a configurable workflow.
* Contract version is captured at commercial calculation time.
* Commission trigger produces a deterministic ledger event.
* Disputes create adjustments instead of silent history edits.
* Settings can be overridden by scope and resolved visibly.
* Theme changer works without custom CSS.
* Critical settings are auditable and approval-protected.
* API permissions and webhooks are entitlement-aware.
* Backups restore successfully.
* Core flows pass automated authorization and regression tests.

# 50. FINAL BUILD INSTRUCTION — THE PATH THE ENGINEERING TEAM SHOULD FOLLOW

Build the platform as a modular, configuration-first SaaS product. Do not start by implementing all twelve domains. Start by building the reusable primitives that make every later domain cheaper: identity, tenancy, permissions, configuration, domains, categories, attributes, inventory, media, CRM, workflows and commercial records.

Use PostgreSQL as the transactional foundation, with a disciplined hybrid data model. Use a modern React/Next.js TypeScript frontend with a monochromatic light design system, responsive layouts and a dedicated theme changer. Use a modular NestJS backend, Redis for cache/queue support, object storage for media, background workers for expensive tasks, CDN for public assets and observability from the beginning.

Treat Settings as a platform subsystem. A setting is not just a row containing key/value. It has a definition, type, scope, inheritance, validation, dependency, sensitivity, version and audit history. The UI must make effective values and their sources understandable. This is what allows thousands of configurations without turning the system into an unmaintainable control panel.

Treat money as evidence. Contracts are versioned. Fee rules are versioned. Commission triggers are explicit. Ledger entries are traceable. Adjustments are additive/compensating. Settlement statements are reproducible. Partner financial privacy is enforced.

Treat domains as packages. Real estate is the first proving ground, but the core application should not become a real-estate application with unrelated modules bolted on. Automotive, commerce, elevators, heavy equipment, energy and services should all reuse the same product/listing, customer, lead, workflow, media, deal and commercial primitives.

The implementation should proceed phase by phase. Do not advance a phase because screens exist; advance only when its exit criteria, authorization tests, data integrity, UX states, observability and operational controls are complete.


# APPENDIX A — INITIAL PROJECT STRUCTURE

apps/  web/                 # Next.js public + authenticated web  api/                 # NestJS modular backend  worker/              # background jobspackages/  ui/                  # design system  config/              # shared config contracts  types/               # shared TypeScript contracts  validation/          # Zod schemas / shared validation  eslint-config/  tsconfig/infra/  docker/  terraform/           # optional later  monitoring/database/  migrations/  seeds/docs/  adr/  api/  workflows/  settings/  domains/


# APPENDIX B — FIRST DATABASE MIGRATION ORDER

* extensions / UUID / timestamps conventions
* users / sessions / MFA
* organizations / branches / memberships
* roles / permissions / role_permissions
* audit_logs
* settings_definitions / settings_values / settings_versions
* feature_flags
* domains / categories
* attribute_definitions / options / category_attributes / values
* listings / variants / inventory_items / ownership_authorizations
* media_assets / media_links / documents
* customers / leads / activities / tasks
* pipelines / stages / assignments / appointments / quotes / deals
* plans / entitlements / contracts / contract_versions
* fee_rules / commission_rules / fee_events
* financial_ledger / invoices / payments / settlements
* credits / credit_transactions / disputes
* campaigns / attribution_events / content / landing_pages
* notifications / integrations / webhooks

# APPENDIX C — INITIAL DOMAIN TEMPLATE: REAL ESTATE

Use real estate as the first complete reference implementation because the supplied specification provides the richest workflow and taxonomy. Categories include residential apartments, houses, villas, commercial, land, rental, projects and short stay. Attributes cover property identity, physical specifications, building/project information, location intelligence and legal/transaction fields. Media includes exterior/interior imagery, walkthroughs, drone/project videos, progress timelines, floor plans, site/master plans, brochures, price lists and 360° tours.

Reference workflow: Inquiry → Qualification → Matching → Presentation → Site Visit → Follow-up → Negotiation → Reservation → Documentation → Contract → Payment → Handover → Referral.

The same engine should then be reused for the automotive and elevator reference implementations before broad domain expansion.


# APPENDIX D — COMMERCIAL CALCULATION TEST CASES

| Case | Input | Expected |
| --- | --- | --- |
| Subscription | Partner plan monthly fee | Invoice amount equals configured plan price + applicable adjustments. |
| Lead fee | Qualified lead event | Exactly one fee event per idempotent qualified-lead trigger. |
| Success commission | Deal closes | Commission uses active contract version governing the deal. |
| Contract change | Rate changes mid-year | Existing earned transaction retains prior version; new transactions use new version. |
| Refund | Payment reversed | Contractual reversal/clawback creates compensating ledger entry. |
| Dispute | Partner disputes fee | Commission moves to disputed/held state; no silent deletion. |
| Agent split | Provider salesperson closes partner deal | Agent share uses configured agent rule and approved basis. |
| Credits | Featured listing published | Credit ledger deducts one applicable credit and records reason. |


# APPENDIX E — SETTINGS CATALOG STARTER

| Area | Setting | Key | Scopes | Type |
| --- | --- | --- | --- | --- |
| General | Platform identity | platform.name | Platform | Text |
| General | Timezone | platform.general.timezone | Platform | Timezone |
| General | Default currency | platform.general.default_currency | Platform | Currency |
| Branding | Default theme | theme.public.default | Platform/Domain | Theme |
| Branding | Allow dark mode | platform.ui.dark_mode.enabled | Platform | Boolean |
| Security | MFA requirement | platform.security.mfa_required | Platform/Organization/Role | Boolean |
| Security | Session duration | platform.security.session_duration | Platform | Duration |
| Listings | Publishing mode | listing.publishing.mode | Domain/Category | Enum |
| Listings | Expiration | listing.expiration.days | Domain/Category | Integer |
| CRM | Lead SLA | crm.lead.sla_minutes | Domain/Organization | Integer |
| CRM | Assignment | crm.assignment.strategy | Domain/Organization | Enum |
| Workflow | Escalation | workflow.escalation.enabled | Domain | Boolean |
| Media | Max upload | media.max_upload_mb | Platform/Domain/Category | Integer |
| Search | Ranking | search.ranking.profile | Domain | Reference |
| Commercial | Fee trigger | commercial.fee.trigger | Contract/Rule | Enum |
| Commercial | Commission rate | commercial.commission.rate | Contract/Rule | Percentage |
| Finance | Settlement cycle | finance.settlement.cycle | Contract | Enum |
| Notifications | Lead assignment | notifications.lead.assignment | Domain/Organization | Notification policy |
| Integrations | Webhook enabled | integrations.webhooks.enabled | Organization | Boolean |
| API | Rate limit | api.rate_limit | Platform/Organization | Integer |


# APPENDIX F — FINAL PRINCIPLES TO KEEP VISIBLE DURING DEVELOPMENT

* Configuration over code.
* Provider authority is not partner authority.
* Inventory ownership is not platform ownership.
* Lead attribution is not merely marketing analytics; it can determine financial entitlement.
* Every commission has a defined trigger.
* Every historical financial calculation is reproducible.
* Every tenant boundary is enforced on the server.
* Every sensitive change is auditable.
* Every domain reuses the same core platform primitives.
* Settings must scale to thousands of values without sacrificing discoverability.
* The UI is monochromatic and light by default, but theme is configurable through controlled design tokens.
* Mobile field execution is a first-class workflow.
* Start with a modular monolith and extract services only when evidence demands it.
* Build the foundation once so every future domain becomes faster to launch.

# DOCUMENT STATUS

This is the consolidated final master documentation generated from the two supplied specifications, with an implementation-oriented architecture and phased build path added to make the combined vision executable.

Source-derived foundation: Business Provider / Partner / Owner Model v3 and Expandable Master Product Specification v2.

Implementation additions in this document are engineering recommendations and should be reviewed against the team's hosting, budget, security, legal, payment-provider and operational constraints before production commitment.

Recommended next artifact: convert Phase 0–3 into an engineering backlog with epics, database migrations, API contracts, UI routes, acceptance criteria and sprint-sized tickets.

