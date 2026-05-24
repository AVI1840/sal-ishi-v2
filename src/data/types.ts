// ═══════════════════════════════════════════════════════════════
// סל אישי — מנוע חיזוק חיים אישי
// Data Model: מוטיבציות, חסמים, חוזקות, שינוי התנהגות
// ═══════════════════════════════════════════════════════════════

// ─── מוטיבציות ─────────────────────────────────────────────────
export type Motivation =
  | "health"           // בריאות
  | "belonging"        // שייכות
  | "independence"     // עצמאות
  | "meaning"          // משמעות
  | "self_efficacy"    // תחושת מסוגלות
  | "family"           // משפחה
  | "recognition"      // הכרה והוקרה
  | "curiosity"        // סקרנות
  | "comfort"          // נוחות
  | "growth";          // התפתחות אישית

export const MOTIVATION_LABELS: Record<Motivation, string> = {
  health: "בריאות",
  belonging: "שייכות",
  independence: "עצמאות",
  meaning: "משמעות",
  self_efficacy: "תחושת מסוגלות",
  family: "משפחה",
  recognition: "הכרה והוקרה",
  curiosity: "סקרנות",
  comfort: "נוחות",
  growth: "התפתחות אישית",
};

// ─── חסמים ─────────────────────────────────────────────────────
export type Barrier =
  | "fear"             // פחד
  | "anxiety"          // חרדה
  | "shame"            // בושה
  | "cost"             // עלות
  | "mobility"         // ניידות
  | "lack_knowledge"   // חוסר ידע
  | "social_difficulty"// קושי חברתי
  | "resistance"       // התנגדות לשינוי
  | "low_motivation"   // ירידת מוטיבציה
  | "fatigue"          // עייפות
  | "distrust";        // חוסר אמון

export const BARRIER_LABELS: Record<Barrier, string> = {
  fear: "פחד",
  anxiety: "חרדה",
  shame: "בושה",
  cost: "עלות",
  mobility: "ניידות",
  lack_knowledge: "חוסר ידע",
  social_difficulty: "קושי חברתי",
  resistance: "התנגדות לשינוי",
  low_motivation: "ירידת מוטיבציה",
  fatigue: "עייפות",
  distrust: "חוסר אמון",
};

// ─── חוזקות (VIA-based) ────────────────────────────────────────
export type Strength =
  | "wisdom"           // חכמה/ידע
  | "courage"          // אומץ
  | "justice"          // צדק
  | "transcendence"   // נשגבות
  | "temperance"      // מתינות
  | "humanity";       // אנושיות

export const STRENGTH_LABELS: Record<Strength, string> = {
  wisdom: "חכמה וידע",
  courage: "אומץ",
  justice: "צדק",
  transcendence: "נשגבות",
  temperance: "מתינות",
  humanity: "אנושיות",
};

// ─── מוכנות לשינוי (Transtheoretical Model) ───────────────────
export type ReadinessStage =
  | "precontemplation" // לא מודע/לא מעוניין
  | "contemplation"    // שוקל
  | "preparation"      // מתכונן
  | "action"           // פועל
  | "maintenance";     // מתמיד

export const READINESS_LABELS: Record<ReadinessStage, string> = {
  precontemplation: "לא מודע",
  contemplation: "שוקל/ת",
  preparation: "מתכונן/ת",
  action: "פועל/ת",
  maintenance: "מתמיד/ה",
};

// ─── פרופיל אישי דינמי ────────────────────────────────────────
export interface PersonalProfile {
  // בסיס
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  city: string;
  neighborhood: string;
  familyStatus: string;
  hasCloseFamily: boolean;
  language: string;
  digitalLiteracy: 1 | 2 | 3 | 4 | 5;

  // מצב תפקודי וחברתי
  perceivedHealth: 1 | 2 | 3 | 4 | 5;
  loneliness: 1 | 2 | 3 | 4 | 5;       // 1=לא בודד, 5=בודד מאוד
  activityLevel: 1 | 2 | 3 | 4 | 5;
  socialBelonging: 1 | 2 | 3 | 4 | 5;
  independence: 1 | 2 | 3 | 4 | 5;
  selfEfficacy: 1 | 2 | 3 | 4 | 5;

  // מוטיבציות, חסמים, חוזקות
  motivations: Motivation[];
  barriers: Barrier[];
  strengths: Strength[];
  readiness: ReadinessStage;

  // העדפות
  preferredActivities: string[];
  preferredHours: string;
  preferredFormat: "alone" | "small_group" | "large_group" | "flexible";
  interests: string[];

  // מדדים דינמיים
  engagementScore: number;    // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  persistenceRate: number;    // 0-100 (% התמדה)
  lastActivityDays: number;
  weeklyActivities: number;

  // חלום ומשמעות
  dream: string;
  meaningStatement: string;

  // מטא
  avatar: string;
  coordinatorId: string;
}

// ─── Nudge ─────────────────────────────────────────────────────
export type NudgeType =
  | "encouragement"    // חיזוק
  | "reminder"         // תזכורת
  | "reflection"       // שיקוף הצלחה
  | "social_proof"     // הוכחה חברתית
  | "milestone"        // ציון דרך
  | "reactivation";   // החזרה לפעילות

export interface Nudge {
  id: string;
  citizenId: string;
  type: NudgeType;
  message: string;
  emoji: string;
  sentAt: string;
  opened: boolean;
}

