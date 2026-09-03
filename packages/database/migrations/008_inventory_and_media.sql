-- 008_inventory_and_media.sql
-- Inventory, Listings, Ownership Authorizations, Stock Movements, Universal Media & Documents

CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS media;

-- 1. Inventory Listings
CREATE TABLE IF NOT EXISTS inventory.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES domains.categories(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES organizations.branches(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'VALIDATION', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'SOLD', 'RENTED', 'ARCHIVED'
    )),
    inventory_model VARCHAR(50) NOT NULL DEFAULT 'UNIQUE_ITEM' CHECK (inventory_model IN (
        'UNIQUE_ITEM', 'STOCK_QUANTITY', 'UNIT_INVENTORY', 'VARIANT_INVENTORY', 'PROJECT', 'SERVICE_CAPACITY', 'QUOTATION_BASED', 'RENTAL_ASSET'
    )),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    price_type VARCHAR(50) NOT NULL DEFAULT 'FIXED' CHECK (price_type IN ('FIXED', 'NEGOTIABLE', 'STARTING_FROM', 'PRICE_ON_REQUEST', 'RENT_PER_MONTH', 'RENT_PER_YEAR')),
    stock_quantity INTEGER NOT NULL DEFAULT 1,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    primary_media_url TEXT,
    location JSONB DEFAULT '{}'::jsonb, -- { city, subcity, address, lat, lng }
    moderation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION')),
    moderation_notes TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    lead_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_listing_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_listings_org ON inventory.listings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_domain ON inventory.listings(domain_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_category ON inventory.listings(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_status ON inventory.listings(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_published ON inventory.listings(status, published_at DESC) WHERE status = 'PUBLISHED' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_price ON inventory.listings(price) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_listings_attributes ON inventory.listings USING GIN(attributes);

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON inventory.listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Structured Attribute Values (Relational query index for high-precision filters)
CREATE TABLE IF NOT EXISTS inventory.listing_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES inventory.listings(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES domains.attribute_definitions(id) ON DELETE CASCADE,
    value_text TEXT,
    value_number NUMERIC(15, 4),
    value_boolean BOOLEAN,
    value_date TIMESTAMPTZ,
    value_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_listing_attribute UNIQUE (listing_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_attr_val_listing ON inventory.listing_attribute_values(listing_id);
CREATE INDEX IF NOT EXISTS idx_attr_val_attr ON inventory.listing_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attr_val_num ON inventory.listing_attribute_values(attribute_id, value_number);
CREATE INDEX IF NOT EXISTS idx_attr_val_text ON inventory.listing_attribute_values(attribute_id, value_text);

-- 3. Listing Variants (SKUs for E-commerce and multi-variant equipment)
CREATE TABLE IF NOT EXISTS inventory.variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES inventory.listings(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    title VARCHAR(150) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    price_override NUMERIC(15, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_variant_sku UNIQUE (sku)
);

CREATE INDEX IF NOT EXISTS idx_variants_listing ON inventory.variants(listing_id);

-- 4. Legal Inventory Ownership and Selling Authorization (Golden Rule of Platform)
CREATE TABLE IF NOT EXISTS inventory.ownership_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES inventory.listings(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    owner_name VARCHAR(200) NOT NULL,
    owner_contact VARCHAR(100) NOT NULL,
    owner_id_card_number VARCHAR(100),
    sales_right_type VARCHAR(50) NOT NULL DEFAULT 'EXCLUSIVE' CHECK (sales_right_type IN ('EXCLUSIVE', 'NON_EXCLUSIVE', 'PLATFORM_MANAGED')),
    authorization_start_date DATE NOT NULL,
    authorization_end_date DATE,
    agreement_document_url TEXT,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    verified_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ownership_listing ON inventory.ownership_authorizations(listing_id);
CREATE INDEX IF NOT EXISTS idx_ownership_org ON inventory.ownership_authorizations(organization_id);

-- 5. Stock Movements Ledger (Auditable Stock Changes)
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES inventory.listings(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES inventory.variants(id) ON DELETE CASCADE,
    change_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('INITIAL', 'MANUAL_ADJUSTMENT', 'SALE', 'RESERVATION', 'RETURN', 'RESERVATION_CANCELLED')),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_listing ON inventory.stock_movements(listing_id);

-- 6. Universal Media Assets
CREATE TABLE IF NOT EXISTS media.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'DOCUMENT', 'PANORAMA_360', 'AUDIO')),
    role VARCHAR(50) NOT NULL DEFAULT 'GALLERY' CHECK (role IN ('HERO', 'GALLERY', 'FLOORPLAN', 'BROCHURE', 'INSPECTION', 'LEGAL_DOCUMENT', 'AVATAR', 'LOGO')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_org ON media.media_assets(organization_id);

-- 7. Media Links (Polymorphic Association)
CREATE TABLE IF NOT EXISTS media.media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media.media_assets(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('LISTING', 'ORGANIZATION', 'USER', 'CAMPAIGN')),
    entity_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_media_entity UNIQUE (media_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_media_links_entity ON media.media_links(entity_type, entity_id);

-- 8. Managed Documents (Compliance, Contracts, Technical Specs)
CREATE TABLE IF NOT EXISTS media.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'TITLE_DEED', 'TRADE_LICENSE', 'COMMERCIAL_REGISTRATION', 'INSPECTION_CERT', 'BLUEPRINT'
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    expiry_date DATE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON media.documents(organization_id);
