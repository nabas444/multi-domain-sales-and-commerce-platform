// inventory.types.ts
// Inventory, Listings, Ownership Authorizations, and Media

export type ListingStatus = 'DRAFT' | 'VALIDATION' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'PAUSED' | 'EXPIRED' | 'SOLD' | 'RENTED' | 'ARCHIVED';
export type InventoryModel = 'UNIQUE_ITEM' | 'STOCK_QUANTITY' | 'UNIT_INVENTORY' | 'VARIANT_INVENTORY' | 'PROJECT' | 'SERVICE_CAPACITY' | 'QUOTATION_BASED' | 'RENTAL_ASSET';
export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'STARTING_FROM' | 'PRICE_ON_REQUEST' | 'RENT_PER_MONTH' | 'RENT_PER_YEAR';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION';
export type SalesRightType = 'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'PLATFORM_MANAGED';

export interface Listing {
  id: string;
  organizationId: string;
  domainId: string;
  categoryId: string;
  branchId?: string | null;
  title: string;
  slug: string;
  description?: string;
  status: ListingStatus;
  inventoryModel: InventoryModel;
  price: number;
  currency: string;
  priceType: PriceType;
  stockQuantity: number;
  attributes: Record<string, unknown>;
  primaryMediaUrl?: string;
  location?: {
    city?: string;
    subcity?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  isFeatured: boolean;
  viewCount: number;
  favoriteCount: number;
  leadCount: number;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnershipAuthorization {
  id: string;
  listingId: string;
  organizationId: string;
  ownerName: string;
  ownerContact: string;
  ownerIdCardNumber?: string;
  salesRightType: SalesRightType;
  authorizationStartDate: string;
  authorizationEndDate?: string;
  agreementDocumentUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  organizationId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'PANORAMA_360' | 'AUDIO';
  role: 'HERO' | 'GALLERY' | 'FLOORPLAN' | 'BROCHURE' | 'INSPECTION' | 'LEGAL_DOCUMENT' | 'AVATAR' | 'LOGO';
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  uploadedBy?: string;
  createdAt: Date;
}
