// inventory.schema.ts
import { z } from 'zod';

export const createListingSchema = z.object({
  domainId: z.string().uuid(),
  categoryId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  title: z.string().min(5).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  inventoryModel: z.enum([
    'UNIQUE_ITEM', 'STOCK_QUANTITY', 'UNIT_INVENTORY', 'VARIANT_INVENTORY', 'PROJECT', 'SERVICE_CAPACITY', 'QUOTATION_BASED', 'RENTAL_ASSET'
  ]).default('UNIQUE_ITEM'),
  price: z.number().min(0),
  currency: z.string().length(3).default('ETB'),
  priceType: z.enum(['FIXED', 'NEGOTIABLE', 'STARTING_FROM', 'PRICE_ON_REQUEST', 'RENT_PER_MONTH', 'RENT_PER_YEAR']).default('FIXED'),
  stockQuantity: z.number().int().min(0).default(1),
  attributes: z.record(z.unknown()).default({}),
  primaryMediaUrl: z.string().url().optional(),
  location: z.object({
    city: z.string().optional(),
    subcity: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
});

export const updateOwnershipAuthorizationSchema = z.object({
  ownerName: z.string().min(2).max(200),
  ownerContact: z.string().min(5).max(100),
  ownerIdCardNumber: z.string().optional(),
  salesRightType: z.enum(['EXCLUSIVE', 'NON_EXCLUSIVE', 'PLATFORM_MANAGED']),
  authorizationStartDate: z.string(),
  authorizationEndDate: z.string().optional(),
  agreementDocumentUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
