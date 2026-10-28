// Canonical, domain-agnostic, pseudonymized data model for Sal Ishi.
// Shared by the web app (src/) and the AWS Lambda handlers (infra/lambda/) —
// this is the single source of truth for entity shapes. See
// PROMPT_SONNET5_PRODUCTION.md "Data model" for the design rationale.
//
// D2 (locked): no field here may hold a teudat zehut, full name, exact
// address, or phone number. The linkage between personId and a real
// identity is kept by companions outside this system.

export type TenantId = string; // e.g. "jerusalem" for the pilot
export type Program = "nursing" | "disability" | "employment" | "rehabilitation";

export type PersonStatus = "active" | "paused" | "closed";

export interface Person {
  personId: string; // ULID
  tenantId: TenantId;
  alias: string; // first name or a chosen alias — never a full legal name
  birthYear: number; // not a full date of birth
  gender: "male" | "female" | "other";
  neighborhood: string; // never a street address
  languages: string[];
  sector: "secular" | "arab" | "haredi" | "mixed";
  companionId: string; // owning companion — enforced server-side on every query
  consentAt: string; // ISO timestamp captured at intake
  status: PersonStatus;
  createdAt: string;
  updatedAt: string;
}

// Nursing-specific fields live in programProfile. Nothing outside this
// interface may reference nursing-specific concepts — new programs get
// their own programProfile shape instead of widening this one.
export interface NursingProgramProfile {
  icfFunctionalLevel: 1 | 2 | 3 | 4 | 5;
  loneliness: 1 | 2 | 3 | 4 | 5;
  activityLevel: 1 | 2 | 3 | 4 | 5;
  independence: 1 | 2 | 3 | 4 | 5;
  motivations: string[];
  barriers: string[];
  readiness: "precontemplation" | "contemplation" | "preparation" | "action" | "maintenance";
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface Enrollment {
  personId: string;
  program: Program;
  programProfile: NursingProgramProfile; // widen with a union as programs are added
  startedAt: string;
}

export type WalletPeriod = string; // "YYYY-MM"

export interface Wallet {
  walletId: string; // `${personId}#${period}`
  personId: string;
  period: WalletPeriod;
  allocatedUnits: number;
  // Balance is NEVER stored as mutable truth — it is always folded from
  // Transaction records at read time (see foldWalletBalance below).
}

export type TransactionType = "allocate" | "freeze" | "consume" | "release" | "adjust";

export interface Transaction {
  txId: string; // ULID, sortable
  walletId: string;
  type: TransactionType;
  units: number; // positive for allocate/release, negative for freeze/consume
  bookingId?: string;
  actorId: string;
  timestamp: string;
}

export function foldWalletBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => balance + tx.units, 0);
}

export type ContentWorld =
  | "belonging_meaning"
  | "health_function"
  | "resilience"
  | "assistive_tech"
  | "home_services";

export const SUBSIDY_TIER_BY_CONTENT_WORLD: Record<ContentWorld, number> = {
  belonging_meaning: 1.0,
  health_function: 1.0,
  resilience: 0.5,
  assistive_tech: 0.5,
  home_services: 0.2,
};

export interface Service {
  serviceId: string;
  tenantId: TenantId;
  name: string;
  contentWorld: ContentWorld;
  provider: string;
  neighborhood: string;
  unitCost: number;
  active: boolean;
}

export type BookingStatus =
  | "recommended"
  | "selected"
  | "units_frozen"
  | "booked"
  | "attended"
  | "cancelled";

export interface Booking {
  bookingId: string;
  personId: string;
  serviceId: string;
  status: BookingStatus;
  aiRecommended: boolean;
  explanations: string[];
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Valid transitions for the booking state machine. Server-side handlers
// must reject any transition not listed here (see infra/lambda/bookings).
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  recommended: ["selected"],
  selected: ["units_frozen", "cancelled"],
  units_frozen: ["booked", "cancelled"],
  booked: ["attended", "cancelled"],
  attended: [],
  cancelled: [],
};

export type CrmActionPriority = "high" | "medium" | "low";
export type CrmActionStatus = "pending" | "in_progress" | "completed";

export interface CrmAction {
  actionId: string;
  personId: string;
  priority: CrmActionPriority;
  status: CrmActionStatus;
  title: string;
  description: string;
  suggestedServiceIds: string[];
  createdAt: string;
}

export type TimelineEventType =
  | "intake"
  | "call"
  | "visit"
  | "note"
  | "booking"
  | "risk_alert";

export interface TimelineEvent {
  eventId: string;
  personId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  actorId: string;
}

export interface RiskSignal {
  personId: string;
  timestamp: string;
  rdi: number; // Risk Deterioration Index
  sdi: number; // Service Diversity Index
  inputs: Record<string, number>;
}

export type AuditAction = "create" | "read" | "update" | "delete";

export interface AuditLogEntry {
  auditId: string;
  actorId: string;
  action: AuditAction;
  entity: string; // e.g. "Person", "Booking"
  entityId: string;
  timestamp: string;
  beforeHash?: string;
  afterHash?: string;
}
