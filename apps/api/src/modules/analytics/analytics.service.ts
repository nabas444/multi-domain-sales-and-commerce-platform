import { Injectable } from '@nestjs/common';
import { dbPool } from '@platform/database';

export interface ExecutiveOverview {
  totalListings: number;
  publishedListings: number;
  totalInventoryValue: number;
  totalLeads: number;
  totalDeals: number;
  grossMerchandiseValue: number;
  platformFeesEarned: number;
  agentCommissionsEarned: number;
  currency: string;
}

export interface FunnelStageMetric {
  stage: string;
  count: number;
  conversionRate: number;
}

@Injectable()
export class AnalyticsService {
  /**
   * Executive high-level commercial dashboard metrics
   */
  async getExecutiveOverview(organizationId?: string): Promise<ExecutiveOverview> {
    const orgParam = organizationId ? [organizationId] : [];
    const orgFilter = organizationId ? 'AND organization_id = $1' : '';

    const [listingStats, leadStats, dealStats, feeStats] = await Promise.all([
      dbPool.query(
        `SELECT
           COUNT(*)::int as total,
           COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END)::int as published,
           COALESCE(SUM(CASE WHEN status = 'PUBLISHED' THEN price ELSE 0 END), 0)::numeric as total_value
         FROM inventory.listings
         WHERE deleted_at IS NULL ${orgFilter}`,
        orgParam
      ),
      dbPool.query(
        `SELECT COUNT(*)::int as total
         FROM crm.leads
         WHERE 1=1 ${orgFilter}`,
        orgParam
      ),
      dbPool.query(
        `SELECT
           COUNT(*)::int as total_deals,
           COALESCE(SUM(CASE WHEN status = 'WON' THEN deal_value ELSE 0 END), 0)::numeric as gmv
         FROM sales.deals
         WHERE 1=1 ${orgFilter}`,
        orgParam
      ),
      dbPool.query(
        `SELECT
           COALESCE(SUM(calculated_amount), 0)::numeric as platform_fees,
           0::numeric as agent_commissions
         FROM commercial.fee_events
         WHERE status IN ('EARNED', 'INVOICED', 'PAID') ${orgFilter}`,
        orgParam
      ),
    ]);

    const lRow = listingStats.rows[0];
    const ldRow = leadStats.rows[0];
    const dRow = dealStats.rows[0];
    const fRow = feeStats.rows[0];

    return {
      totalListings: lRow?.total || 0,
      publishedListings: lRow?.published || 0,
      totalInventoryValue: parseFloat(lRow?.total_value || '0'),
      totalLeads: ldRow?.total || 0,
      totalDeals: dRow?.total_deals || 0,
      grossMerchandiseValue: parseFloat(dRow?.gmv || '0'),
      platformFeesEarned: parseFloat(fRow?.platform_fees || '0'),
      agentCommissionsEarned: parseFloat(fRow?.agent_commissions || '0'),
      currency: 'ETB',
    };
  }

  /**
   * Lead-to-deal conversion funnel analytics
   */
  async getSalesFunnelMetrics(organizationId?: string): Promise<{ stages: FunnelStageMetric[]; winRate: number }> {
    const orgParam = organizationId ? [organizationId] : [];
    const orgFilter = organizationId ? 'AND d.organization_id = $1' : '';

    const res = await dbPool.query<{ stage: string; count: string }>(
      `SELECT COALESCE(ps.name, d.status) as stage, COUNT(d.id)::int as count
       FROM sales.deals d
       LEFT JOIN sales.pipeline_stages ps ON d.stage_id = ps.id
       WHERE 1=1 ${orgFilter}
       GROUP BY COALESCE(ps.name, d.status)
       ORDER BY count DESC`,
      orgParam
    );

    const totalDeals = res.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    const stages: FunnelStageMetric[] = res.rows.map((r) => {
      const count = parseInt(r.count, 10);
      return {
        stage: r.stage,
        count,
        conversionRate: totalDeals > 0 ? Math.round((count / totalDeals) * 100) : 0,
      };
    });

    const wonCount = stages.find((s) => s.stage === 'CLOSED_WON')?.count || 0;
    const winRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;

    return { stages, winRate };
  }

  /**
   * Multi-domain & category performance breakdown
   */
  async getDomainCategoryPerformance() {
    const res = await dbPool.query(
      `SELECT
         d.id as domain_id,
         d.name as domain_name,
         d.slug as domain_slug,
         c.id as category_id,
         c.name as category_name,
         COUNT(l.id)::int as active_listings,
         COALESCE(SUM(l.price), 0)::numeric as inventory_volume,
         COALESCE(AVG(l.price), 0)::numeric as average_price
       FROM domains.domains d
       JOIN domains.categories c ON c.domain_id = d.id
       LEFT JOIN inventory.listings l ON l.category_id = c.id AND l.status = 'PUBLISHED' AND l.deleted_at IS NULL
       GROUP BY d.id, d.name, d.slug, c.id, c.name
       ORDER BY active_listings DESC, inventory_volume DESC`
    );
    return res.rows;
  }

  /**
   * Marketing lead source & campaign attribution breakdown
   */
  async getAttributionMetrics(organizationId?: string) {
    const orgParam = organizationId ? [organizationId] : [];
    const orgFilter = organizationId ? 'AND organization_id = $1' : '';

    const res = await dbPool.query(
      `SELECT
         COALESCE(source, 'DIRECT') as source,
         COUNT(*)::int as total_leads,
         COUNT(CASE WHEN status = 'QUALIFIED' THEN 1 END)::int as qualified_leads,
         COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END)::int as converted_deals
       FROM crm.leads
       WHERE 1=1 ${orgFilter}
       GROUP BY COALESCE(source, 'DIRECT')
       ORDER BY total_leads DESC`,
      orgParam
    );

    return res.rows;
  }
}
