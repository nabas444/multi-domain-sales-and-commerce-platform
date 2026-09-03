// crm.types.ts
// CRM, Leads, Pipelines, Deals, Appointments, Quotations

export type LeadSource = 'PLATFORM' | 'PARTNER' | 'AGENT' | 'CAMPAIGN' | 'ORGANIC' | 'REFERRAL' | 'IMPORT' | 'DIRECT_INQUIRY';
export type LeadAttributionType = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'ASSIGNED_AGENT' | 'PARTNER_INVENTORY' | 'CAMPAIGN' | 'MANUAL_OVERRIDE';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'APPOINTMENT_SCHEDULED' | 'NEGOTIATING' | 'WON' | 'LOST' | 'DISQUALIFIED';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'ABANDONED';
export type AppointmentType = 'SITE_VISIT' | 'VIRTUAL_TOUR' | 'OFFICE_MEETING' | 'TECHNICAL_SURVEY' | 'INSPECTION';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Customer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  preferredContactMethod: 'PHONE' | 'WHATSAPP' | 'EMAIL' | 'TELEGRAM';
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  organizationId: string;
  domainId: string;
  customerId: string;
  listingId?: string | null;
  branchId?: string | null;
  assignedAgentId?: string | null;
  source: LeadSource;
  attributionType: LeadAttributionType;
  attributionDetails?: Record<string, unknown>;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  requirements?: Record<string, unknown>;
  inquiryMessage?: string;
  slaDeadline?: Date;
  slaBreached: boolean;
  firstResponseAt?: Date;
  qualifiedAt?: Date;
  lostReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  actorId?: string;
  type: 'CALL' | 'NOTE' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'SITE_VISIT' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'QUALIFICATION';
  subject: string;
  body?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  code: string;
  stageOrder: number;
  winProbability: number;
  requiredFields?: string[];
  isWonStage: boolean;
  isLostStage: boolean;
  createdAt: Date;
}

export interface Deal {
  id: string;
  organizationId: string;
  domainId: string;
  pipelineId: string;
  stageId: string;
  leadId?: string | null;
  customerId: string;
  listingId?: string | null;
  assignedAgentId?: string | null;
  title: string;
  dealValue: number;
  currency: string;
  status: DealStatus;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  lostReason?: string;
  commissionCalculated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  organizationId: string;
  leadId?: string | null;
  listingId?: string | null;
  customerId: string;
  hostAgentId: string;
  type: AppointmentType;
  scheduledStart: Date;
  scheduledEnd: Date;
  location: string;
  status: AppointmentStatus;
  notes?: string;
  feedback?: string;
  checklistResults?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
