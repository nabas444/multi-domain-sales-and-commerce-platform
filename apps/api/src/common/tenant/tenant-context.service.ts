import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestTenantContext {
  userId: string;
  userEmail: string;
  organizationId: string;
  branchId?: string | null;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class TenantContextService {
  private static readonly storage = new AsyncLocalStorage<RequestTenantContext>();

  run<T>(context: RequestTenantContext, callback: () => Promise<T>): Promise<T> {
    return TenantContextService.storage.run(context, callback);
  }

  getContext(): RequestTenantContext | undefined {
    return TenantContextService.storage.getStore();
  }

  getOrganizationId(): string {
    const ctx = this.getContext();
    if (!ctx?.organizationId) {
      throw new Error('Tenant context missing: organizationId not found in current execution context');
    }
    return ctx.organizationId;
  }

  getUserId(): string {
    const ctx = this.getContext();
    if (!ctx?.userId) {
      throw new Error('Tenant context missing: userId not found in current execution context');
    }
    return ctx.userId;
  }

  isSuperAdmin(): boolean {
    return !!this.getContext()?.isSuperAdmin;
  }
}
