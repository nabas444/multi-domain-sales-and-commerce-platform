import { SettingsService } from '../src/modules/settings/settings.service.js';
import { AuditService } from '../src/common/audit/audit.service.js';
import { dbPool } from '@platform/database';

describe('Settings Hierarchy & Precedence Suite', () => {
  let settingsService: SettingsService;
  let auditService: AuditService;

  beforeAll(() => {
    auditService = new AuditService();
    settingsService = new SettingsService(auditService);
  });

  it('MUST fallback to DEFAULT setting value when no override is present', async () => {
    const res = await settingsService.resolveSetting('platform.general.timezone', {});
    expect(res).toBeDefined();
    expect(res.key).toBe('platform.general.timezone');
    expect(res.value).toBe('Africa/Addis_Ababa');
  });

  it('MUST resolve platform-scoped settings definitions', async () => {
    const definitions = await settingsService.getDefinitions('GENERAL');
    expect(definitions.length).toBeGreaterThan(0);
    const names = definitions.map((d: any) => d.key);
    expect(names).toContain('platform.name');
    expect(names).toContain('platform.general.timezone');
  });

  it('MUST record and retrieve feature flags', async () => {
    const flags = await settingsService.getFeatureFlags('PLATFORM', 'GLOBAL');
    expect(flags.length).toBeGreaterThan(0);
    const flagKeys = flags.map((f: any) => f.key);
    expect(flagKeys).toContain('module.crm');
    expect(flagKeys).toContain('module.marketplace');
  });
});
