export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  organizationId?: string | null;
  resource: string;
  resourceId?: string | null;
  action: string;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  stateDiff?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}
