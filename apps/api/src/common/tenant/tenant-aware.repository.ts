import { Injectable } from '@nestjs/common';
import { dbPool, QueryResult, QueryResultRow } from '@platform/database';
import { TenantContextService } from './tenant-context.service.js';

@Injectable()
export abstract class TenantAwareRepository<T extends QueryResultRow = QueryResultRow> {
  constructor(protected readonly tenantContextService: TenantContextService) {}

  protected get currentTenantId(): string {
    return this.tenantContextService.getOrganizationId();
  }

  /**
   * Executes a query scoped strictly to the current tenant organization.
   * Ensures that the organization_id filter is always applied.
   */
  protected async queryTenantScoped(
    text: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    const orgId = this.currentTenantId;
    return await dbPool.query<T>(text, [orgId, ...params]);
  }
}
