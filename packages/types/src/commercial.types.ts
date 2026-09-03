// commercial.types.ts
// Commercial Engine, Contracts, Fee Rules, Ledger, Invoices, Settlements, Credits

export type FeeModel = 'SUBSCRIPTION' | 'LISTING_FEE' | 'LEAD_FEE' | 'SUCCESS_DEAL' | 'SALES_AGENT_COMMISSION' | 'HYBRID' | 'CUSTOM';
export type ContractStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'DISPUTED';
export type FeeEventStatus = 'ESTIMATED' | 'PENDING' | 'EARNED' | 'INVOICED' | 'PAYABLE' | 'PAID' | 'DISPUTED' | 'REVERSED';
export type LedgerEntryType = 'PLATFORM_FEE' | 'AGENT_COMMISSION' | 'PARTNER_PAYOUT' | 'SUBSCRIPTION_FEE' | 'ADJUSTMENT' | 'CLAWBACK' | 'CREDIT_PURCHASE';

export interface CommercialPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  price: number;
  currency: string;
  limits: Record<string, unknown>;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  organizationId: string;
  planId?: string | null;
  contractNumber: string;
  version: number;
  status: ContractStatus;
  effectiveDate: string;
  expiryDate?: string;
  feeModel: FeeModel;
  terms: {
    platformFeeRate?: number;
    agentCommissionRate?: number;
    waterfallModel?: string;
    settlementCycleDays?: number;
    exclusivityRequired?: boolean;
    vatRate?: number;
    [key: string]: unknown;
  };
  signedDocumentUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeRule {
  id: string;
  contractId?: string;
  domainId?: string;
  categoryId?: string;
  feeType: 'SUBSCRIPTION' | 'LISTING' | 'QUALIFIED_LEAD' | 'APPOINTMENT' | 'SUCCESS_COMMISSION' | 'AGENT_COMMISSION';
  calculationType: 'FIXED' | 'PERCENTAGE' | 'TIERED';
  rateValue: number;
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  triggerEvent: string;
  createdAt: Date;
}

export interface FeeEvent {
  id: string;
  organizationId: string;
  contractId: string;
  contractVersion: number;
  feeRuleId?: string;
  listingId?: string;
  leadId?: string;
  dealId?: string;
  agentId?: string;
  triggerEvent: string;
  calculationBasis: number;
  calculatedAmount: number;
  currency: string;
  status: FeeEventStatus;
  idempotencyKey?: string;
  notes?: string;
  earnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialLedgerEntry {
  id: string;
  organizationId: string;
  contractId?: string;
  dealId?: string;
  feeEventId?: string;
  entryType: LedgerEntryType;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  balanceAfter: number;
  referenceNumber: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  type: 'SUBSCRIPTION' | 'USAGE_LEAD' | 'COMMISSION' | 'CREDIT_PURCHASE';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  dueDate: string;
  issuedAt: Date;
  paidAt?: Date;
  notes?: string;
}

export interface SettlementStatement {
  id: string;
  organizationId: string;
  statementNumber: string;
  periodStart: string;
  periodEnd: string;
  totalGrossSales: number;
  totalPlatformFees: number;
  totalAgentCommissions: number;
  netPayableToPartner: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  settledAt?: Date;
  notes?: string;
}

export interface CreditWallet {
  id: string;
  organizationId: string;
  creditType: 'LEAD_CREDITS' | 'FEATURED_LISTING' | 'ADVERTISING' | 'API_USAGE' | 'STORAGE';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}
