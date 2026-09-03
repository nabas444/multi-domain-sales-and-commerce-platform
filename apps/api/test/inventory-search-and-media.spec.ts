import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { AuditService } from '../src/common/audit/audit.service.js';
import { S3StorageService } from '../src/common/storage/s3-storage.service.js';
import { dbPool } from '@platform/database';

jest.setTimeout(30000);

describe('Inventory Full-Text Search & S3 Media Suite', () => {
  let inventoryService: InventoryService;
  let auditService: AuditService;
  let s3StorageService: S3StorageService;
  let partnerId: string;
  let adminId: string;

  beforeAll(async () => {
    auditService = new AuditService();
    s3StorageService = new S3StorageService();
    inventoryService = new InventoryService(auditService, s3StorageService);

    const orgRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM organizations.tenants WHERE slug = 'apex-real-estate'"
    );
    partnerId = orgRes.rows[0].id;

    const userRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM identity.users WHERE email = 'admin@platform.local'"
    );
    adminId = userRes.rows[0].id;
  });

  describe('S3-Compatible Direct Pre-Signed Uploads', () => {
    it('MUST generate valid S3 pre-signed upload URL with authentication parameters', async () => {
      const presigned = await inventoryService.generatePresignedMediaUpload(
        partnerId,
        {
          fileName: 'penthouse-master-bedroom.jpg',
          mimeType: 'image/jpeg',
          role: 'HERO',
          mediaType: 'IMAGE',
        },
        adminId
      );

      expect(presigned).toBeDefined();
      expect(presigned.uploadUrl).toBeDefined();
      expect(presigned.uploadUrl).toContain('X-Amz-Signature');
      expect(presigned.fileKey).toContain(partnerId);
      expect(presigned.fileKey).toContain('penthouse-master-bedroom.jpg');
      expect(presigned.bucket).toBe('platform-media');
      expect(presigned.fileUrl).toContain('penthouse-master-bedroom.jpg');
    });

    it('MUST persist confirmed media asset metadata into media.media_assets', async () => {
      const confirmed = await inventoryService.confirmMediaUpload(
        partnerId,
        {
          fileName: 'verified_title_deed.pdf',
          fileUrl: 'http://localhost:9000/platform-media/test/deed.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 2048576,
          mediaType: 'DOCUMENT',
          role: 'LEGAL_DOCUMENT',
          metadata: { documentNumber: 'TD-ADDIS-2026-99' },
        },
        adminId
      );

      expect(confirmed).toBeDefined();
      expect(confirmed.id).toBeDefined();
      expect(confirmed.organization_id).toBe(partnerId);
      expect(confirmed.file_name).toBe('verified_title_deed.pdf');
      expect(confirmed.role).toBe('LEGAL_DOCUMENT');

      // Verify in database
      const dbCheck = await dbPool.query(
        'SELECT * FROM media.media_assets WHERE id = $1',
        [confirmed.id]
      );
      expect(dbCheck.rows.length).toBe(1);
      expect(dbCheck.rows[0].file_size_bytes).toBe('2048576');
    });
  });

  describe('PostgreSQL Full-Text Search & Faceted Navigation', () => {
    it('MUST discover inventory matching keywords via PostgreSQL FTS', async () => {
      const results = await inventoryService.listListings({
        search: 'Penthouse',
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      const penthouse = results.find((l) => l.title.includes('Penthouse'));
      expect(penthouse).toBeDefined();
      expect(penthouse?.slug).toBe('luxury-3-bedroom-penthouse-bole-atlas');
    });

    it('MUST filter listings by structured JSONB attributes', async () => {
      const results = await inventoryService.listListings({
        attributes: { bedrooms: 3 },
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      for (const listing of results) {
        expect(listing.attributes.bedrooms).toBe(3);
      }
    });

    it('MUST aggregate category, price range, and location facets', async () => {
      const facets = await inventoryService.getFacets();

      expect(facets).toBeDefined();
      expect(Array.isArray(facets.categories)).toBe(true);
      expect(facets.priceRanges).toBeDefined();
      expect(facets.priceRanges.min_price).toBeDefined();
      expect(Array.isArray(facets.subcities)).toBe(true);
    });
  });
});
