import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

export interface SettingResolutionContext {
  domainId?: string;
  organizationId?: string;
  branchId?: string;
  userId?: string;
  roleId?: string;
  categoryId?: string;
}

@Injectable()
export class SettingsService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get all settings definitions, optionally filtered by category or sensitivity
   */
  async getDefinitions(category?: string, sensitivity?: string) {
    let sql = 'SELECT * FROM platform.settings_definitions WHERE 1=1';
    const params: unknown[] = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (sensitivity) {
      params.push(sensitivity);
      sql += ` AND sensitivity = $${params.length}`;
    }

    sql += ' ORDER BY category ASC, key ASC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  /**
   * Get definition by key
   */
  async getDefinitionByKey(key: string) {
    const res = await dbPool.query(
      'SELECT * FROM platform.settings_definitions WHERE key = $1',
      [key]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`Setting definition not found: ${key}`);
    }
    return res.rows[0];
  }

  /**
   * Resolve effective setting value based on deterministic inheritance:
   * USER/CONTEXT OVERRIDE -> BRANCH -> ORGANIZATION -> DOMAIN -> PLATFORM -> DEFAULT
   */
  async resolveSetting(key: string, context: SettingResolutionContext = {}) {
    const definition = await this.getDefinitionByKey(key);

    // Fetch all existing scoped values for this definition
    const valuesRes = await dbPool.query<{
      scope: string;
      scope_id: string;
      value: unknown;
      version: number;
    }>(
      'SELECT scope, scope_id, value, version FROM platform.settings_values WHERE definition_id = $1 AND is_active = TRUE',
      [definition.id]
    );

    const valuesByScope = new Map<string, unknown>();
    for (const row of valuesRes.rows) {
      valuesByScope.set(`${row.scope}:${row.scope_id}`, row.value);
    }

    // Evaluation hierarchy (Precedence order)
    const precedence: Array<{ scope: string; scopeId: string | undefined; label: string }> = [
      { scope: 'USER', scopeId: context.userId, label: 'USER' },
      { scope: 'BRANCH', scopeId: context.branchId, label: 'BRANCH' },
      { scope: 'CATEGORY', scopeId: context.categoryId, label: 'CATEGORY' },
      { scope: 'ORGANIZATION', scopeId: context.organizationId, label: 'ORGANIZATION' },
      { scope: 'DOMAIN', scopeId: context.domainId, label: 'DOMAIN' },
      { scope: 'PLATFORM', scopeId: 'GLOBAL', label: 'PLATFORM' },
    ];

    for (const level of precedence) {
      if (!level.scopeId) continue;
      const lookupKey = `${level.scope}:${level.scopeId}`;
      if (valuesByScope.has(lookupKey)) {
        return {
          key,
          value: valuesByScope.get(lookupKey),
          source: level.label,
          definition,
          isOverridden: level.label !== 'PLATFORM' || valuesRes.rows.length > 1,
        };
      }
    }

    // Fallback to default value from definition
    return {
      key,
      value: definition.default_value,
      source: 'DEFAULT',
      definition,
      isOverridden: false,
    };
  }

  /**
   * Set setting value at a given scope with automated versioning and audit trail
   */
  async setSettingValue(
    key: string,
    scope: string,
    scopeId: string,
    value: unknown,
    actorId: string,
    reason?: string
  ) {
    const definition = await this.getDefinitionByKey(key);

    if (!definition.allowed_scopes.includes(scope)) {
      throw new BadRequestException(
        `Scope '${scope}' is not allowed for setting '${key}'. Allowed: ${definition.allowed_scopes.join(', ')}`
      );
    }

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // Check if value already exists for this scope
      const existingRes = await client.query<{ id: string; version: number; value: unknown }>(
        'SELECT id, version, value FROM platform.settings_values WHERE definition_id = $1 AND scope = $2 AND scope_id = $3',
        [definition.id, scope, scopeId]
      );

      let settingValueId: string;
      let newVersion = 1;
      let previousValue: unknown = null;

      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        settingValueId = existing.id;
        newVersion = existing.version + 1;
        previousValue = existing.value;

        await client.query(
          `UPDATE platform.settings_values 
           SET value = $1, version = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [JSON.stringify(value), newVersion, actorId, settingValueId]
        );
      } else {
        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO platform.settings_values (
             definition_id, scope, scope_id, value, version, created_by, updated_by
           ) VALUES ($1, $2, $3, $4, 1, $5, $5)
           RETURNING id`,
          [definition.id, scope, scopeId, JSON.stringify(value), actorId]
        );
        settingValueId = insertRes.rows[0].id;
      }

      // Record in immutable versions table
      await client.query(
        `INSERT INTO platform.settings_versions (
           setting_value_id, version, value, reason, changed_by
         ) VALUES ($1, $2, $3, $4, $5)`,
        [settingValueId, newVersion, JSON.stringify(value), reason || 'Configuration update', actorId]
      );

      await client.query('COMMIT');

      // Record in system audit logs
      await this.auditService.log({
        actorId,
        resource: 'setting',
        resourceId: key,
        action: 'setting.updated',
        stateDiff: {
          scope,
          scopeId,
          previous: previousValue,
          current: value,
          version: newVersion,
        },
      });

      return {
        key,
        scope,
        scopeId,
        value,
        version: newVersion,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get version history for rollback / inspection
   */
  async getSettingHistory(key: string, scope: string, scopeId: string) {
    const definition = await this.getDefinitionByKey(key);
    const valueRes = await dbPool.query<{ id: string }>(
      'SELECT id FROM platform.settings_values WHERE definition_id = $1 AND scope = $2 AND scope_id = $3',
      [definition.id, scope, scopeId]
    );

    if (valueRes.rows.length === 0) {
      return [];
    }

    const versions = await dbPool.query(
      `SELECT v.*, u.first_name, u.last_name, u.email
       FROM platform.settings_versions v
       LEFT JOIN identity.users u ON v.changed_by = u.id
       WHERE v.setting_value_id = $1
       ORDER BY v.version DESC`,
      [valueRes.rows[0].id]
    );

    return versions.rows;
  }

  /**
   * Feature Flags
   */
  async getFeatureFlags(scope = 'PLATFORM', scopeId = 'GLOBAL') {
    const res = await dbPool.query(
      'SELECT * FROM platform.feature_flags WHERE (scope = $1 AND scope_id = $2) OR scope = \'PLATFORM\' ORDER BY key ASC',
      [scope, scopeId]
    );
    return res.rows;
  }

  async setFeatureFlag(
    key: string,
    name: string,
    state: string,
    description?: string,
    scope = 'PLATFORM',
    scopeId = 'GLOBAL'
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.feature_flags (key, name, state, description, scope, scope_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key) DO UPDATE
       SET state = $3, name = $2, description = COALESCE($4, platform.feature_flags.description), updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, name, state, description || null, scope, scopeId]
    );
    return res.rows[0];
  }

  /**
   * Theme Tokens
   */
  async getTheme(scope = 'PLATFORM', scopeId = 'GLOBAL') {
    const res = await dbPool.query(
      'SELECT * FROM platform.theme_tokens WHERE scope = $1 AND scope_id = $2 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
      [scope, scopeId]
    );
    if (res.rows.length > 0) return res.rows[0];

    // Fallback to platform default theme
    const fallback = await dbPool.query(
      "SELECT * FROM platform.theme_tokens WHERE scope = 'PLATFORM' AND is_default = TRUE LIMIT 1"
    );
    return fallback.rows[0] || null;
  }

  async saveTheme(
    name: string,
    scope: string,
    scopeId: string,
    palette: string,
    tokens: Record<string, unknown>
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.theme_tokens (name, scope, scope_id, palette, tokens, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)
       RETURNING *`,
      [name, scope, scopeId, palette, JSON.stringify(tokens), scope === 'PLATFORM' && scopeId === 'GLOBAL']
    );
    return res.rows[0];
  }
}