// ─── AI Recommendation ─────────────────────────────────────────
export interface AIRecommendation {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  whyRecommended: string;      // למה הומלץ
  valueForCitizen: string;     // מה הערך למשתתף
  confidence: number;          // 0-100
  expectedBarriers: string[];  // חסמים צפויים
  nextAction: string;          // פעולה הבאה
  motivationMatch: Motivation[];
  urgency: "low" | "medium" | "high";
}

// ─── Timeline Event (CRM טיפולי) ──────────────────────────────
export type TimelineEventType =
  | "intake"
  | "call"
  | "visit"
  | "note"
  | "service_start"
  | "service_end"
  | "nudge_sent"
  | "milestone"
  | "risk_alert"
  | "mood_change"
  | "ai_recommendation";

export interface TimelineEvent {
  id: string;
  citizenId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  by?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
}

// ─── Risk Alert ────────────────────────────────────────────────
export type RiskSignal =
  | "activity_drop"        // ירידה בפעילות
  | "absence"              // היעדר השתתפות
  | "loneliness_increase"  // החמרת בדידות
  | "mood_decline"         // ירידת מצב רוח
  | "social_withdrawal"    // withdrawal חברתי
  | "low_persistence"      // חוסר התמדה
  | "cancellations"        // ביטולי שירותים
  | "deterioration_risk";  // סיכון להידרדרות

export interface RiskAlert {
  id: string;
  citizenId: string;
  citizenName: string;
  signal: RiskSignal;
  severity: "warning" | "critical";
  description: string;
  detectedAt: string;
  resolved: boolean;
  suggestedAction: string;
}

// ─── Service ───────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  motivationsServed: Motivation[];
  barriersAddressed: Barrier[];
  strengthsActivated: Strength[];
  cost: number;
  subsidyTier: "full" | "partial" | "paid";
  format: "alone" | "small_group" | "large_group";
  duration: string;
  location: string;
  emoji: string;
  color: string;
  engagementRate: number;  // % התמדה ממוצעת
}

// ─── KPI ───────────────────────────────────────────────────────
export interface KPI {
  id: string;
  label: string;
  value: string | number;
  description: string;
  trend: number;
  trendLabel: string;
  icon: string;
  tone: string;
}

// ─── Coordinator ───────────────────────────────────────────────
export interface Coordinator {
  id: string;
  name: string;
  citizenCount: number;
  region: string;
}

// ═══════════════════════════════════════════════════════════════
// Types from libi-dashboard (B) — needed for national prototype pages
// ═══════════════════════════════════════════════════════════════

export type NursingLevel = 1 | 2 | 3;

export type ContentWorld =
  | "belonging_meaning"
  | "health_function"
  | "resilience"
  | "assistive_tech"
  | "home_services";

export interface ServiceB {
  id: string;
  name: string;
  world: ContentWorld;
  units: number;
  subsidy: number;
  description: string;
  vendor: string;
}

export type Persona =
  | "social_active"
  | "homebody"
  | "tech_curious"
  | "tradition_keeper"
  | "caregiver_dependent";

export type RiskFlag =
  | "loneliness"
  | "inactive"
  | "low_balance"
  | "functional_decline"
  | "expiring_balance"
  | "fall_risk";

export interface FunctionalProfile {
  mobility: number;
  cognition: number;
  emotional: number;
  social: number;
  vision: number;
  hearing: number;
  verified: boolean;
}

export interface Wallet {
  total: number;
  balance: number;
  optimalAgingUnits: number;
}

export interface LevProfile {
  persona: Persona;
  meaningTags: string[];
  lonelinessScore: number;
  riskFlags: RiskFlag[];
  dream: string;
  engagementTips: string[];
  verified: boolean;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  city: string;
  phone: string;
  emergencyContact: { name: string; relation: string; phone: string };
  nursingLevel: NursingLevel;
  active: boolean;
  wallet: Wallet;
  lev: LevProfile;
  functional: FunctionalProfile;
  conditions: string[];
  preferences: string[];
  lastActivity: string;
  daysSinceActivity: number;
}

export type ActionPriority = "high" | "medium" | "low";
export type ActionStatus = "pending" | "in_progress" | "completed";
export type ActionType =
  | "loneliness_intervention"
  | "wallet_optimization"
  | "expiring_balance"
  | "functional_decline"
  | "reactivation"
  | "family_engagement";

export interface CrmAction {
  id: string;
  clientId: string;
  type: ActionType;
  typeLabel: string;
  priority: ActionPriority;
  title: string;
  description: string;
  suggestion: string;
  suggestedServiceIds: string[];
  status: ActionStatus;
  createdAt: string;
  hoursOpen: number;
  escalated: boolean;
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertB {
  id: string;
  clientId?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  read: boolean;
  resolved: boolean;
  createdAt: string;
}

export type BookingStatusB = "scheduled" | "completed" | "cancelled" | "in_progress";

export interface BookingB {
  id: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: BookingStatusB;
  units: number;
}

export type ScheduleType =
  | "visit" | "call" | "vendor" | "plan" | "assessment" | "family" | "report";

export interface ScheduleItem {
  id: string;
  time: string;
  type: ScheduleType;
  title: string;
  note: string;
  urgent?: boolean;
}
