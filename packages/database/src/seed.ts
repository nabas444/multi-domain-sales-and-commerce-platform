import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dbPool } from './client.js';

export async function runSeed(): Promise<void> {
  const client = await dbPool.connect();
  try {
    console.log('🌱 Starting full multi-domain database seed...');
    await client.query('BEGIN');

    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', saltRounds);
    const partnerPasswordHash = await bcrypt.hash('PartnerPass123!', saltRounds);
    const agentPasswordHash = await bcrypt.hash('AgentPass123!', saltRounds);

    // 1. Create Super Admin User
    const superAdminRes = await client.query<{ id: string }>(
      `INSERT INTO identity.users (email, password_hash, first_name, last_name, is_super_admin, is_active)
       VALUES ($1, $2, $3, $4, TRUE, TRUE)
       ON CONFLICT (email) DO UPDATE SET is_super_admin = TRUE, is_active = TRUE
       RETURNING id`,
      ['admin@platform.local', adminPasswordHash, 'System', 'Admin']
    );
    const superAdminId = superAdminRes.rows[0].id;

    // 2. Create System Provider Organization
    const providerOrgRes = await client.query<{ id: string }>(
      `INSERT INTO organizations.tenants (
         name, slug, type, status, primary_contact_email, country_code, city
       ) VALUES ($1, $2, 'PROVIDER', 'ACTIVE', $3, 'ET', 'Addis Ababa')
       ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE'
       RETURNING id`,
      ['System Provider Global', 'system-provider', 'admin@platform.local']
    );
    const providerOrgId = providerOrgRes.rows[0].id;

    // 3. Link Super Admin to System Provider with SUPER_ADMIN role
    await client.query(
      `INSERT INTO organizations.memberships (user_id, organization_id, role_id, is_primary, is_active)
       VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', TRUE, TRUE)
       ON CONFLICT (user_id, organization_id) DO NOTHING`,
      [superAdminId, providerOrgId]
    );

    // 4. Create Partner Organization (Apex Real Estate Group)
    const partnerOrgRes = await client.query<{ id: string }>(
      `INSERT INTO organizations.tenants (
         name, slug, type, status, primary_contact_email, primary_contact_phone, country_code, city, address
       ) VALUES ($1, $2, 'DEVELOPER', 'ACTIVE', $3, '+251911000001', 'ET', 'Addis Ababa', 'Bole Subcity, Mega Building 4th Floor')
       ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE'
       RETURNING id`,
      ['Apex Real Estate Group', 'apex-real-estate', 'info@apexrealty.et']
    );
    const partnerOrgId = partnerOrgRes.rows[0].id;

    // 5. Create Main Branch for Apex Real Estate
    const branchRes = await client.query<{ id: string }>(
      `INSERT INTO organizations.branches (
         organization_id, name, code, city, address, is_main_branch, is_active
       ) VALUES ($1, 'Bole Main Headquarters', 'BOLE-HQ', 'Addis Ababa', 'Bole Subcity', TRUE, TRUE)
       ON CONFLICT (organization_id, code) DO UPDATE SET is_main_branch = TRUE
       RETURNING id`,
      [partnerOrgId]
    );
    const branchId = branchRes.rows[0].id;

    // 6. Create Partner Admin User
    const partnerAdminRes = await client.query<{ id: string }>(
      `INSERT INTO identity.users (email, password_hash, first_name, last_name, phone, is_active)
       VALUES ($1, $2, 'Dawit', 'Tadesse', '+251911000002', TRUE)
       ON CONFLICT (email) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      ['partner@apexrealty.et', partnerPasswordHash]
    );
    const partnerAdminId = partnerAdminRes.rows[0].id;

    await client.query(
      `INSERT INTO organizations.memberships (user_id, organization_id, branch_id, role_id, is_primary, is_active)
       VALUES ($1, $2, $3, '00000000-0000-0000-0000-000000000002', TRUE, TRUE)
       ON CONFLICT (user_id, organization_id) DO NOTHING`,
      [partnerAdminId, partnerOrgId, branchId]
    );

    // 7. Create Sales Agent User
    const agentRes = await client.query<{ id: string }>(
      `INSERT INTO identity.users (email, password_hash, first_name, last_name, phone, is_active)
       VALUES ($1, $2, 'Selam', 'Bekele', '+251911000003', TRUE)
       ON CONFLICT (email) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      ['agent@apexrealty.et', agentPasswordHash]
    );
    const agentId = agentRes.rows[0].id;

    await client.query(
      `INSERT INTO organizations.memberships (user_id, organization_id, branch_id, role_id, is_primary, is_active)
       VALUES ($1, $2, $3, '00000000-0000-0000-0000-000000000004', TRUE, TRUE)
       ON CONFLICT (user_id, organization_id) DO NOTHING`,
      [agentId, partnerOrgId, branchId]
    );

    // 8. Seed Platform Settings Definitions & Values
    const settingsDefs = [
      {
        key: 'platform.name',
        data_type: 'STRING',
        label: 'Platform Name',
        description: 'Global system platform commercial brand name',
        category: 'GENERAL',
        sensitivity: 'LOW',
        allowed_scopes: ['PLATFORM', 'ORGANIZATION'],
        default_value: JSON.stringify('Multi-Domain Sales & Commerce Platform'),
      },
      {
        key: 'platform.general.timezone',
        data_type: 'STRING',
        label: 'System Timezone',
        description: 'Standard platform operating timezone',
        category: 'GENERAL',
        sensitivity: 'LOW',
        allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION'],
        default_value: JSON.stringify('Africa/Addis_Ababa'),
      },
      {
        key: 'platform.general.default_currency',
        data_type: 'STRING',
        label: 'Default Currency',
        description: 'Standard ledger and pricing currency',
        category: 'GENERAL',
        sensitivity: 'FINANCIAL',
        allowed_scopes: ['PLATFORM', 'DOMAIN'],
        default_value: JSON.stringify('ETB'),
      },
      {
        key: 'listing.publishing.mode',
        data_type: 'ENUM',
        label: 'Listing Moderation Mode',
        description: 'Whether new listings require provider admin approval before publishing',
        category: 'LISTINGS',
        sensitivity: 'OPERATIONAL',
        allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION', 'CATEGORY'],
        default_value: JSON.stringify('REQUIRES_APPROVAL'),
      },
      {
        key: 'crm.lead.sla_minutes',
        data_type: 'NUMBER',
        label: 'Lead Response SLA (Minutes)',
        description: 'Maximum permitted minutes before a new lead breaches first-contact SLA',
        category: 'CRM',
        sensitivity: 'OPERATIONAL',
        allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION'],
        default_value: JSON.stringify(30),
      },
      {
        key: 'commercial.fee.trigger',
        data_type: 'ENUM',
        label: 'Commercial Success Fee Trigger',
        description: 'The business event that matures a fee from pending to earned',
        category: 'COMMERCIAL',
        sensitivity: 'FINANCIAL',
        allowed_scopes: ['PLATFORM', 'DOMAIN'],
        default_value: JSON.stringify('DEAL_CLOSED'),
      },
      {
        key: 'commercial.commission.rate',
        data_type: 'NUMBER',
        label: 'Default Platform Commission (%)',
        description: 'Standard provider success fee percentage',
        category: 'COMMERCIAL',
        sensitivity: 'FINANCIAL',
        allowed_scopes: ['PLATFORM', 'DOMAIN'],
        default_value: JSON.stringify(2.0),
      },
    ];

    for (const s of settingsDefs) {
      await client.query(
        `INSERT INTO platform.settings_definitions (
           key, data_type, label, description, category, sensitivity, allowed_scopes, default_value, is_system
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         ON CONFLICT (key) DO UPDATE SET label = $3, default_value = $8`,
        [s.key, s.data_type, s.label, s.description, s.category, s.sensitivity, s.allowed_scopes, s.default_value]
      );
    }

    // 9. Seed Theme Tokens
    const defaultThemeTokens = {
      primaryColor: '#18181b',
      secondaryColor: '#f4f4f5',
      accentColor: '#09090b',
      backgroundColor: '#ffffff',
      surfaceColor: '#fafafa',
      textColor: '#09090b',
      textMutedColor: '#71717a',
      borderColor: '#e4e4e7',
      borderRadius: '0.375rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      density: 'comfortable',
    };

    await client.query(
      `INSERT INTO platform.theme_tokens (
         name, scope, scope_id, palette, tokens, is_active, is_default
       ) VALUES ('Monochromatic Light', 'PLATFORM', 'GLOBAL', 'monochrome-light', $1, TRUE, TRUE)
       ON CONFLICT DO NOTHING`,
      [JSON.stringify(defaultThemeTokens)]
    );

    // 10. Seed Feature Flags
    const flags = [
      { key: 'module.crm', name: 'Sales CRM & Deals', state: 'ON' },
      { key: 'module.marketplace', name: 'Public Marketplace Discovery', state: 'ON' },
      { key: 'module.commercial', name: 'Commercial Fee & Ledger Engine', state: 'ON' },
      { key: 'module.marketing', name: 'Marketing & CMS', state: 'ON' },
      { key: 'module.bulk_import', name: 'Bulk Data Imports & Feeds', state: 'ON' },
      { key: 'module.ai_assistant', name: 'AI Lead & Listing Assistant', state: 'BETA' },
    ];

    for (const f of flags) {
      await client.query(
        `INSERT INTO platform.feature_flags (key, name, state, scope, scope_id)
         VALUES ($1, $2, $3, 'PLATFORM', 'GLOBAL')
         ON CONFLICT (key) DO UPDATE SET state = $3`,
        [f.key, f.name, f.state]
      );
    }

    // 11. Seed Primary Domains: Real Estate, Automotive, Elevators
    const realEstateRes = await client.query<{ id: string }>(
      `INSERT INTO domains.domains (
         name, slug, code, icon, description, status, default_currency, measurement_system, timezone
       ) VALUES (
         'Real Estate', 'real-estate', 'REAL_ESTATE', 'BuildingOfficeIcon',
         'Residential apartments, commercial buildings, villas, land, and off-plan projects',
         'ACTIVE', 'ETB', 'METRIC', 'Africa/Addis_Ababa'
       )
       ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE'
       RETURNING id`
    );
    const realEstateDomainId = realEstateRes.rows[0].id;

    await client.query(
      `INSERT INTO domains.domains (
         name, slug, code, icon, description, status, default_currency, measurement_system, timezone
       ) VALUES (
         'Automotive', 'automotive', 'AUTOMOTIVE', 'TruckIcon',
         'Passenger vehicles, commercial trucks, SUVs, motorcycles, and machinery',
         'ACTIVE', 'ETB', 'METRIC', 'Africa/Addis_Ababa'
       )
       ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE'`
    );

    await client.query(
      `INSERT INTO domains.domains (
         name, slug, code, icon, description, status, default_currency, measurement_system, timezone
       ) VALUES (
         'Elevators & Vertical Transport', 'elevators', 'ELEVATORS', 'ArrowsUpDownIcon',
         'Passenger, panoramic, freight elevators, escalators, and maintenance services',
         'ACTIVE', 'ETB', 'METRIC', 'Africa/Addis_Ababa'
       )
       ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE'`
    );

    // 12. Seed Real Estate Categories Hierarchy
    const residentialCatRes = await client.query<{ id: string }>(
      `INSERT INTO domains.categories (domain_id, name, slug, code, sort_order, is_active)
       VALUES ($1, 'Residential Properties', 'residential', 'RESIDENTIAL', 1, TRUE)
       ON CONFLICT (domain_id, slug) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [realEstateDomainId]
    );
    const residentialCatId = residentialCatRes.rows[0].id;

    const apartmentsCatRes = await client.query<{ id: string }>(
      `INSERT INTO domains.categories (domain_id, parent_id, name, slug, code, sort_order, is_active)
       VALUES ($1, $2, 'Apartments & Penthouses', 'apartments', 'APARTMENTS', 1, TRUE)
       ON CONFLICT (domain_id, slug) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [realEstateDomainId, residentialCatId]
    );
    const apartmentsCatId = apartmentsCatRes.rows[0].id;

    const villasCatRes = await client.query<{ id: string }>(
      `INSERT INTO domains.categories (domain_id, parent_id, name, slug, code, sort_order, is_active)
       VALUES ($1, $2, 'Villas & Houses', 'villas', 'VILLAS', 2, TRUE)
       ON CONFLICT (domain_id, slug) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [realEstateDomainId, residentialCatId]
    );

    const commercialCatRes = await client.query<{ id: string }>(
      `INSERT INTO domains.categories (domain_id, name, slug, code, sort_order, is_active)
       VALUES ($1, 'Commercial Real Estate', 'commercial', 'COMMERCIAL', 2, TRUE)
       ON CONFLICT (domain_id, slug) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [realEstateDomainId]
    );
    const commercialCatId = commercialCatRes.rows[0].id;

    // 13. Seed Dynamic Attribute Definitions for Real Estate
    const attrDefs = [
      { slug: 'bedrooms', code: 'BEDROOMS', name: 'Bedrooms', type: 'NUMBER', group: 'Physical Specifications', required: true },
      { slug: 'bathrooms', code: 'BATHROOMS', name: 'Bathrooms', type: 'NUMBER', group: 'Physical Specifications', required: true },
      { slug: 'area_sqm', code: 'AREA_SQM', name: 'Floor Area (m²)', type: 'NUMBER', group: 'Physical Specifications', required: true },
      { slug: 'floor_number', code: 'FLOOR_NUMBER', name: 'Floor Level', type: 'NUMBER', group: 'Building Specifications', required: false },
      { slug: 'furnishing', code: 'FURNISHING', name: 'Furnishing Status', type: 'SELECT', group: 'Interior', required: false },
      { slug: 'title_status', code: 'TITLE_STATUS', name: 'Title Deed Status', type: 'SELECT', group: 'Legal & Ownership', required: true },
      { slug: 'has_backup_generator', code: 'BACKUP_GEN', name: 'Backup Generator', type: 'BOOLEAN', group: 'Amenities', required: false },
      { slug: 'has_water_tank', code: 'WATER_TANK', name: 'Dedicated Water Tank', type: 'BOOLEAN', group: 'Amenities', required: false },
    ];

    const attributeIds = new Map<string, string>();
    for (const a of attrDefs) {
      const aRes = await client.query<{ id: string }>(
        `INSERT INTO domains.attribute_definitions (
           domain_id, name, slug, code, group_name, type, is_required, is_searchable, is_filterable
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
         ON CONFLICT (domain_id, slug) DO UPDATE SET is_required = $7
         RETURNING id`,
        [realEstateDomainId, a.name, a.slug, a.code, a.group, a.type, a.required]
      );
      attributeIds.set(a.slug, aRes.rows[0].id);
    }

    // Attach attributes to Apartments category
    for (const [slug, attrId] of attributeIds.entries()) {
      await client.query(
        `INSERT INTO domains.category_attributes (category_id, attribute_id, is_required)
         VALUES ($1, $2, $3)
         ON CONFLICT (category_id, attribute_id) DO NOTHING`,
        [apartmentsCatId, attrId, slug === 'bedrooms' || slug === 'area_sqm' || slug === 'title_status']
      );
    }

    // 14. Seed Category UI Template
    await client.query(
      `INSERT INTO domains.category_templates (
         category_id, name, card_fields, detail_sections, search_filters
       ) VALUES ($1, 'Apartment Showcase Template', 
         '["price", "bedrooms", "bathrooms", "area_sqm", "location"]'::jsonb,
         '[{"title": "Property Overview", "fields": ["bedrooms", "bathrooms", "area_sqm", "floor_number"], "layout": "grid"}]'::jsonb,
         '[{"attributeSlug": "bedrooms", "widget": "dropdown"}, {"attributeSlug": "area_sqm", "widget": "range"}]'::jsonb
       )
       ON CONFLICT (category_id) DO NOTHING`,
      [apartmentsCatId]
    );

    // 15. Authorize Partner for Real Estate Domain
    await client.query(
      `INSERT INTO organizations.tenant_domains (organization_id, domain_id, allowed_categories, is_enabled)
       VALUES ($1, $2, '["*"]'::jsonb, TRUE)
       ON CONFLICT (organization_id, domain_id) DO NOTHING`,
      [partnerOrgId, realEstateDomainId]
    );

    // 16. Seed Commercial SaaS Plan & Contract
    const planRes = await client.query<{ id: string }>(
      `INSERT INTO commercial.plans (
         name, code, description, billing_interval, price, currency, limits, features
       ) VALUES (
         'Enterprise Developer Plan', 'ENTERPRISE_ETB',
         'Full platform access with unlimited listings, dedicated agent seat, and priority lead routing',
         'MONTHLY', 25000.00, 'ETB',
         '{"maxListings": 200, "maxUsers": 20, "maxDomains": 3, "leadCredits": 100}'::jsonb,
         '["INVENTORY", "CRM", "SALES_PIPELINE", "COMMERCIAL_LEDGER", "MARKETING", "BULK_IMPORT"]'::jsonb
       )
       ON CONFLICT (code) DO UPDATE SET price = 25000.00
       RETURNING id`
    );
    const planId = planRes.rows[0].id;

    const contractRes = await client.query<{ id: string }>(
      `INSERT INTO commercial.contracts (
         organization_id, plan_id, contract_number, version, status, effective_date, fee_model, terms
       ) VALUES (
         $1, $2, 'CNT-APEX-2026-001', 1, 'ACTIVE', '2026-01-01', 'HYBRID',
         '{"platformFeeRate": 2.0, "agentCommissionRate": 1.0, "settlementCycleDays": 30, "leadCreditAllowance": 100}'::jsonb
       )
       ON CONFLICT (contract_number) DO UPDATE SET status = 'ACTIVE'
       RETURNING id`,
      [partnerOrgId, planId]
    );
    const contractId = contractRes.rows[0].id;

    // Fee Rule for Real Estate Closed Deals
    await client.query(
      `INSERT INTO commercial.fee_rules (
         contract_id, domain_id, fee_type, calculation_type, rate_value, currency, trigger_event
       ) VALUES (
         $1, $2, 'SUCCESS_COMMISSION', 'PERCENTAGE', 2.0000, 'ETB', 'deal.closed'
       )`,
      [contractId, realEstateDomainId]
    );

    // 17. Seed Default Sales Pipeline for Real Estate
    const pipelineRes = await client.query<{ id: string }>(
      `INSERT INTO sales.pipelines (organization_id, domain_id, name, is_default)
       VALUES ($1, $2, 'Real Estate Residential Pipeline', TRUE)
       RETURNING id`,
      [partnerOrgId, realEstateDomainId]
    );
    const pipelineId = pipelineRes.rows[0].id;

    const stages = [
      { name: 'New Inquiry', code: 'INQUIRY', order: 1, prob: 10, won: false, lost: false },
      { name: 'Qualified Lead', code: 'QUALIFIED', order: 2, prob: 25, won: false, lost: false },
      { name: 'Site Visit Scheduled', code: 'SITE_VISIT', order: 3, prob: 50, won: false, lost: false },
      { name: 'Negotiation / Reservation', code: 'NEGOTIATION', order: 4, prob: 75, won: false, lost: false },
      { name: 'Contract Signed & Paid', code: 'CLOSED_WON', order: 5, prob: 100, won: true, lost: false },
      { name: 'Lost / Closed', code: 'CLOSED_LOST', order: 6, prob: 0, won: false, lost: true },
    ];

    const stageIds = new Map<string, string>();
    for (const st of stages) {
      const sRes = await client.query<{ id: string }>(
        `INSERT INTO sales.pipeline_stages (
           pipeline_id, name, code, stage_order, win_probability, is_won_stage, is_lost_stage
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [pipelineId, st.name, st.code, st.order, st.prob, st.won, st.lost]
      );
      stageIds.set(st.code, sRes.rows[0].id);
    }

    // 18. Seed Published Sample Real Estate Listing
    const listingRes = await client.query<{ id: string }>(
      `INSERT INTO inventory.listings (
         organization_id, domain_id, category_id, branch_id, title, slug, description,
         status, inventory_model, price, currency, price_type, stock_quantity,
         attributes, primary_media_url, location, moderation_status, is_featured, published_at
       ) VALUES (
         $1, $2, $3, $4,
         'Luxury 3-Bedroom Penthouse in Bole Atlas',
         'luxury-3-bedroom-penthouse-bole-atlas',
         'Exclusive high-floor corner penthouse with uncompromised panoramic views across Addis Ababa. Features 3 en-suite bedrooms, imported Italian kitchen, private terrace, 24/7 backup power and high-speed elevator access.',
         'PUBLISHED', 'UNIT_INVENTORY', 18500000.00, 'ETB', 'FIXED', 1,
         $5,
         'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
         '{"city": "Addis Ababa", "subcity": "Bole", "address": "Atlas Hotel Area, Ring Road Tower 12th Floor", "lat": 9.0054, "lng": 38.7850}'::jsonb,
         'APPROVED', TRUE, CURRENT_TIMESTAMP
       )
       ON CONFLICT (organization_id, slug) DO UPDATE SET status = 'PUBLISHED'
       RETURNING id`,
      [
        partnerOrgId,
        realEstateDomainId,
        apartmentsCatId,
        branchId,
        JSON.stringify({
          bedrooms: 3,
          bathrooms: 3,
          area_sqm: 240,
          floor_number: 12,
          furnishing: 'Fully Furnished',
          title_status: 'Freehold Title Deed',
          has_backup_generator: true,
          has_water_tank: true,
        }),
      ]
    );
    const listingId = listingRes.rows[0].id;

    // Ownership Authorization for the Listing
    await client.query(
      `INSERT INTO inventory.ownership_authorizations (
         listing_id, organization_id, owner_name, owner_contact, sales_right_type,
         authorization_start_date, verification_status
       ) VALUES ($1, $2, 'Dr. Yohannes Girma', '+251911445566', 'EXCLUSIVE', '2026-01-01', 'VERIFIED')`,
      [listingId, partnerOrgId]
    );

    // 19. Seed Customer, Lead, and Deal
    const customerRes = await client.query<{ id: string }>(
      `INSERT INTO crm.customers (
         organization_id, first_name, last_name, email, phone, preferred_contact_method, city, budget_max, currency
       ) VALUES ($1, 'Abebe', 'Kebede', 'abebe.kebede@consulting.et', '+251911223344', 'WHATSAPP', 'Addis Ababa', 20000000.00, 'ETB')
       ON CONFLICT (organization_id, phone) DO UPDATE SET status = 'ACTIVE'
       RETURNING id`,
      [partnerOrgId]
    );
    const customerId = customerRes.rows[0].id;

    const leadRes = await client.query<{ id: string }>(
      `INSERT INTO crm.leads (
         organization_id, domain_id, customer_id, listing_id, branch_id, assigned_agent_id,
         source, attribution_type, status, priority, score, inquiry_message, sla_deadline
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         'PLATFORM', 'FIRST_TOUCH', 'QUALIFIED', 'HIGH', 85,
         'Interested in scheduling a site visit this Saturday. Seeking ready title deed property.',
         CURRENT_TIMESTAMP + INTERVAL '30 minutes'
       )
       RETURNING id`,
      [partnerOrgId, realEstateDomainId, customerId, listingId, branchId, agentId]
    );
    const leadId = leadRes.rows[0].id;

    // Log initial lead activity
    await client.query(
      `INSERT INTO crm.lead_activities (lead_id, actor_id, type, subject, body)
       VALUES ($1, $2, 'CALL', 'Qualification Phone Call', 'Spoke with buyer Abebe. Budget is approved in cash. Ready for property viewing.')`,
      [leadId, agentId]
    );

    // Scheduled Site Visit Appointment
    await client.query(
      `INSERT INTO sales.appointments (
         organization_id, lead_id, listing_id, customer_id, host_agent_id, type,
         scheduled_start, scheduled_end, location, status, notes
       ) VALUES (
         $1, $2, $3, $4, $5, 'SITE_VISIT',
         CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 1 hour',
         'Atlas Hotel Area, Ring Road Tower 12th Floor, Addis Ababa', 'CONFIRMED',
         'Client requested viewing of living room and terrace views.'
       )`,
      [partnerOrgId, leadId, listingId, customerId, agentId]
    );

    // 20. Seed Initial Ledger Balance and Credit Wallet for Apex Real Estate
    await client.query(
      `INSERT INTO finance.credits (organization_id, credit_type, balance)
       VALUES ($1, 'LEAD_CREDITS', 100)
       ON CONFLICT (organization_id, credit_type) DO UPDATE SET balance = 100`,
      [partnerOrgId]
    );

    await client.query(
      `INSERT INTO finance.financial_ledger (
         organization_id, contract_id, entry_type, debit_amount, credit_amount, currency, balance_after, reference_number, notes
       ) VALUES (
         $1, $2, 'SUBSCRIPTION_FEE', 25000.00, 0.00, 'ETB', -25000.00, 'LED-INIT-001', 'Monthly enterprise SaaS subscription platform invoice'
       )`,
      [partnerOrgId, contractId]
    );

    // 21. Log initial audit event
    await client.query(
      `INSERT INTO audit.audit_logs (
         actor_id, actor_email, organization_id, resource, action, metadata
       ) VALUES ($1, 'admin@platform.local', $2, 'platform', 'system_seeded', $3)`,
      [
        superAdminId,
        providerOrgId,
        JSON.stringify({
          version: '1.0.0',
          seededDomains: ['real-estate', 'automotive', 'elevators'],
          seededPartner: 'apex-real-estate',
          seededAt: new Date().toISOString(),
        }),
      ]
    );

    await client.query('COMMIT');
    console.log('🎉 Full database seed completed successfully!');
    console.log('👥 Seeded Users:');
    console.log('  1. Super Admin: admin@platform.local (AdminPass123!)');
    console.log('  2. Partner Admin: partner@apexrealty.et (PartnerPass123!)');
    console.log('  3. Sales Agent: agent@apexrealty.et (AgentPass123!)');
    console.log('🏢 Seeded Organization: Apex Real Estate Group (Slug: apex-real-estate)');
    console.log('🏘️ Seeded Domain: Real Estate (Categories: Residential -> Apartments, Villas; Commercial -> Offices)');
    console.log('🏡 Seeded Listing: Luxury 3-Bedroom Penthouse in Bole Atlas (18,500,000 ETB)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during seed:', err);
      process.exit(1);
    });
}
