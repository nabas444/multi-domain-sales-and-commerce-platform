// marketing.types.ts
// Marketing, CMS, Webhooks, and Bulk Import/Export

export interface MarketingCampaign {
  id: string;
  organizationId: string;
  domainId?: string | null;
  name: string;
  slug: string;
  objective: 'LEAD_GENERATION' | 'BRAND_AWARENESS' | 'LISTING_PROMOTION';
  budget: number;
  spent: number;
  currency: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPage {
  id: string;
  domainId: string;
  title: string;
  slug: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  contentBlocks: Array<Record<string, unknown>>;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookConfig {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  eventTypes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportJob {
  id: string;
  organizationId: string;
  domainId?: string | null;
  entityType: 'LISTINGS' | 'LEADS' | 'CUSTOMERS' | 'PRODUCTS';
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errorsLog?: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}
