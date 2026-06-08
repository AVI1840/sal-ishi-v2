import type {
  PersonalProfile, Service, AIRecommendation, TimelineEvent,
  RiskAlert, Nudge, KPI, Coordinator,
  Motivation, Barrier, Strength, ReadinessStage,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// CITIZENS — פרופילים דינמיים עם מוטיבציות, חסמים, חוזקות
// ═══════════════════════════════════════════════════════════════

// Generate additional citizens to reach 75
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function pick<T>(rng: () => number, arr: T[]): T { return arr[Math.floor(rng() * arr.length)]; }
function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr]; const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) { const idx = Math.floor(rng() * copy.length); result.push(copy.splice(idx, 1)[0]); }
  return result;
}

const NAMES_F = ["לאה", "חנה", "מרים", "אסתר", "ציפורה", "מלכה", "פנינה", "דבורה", "תמר", "נעמי", "שושנה", "ברכה", "יעל", "זהבה", "אורה", "רינה", "דליה", "חיה", "גילה", "בתיה"];
const NAMES_M = ["דוד", "אברהם", "יצחק", "שמואל", "אליעזר", "חיים", "מנחם", "ראובן", "שלמה", "בנימין", "נתן", "גדעון", "אריה", "עמרם", "צבי", "מאיר", "יהודה", "עזרא", "נחום", "זכריה"];
const LAST_NAMES = ["כהן", "לוי", "מזרחי", "פרץ", "גבאי", "ביטון", "אברהם", "פרידמן", "אזולאי", "דהן", "חדד", "עמר", "אלמליח", "טולדנו", "סויסה", "בן דוד", "רוזן", "שפירא", "גולדברג", "קליין"];
const NEIGHBORHOODS = ["פסגת זאב", "גילה", "קטמון", "עיר גנים", "רמות", "נווה יעקב", "תלפיות", "בית הכרם"];
const ALL_MOTIVATIONS: Motivation[] = ["health", "belonging", "independence", "meaning", "self_efficacy", "family", "recognition", "curiosity", "comfort", "growth"];
const ALL_BARRIERS: Barrier[] = ["fear", "anxiety", "shame", "cost", "mobility", "lack_knowledge", "social_difficulty", "resistance", "low_motivation", "fatigue", "distrust"];
const ALL_STRENGTHS: Strength[] = ["wisdom", "courage", "justice", "transcendence", "temperance", "humanity"];
const READINESS_OPTIONS: ReadinessStage[] = ["precontemplation", "contemplation", "preparation", "action", "maintenance"];
const GEN_ACTIVITIES = ["שירה", "בישול", "שיחות", "שחמט", "קריאה", "טיולים", "גינון", "ציור", "יוגה", "ריקוד", "סריגה", "צילום", "התנדבות", "תפילה"];
const GEN_INTERESTS = ["מוזיקה", "טבע", "אומנות", "ספורט", "טכנולוגיה", "היסטוריה", "בישול", "נכדים", "תפילה", "קריאה", "גינון", "צילום"];
const DREAMS = ["לשמור על עצמאות", "לפגוש חברים חדשים", "ללמוד דברים חדשים", "לעזור לאחרים", "לטייל בארץ", "לכתוב ספר זיכרונות", "ללמד נכדים", "לחזור לתחביב ישן"];

function generateCitizen(i: number): PersonalProfile {
  const rng = seeded(i * 17 + 3);
  const female = rng() > 0.4;
  const name = `${pick(rng, female ? NAMES_F : NAMES_M)} ${pick(rng, LAST_NAMES)}`;
  const age = 65 + Math.floor(rng() * 28);
  const neighborhood = pick(rng, NEIGHBORHOODS);
  const engagementScore = Math.floor(rng() * 100);
  const loneliness = (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const riskLevel = engagementScore < 20 ? "critical" : engagementScore < 40 ? "high" : engagementScore < 65 ? "medium" : "low";

  return {
    id: `c${i + 7}`,
    name,
    age,
    gender: female ? "female" : "male",
    city: "ירושלים",
    neighborhood,
    familyStatus: pick(rng, ["נשוי/אה", "אלמן/ה", "גרוש/ה", "רווק/ה"]),
    hasCloseFamily: rng() > 0.3,
    language: "עברית",
    digitalLiteracy: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    perceivedHealth: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    loneliness,
    activityLevel: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    socialBelonging: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    independence: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    selfEfficacy: (Math.floor(rng() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    motivations: pickN(rng, ALL_MOTIVATIONS, 2 + Math.floor(rng() * 2)) as Motivation[],
    barriers: pickN(rng, ALL_BARRIERS, Math.floor(rng() * 3)) as Barrier[],
    strengths: pickN(rng, ALL_STRENGTHS, 1 + Math.floor(rng() * 2)) as Strength[],
    readiness: pick(rng, READINESS_OPTIONS),
    preferredActivities: pickN(rng, GEN_ACTIVITIES, 2 + Math.floor(rng() * 2)),
    preferredHours: pick(rng, ["בוקר 8-11", "בוקר 9-12", "אחה״צ 14-16", "גמיש"]),
    preferredFormat: pick(rng, ["alone", "small_group", "large_group", "flexible"] as const),
    interests: pickN(rng, GEN_INTERESTS, 2 + Math.floor(rng() * 3)),
    engagementScore,
    riskLevel: riskLevel as "low" | "medium" | "high" | "critical",
    persistenceRate: Math.floor(rng() * 100),
    lastActivityDays: Math.floor(rng() * 21),
    weeklyActivities: Math.floor(rng() * 6),
    dream: pick(rng, DREAMS),
    meaningStatement: "כל יום הוא הזדמנות חדשה",
    avatar: "",
    coordinatorId: pick(rng, ["co1", "co2"]),
  };
}

const generatedCitizens = Array.from({ length: 69 }, (_, i) => generateCitizen(i));

export const CITIZENS: PersonalProfile[] = [
  {
    id: "c1", name: "שרה כהן", age: 78, gender: "female",
    city: "ירושלים", neighborhood: "פסגת זאב", familyStatus: "אלמנה",
    hasCloseFamily: true, language: "עברית", digitalLiteracy: 2,
    perceivedHealth: 3, loneliness: 4, activityLevel: 2, socialBelonging: 2, independence: 4, selfEfficacy: 3,
    motivations: ["belonging", "meaning", "family"],
    barriers: ["fear", "social_difficulty", "low_motivation"],
    strengths: ["humanity", "wisdom"],
    readiness: "contemplation",
    preferredActivities: ["שירה", "בישול", "שיחות"],
    preferredHours: "בוקר 9-12", preferredFormat: "small_group",
    interests: ["מוזיקה ישראלית", "בישול לחג", "נכדים"],
    engagementScore: 32, riskLevel: "high", persistenceRate: 25,
    lastActivityDays: 7, weeklyActivities: 0,
    dream: "לחזור לשיר במקהלה כמו פעם",
    meaningStatement: "כשאני שרה, אני מרגישה שאני עדיין חיה",
    avatar: "", coordinatorId: "co1",
  },
  {
    id: "c2", name: "אהרון מזרחי", age: 82, gender: "male",
    city: "ירושלים", neighborhood: "פסגת זאב", familyStatus: "נשוי",
    hasCloseFamily: true, language: "עברית", digitalLiteracy: 1,
    perceivedHealth: 2, loneliness: 3, activityLevel: 2, socialBelonging: 3, independence: 3, selfEfficacy: 2,
    motivations: ["independence", "health", "curiosity"],
    barriers: ["mobility", "fear", "fatigue"],
    strengths: ["wisdom", "temperance"],
    readiness: "precontemplation",
    preferredActivities: ["שחמט", "קריאה", "רדיו"],
    preferredHours: "בוקר 10-12", preferredFormat: "alone",
    interests: ["היסטוריה", "חדשות", "שחמט"],
    engagementScore: 18, riskLevel: "critical", persistenceRate: 15,
    lastActivityDays: 14, weeklyActivities: 0,
    dream: "לשמור על עצמאות ולהמשיך לקרוא",
    meaningStatement: "הספרים הם החברים הכי טובים שלי",
    avatar: "", coordinatorId: "co1",
  },
  {
    id: "c3", name: "יוסף כהן", age: 72, gender: "male",
    city: "ירושלים", neighborhood: "פסגת זאב", familyStatus: "נשוי",
    hasCloseFamily: true, language: "עברית", digitalLiteracy: 3,
    perceivedHealth: 4, loneliness: 2, activityLevel: 4, socialBelonging: 4, independence: 5, selfEfficacy: 4,
    motivations: ["health", "growth", "belonging"],
    barriers: ["cost"],
    strengths: ["courage", "justice"],
    readiness: "action",
    preferredActivities: ["טיולים", "גינון", "בישול"],
    preferredHours: "בוקר 8-11", preferredFormat: "small_group",
    interests: ["טבע", "גינון", "בישול מזרחי"],
    engagementScore: 78, riskLevel: "low", persistenceRate: 85,
    lastActivityDays: 1, weeklyActivities: 4,
    dream: "לטייל בכל שמורות הטבע בארץ",
    meaningStatement: "כשאני בטבע אני מרגיש חופשי ובריא",
    avatar: "", coordinatorId: "co1",
  },
  {
    id: "c4", name: "רבקה לוי", age: 75, gender: "female",
    city: "ירושלים", neighborhood: "גילה", familyStatus: "אלמנה",
    hasCloseFamily: false, language: "עברית", digitalLiteracy: 1,
    perceivedHealth: 3, loneliness: 5, activityLevel: 1, socialBelonging: 1, independence: 3, selfEfficacy: 2,
    motivations: ["belonging", "comfort", "family"],
    barriers: ["shame", "social_difficulty", "low_motivation", "fear"],
    strengths: ["humanity", "temperance"],
    readiness: "precontemplation",
    preferredActivities: ["בישול", "סדרות טלוויזיה"],
    preferredHours: "אחה״צ 14-16", preferredFormat: "alone",
    interests: ["בישול", "סריגה"],
    engagementScore: 8, riskLevel: "critical", persistenceRate: 0,
    lastActivityDays: 21, weeklyActivities: 0,
    dream: "לחזור לבשל לאירועים משפחתיים",
    meaningStatement: "פעם הייתי מבשלת לכל המשפחה, עכשיו אין למי",
    avatar: "", coordinatorId: "co1",
  },
  {
    id: "c5", name: "אהוה פרידמן", age: 69, gender: "female",
    city: "ירושלים", neighborhood: "פסגת זאב", familyStatus: "נשואה",
    hasCloseFamily: true, language: "עברית", digitalLiteracy: 4,
    perceivedHealth: 4, loneliness: 1, activityLevel: 5, socialBelonging: 5, independence: 5, selfEfficacy: 5,
    motivations: ["growth", "curiosity", "recognition"],
    barriers: [],
    strengths: ["courage", "transcendence", "wisdom"],
    readiness: "maintenance",
    preferredActivities: ["צילום", "טכנולוגיה", "התנדבות"],
    preferredHours: "גמיש", preferredFormat: "flexible",
    interests: ["טכנולוגיה", "צילום", "נכדים", "התנדבות"],
    engagementScore: 95, riskLevel: "low", persistenceRate: 92,
    lastActivityDays: 0, weeklyActivities: 6,
    dream: "ללמד נכדים לערוך סרטונים",
    meaningStatement: "כל יום שאני לומדת משהו חדש הוא יום טוב",
    avatar: "", coordinatorId: "co1",
  },
  {
    id: "c6", name: "משה דהן", age: 79, gender: "male",
    city: "ירושלים", neighborhood: "קטמון", familyStatus: "נשוי",
    hasCloseFamily: true, language: "עברית", digitalLiteracy: 2,
    perceivedHealth: 3, loneliness: 3, activityLevel: 3, socialBelonging: 3, independence: 4, selfEfficacy: 3,
    motivations: ["meaning", "belonging", "health"],
    barriers: ["resistance", "fatigue"],
    strengths: ["transcendence", "justice"],
    readiness: "preparation",
    preferredActivities: ["תפילה", "לימוד תורה", "הליכות"],
    preferredHours: "בוקר מוקדם 7-9", preferredFormat: "small_group",
    interests: ["תפילה", "לימוד", "הליכות בטבע"],
    engagementScore: 55, riskLevel: "medium", persistenceRate: 60,
    lastActivityDays: 3, weeklyActivities: 2,
    dream: "להמשיך ללכת לבית הכנסת כל יום",
    meaningStatement: "התפילה נותנת לי כוח להמשיך",
    avatar: "", coordinatorId: "co2",
  },
  ...generatedCitizens,
];

// ═══════════════════════════════════════════════════════════════
// SERVICES — עם מוטיבציות, חסמים, חוזקות
// ═══════════════════════════════════════════════════════════════

export const SERVICES: Service[] = [
  { id: "s1", name: "מקהלה קהילתית", description: "שירה בקבוצה — שירים ישראליים וקלאסיים", category: "שייכות", motivationsServed: ["belonging", "meaning", "self_efficacy"], barriersAddressed: ["social_difficulty", "low_motivation"], strengthsActivated: ["humanity", "transcendence"], cost: 0, subsidyTier: "full", format: "small_group", duration: "75 דק׳", location: "מתנ״ס", emoji: "🎵", color: "#3b82f6", engagementRate: 82 },
  { id: "s2", name: "התעמלות מותאמת", description: "שיעור קבוצתי מותאם לבני 65+", category: "בריאות", motivationsServed: ["health", "self_efficacy", "belonging"], barriersAddressed: ["fear", "mobility"], strengthsActivated: ["courage"], cost: 0, subsidyTier: "full", format: "small_group", duration: "60 דק׳", location: "מרכז ספורט", emoji: "💪", color: "#22c55e", engagementRate: 75 },
  { id: "s3", name: "מועדון חברתי", description: "מפגשים שבועיים עם ארוחה ופעילות", category: "שייכות", motivationsServed: ["belonging", "comfort", "meaning"], barriersAddressed: ["social_difficulty", "low_motivation", "shame"], strengthsActivated: ["humanity"], cost: 0, subsidyTier: "full", format: "large_group", duration: "3 שעות", location: "מועדון קהילתי", emoji: "🤝", color: "#3b82f6", engagementRate: 70 },
  { id: "s4", name: "סדנת בישול", description: "בישול בריא בקבוצה — מתכונים מותאמים", category: "בריאות", motivationsServed: ["meaning", "belonging", "self_efficacy"], barriersAddressed: ["low_motivation", "social_difficulty"], strengthsActivated: ["wisdom", "humanity"], cost: 0, subsidyTier: "full", format: "small_group", duration: "90 דק׳", location: "מטבח קהילתי", emoji: "🍳", color: "#f59e0b", engagementRate: 88 },
  { id: "s5", name: "קבוצת הליכה", description: "הליכה בפארק עם מדריך בקצב מותאם", category: "בריאות", motivationsServed: ["health", "belonging", "independence"], barriersAddressed: ["fear", "low_motivation"], strengthsActivated: ["courage", "temperance"], cost: 0, subsidyTier: "full", format: "small_group", duration: "45 דק׳", location: "פארק שכונתי", emoji: "🚶", color: "#22c55e", engagementRate: 78 },
  { id: "s6", name: "חוג ציור", description: "ציור בצבעי מים באווירה חמה", category: "יצירה", motivationsServed: ["meaning", "self_efficacy", "growth"], barriersAddressed: ["low_motivation", "shame"], strengthsActivated: ["transcendence", "courage"], cost: 0, subsidyTier: "full", format: "small_group", duration: "90 דק׳", location: "מתנ״ס", emoji: "🎨", color: "#8b5cf6", engagementRate: 80 },
  { id: "s7", name: "ביקור בית מתנדב", description: "שיחה אישית עם מתנדב/ת מותאם/ת", category: "חברתי", motivationsServed: ["belonging", "comfort", "family"], barriersAddressed: ["mobility", "social_difficulty", "fear", "shame"], strengthsActivated: ["humanity"], cost: 0, subsidyTier: "full", format: "alone", duration: "60 דק׳", location: "בבית", emoji: "🏠", color: "#ec4899", engagementRate: 90 },
  { id: "s8", name: "הדרכת סמארטפון", description: "לימוד וואטסאפ, מצלמה, שיחות וידאו", category: "דיגיטל", motivationsServed: ["independence", "family", "curiosity", "growth"], barriersAddressed: ["lack_knowledge", "fear"], strengthsActivated: ["wisdom", "courage"], cost: 10, subsidyTier: "partial", format: "alone", duration: "60 דק׳", location: "ספרייה", emoji: "📱", color: "#0ea5e9", engagementRate: 65 },
  { id: "s9", name: "תמיכה רגשית", description: "שיחות עם עו״ס — ליווי אישי", category: "חוסן", motivationsServed: ["self_efficacy", "meaning", "comfort"], barriersAddressed: ["anxiety", "fear", "low_motivation", "shame"], strengthsActivated: ["courage", "temperance"], cost: 15, subsidyTier: "partial", format: "alone", duration: "50 דק׳", location: "מרכז יום", emoji: "💚", color: "#8b5cf6", engagementRate: 72 },
  { id: "s10", name: "אימון מוח וזיכרון", description: "תרגילי חשיבה, זיכרון ומשחקים", category: "בריאות", motivationsServed: ["independence", "self_efficacy", "curiosity"], barriersAddressed: ["fear", "low_motivation"], strengthsActivated: ["wisdom"], cost: 0, subsidyTier: "full", format: "small_group", duration: "60 דק׳", location: "מרכז יום", emoji: "🧠", color: "#3b82f6", engagementRate: 74 },
];

// ═══════════════════════════════════════════════════════════════
// AI RECOMMENDATIONS — עם "למה" ו"מה הערך"
// ═══════════════════════════════════════════════════════════════

export const AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: "r1", citizenId: "c1", citizenName: "שרה כהן",
    title: "הצטרפות למקהלה הקהילתית",
    whyRecommended: "שרה ציינה שהשירה נותנת לה תחושת חיים. המקהלה מתאימה למוטיבציית השייכות והמשמעות שלה.",
    valueForCitizen: "חיבור חברתי + ביטוי עצמי + תחושת מסוגלות",
    confidence: 92,
    expectedBarriers: ["פחד מקבוצה חדשה", "קושי חברתי ראשוני"],
    nextAction: "שיחה אישית + הצעה להגיע לשיעור ניסיון עם ליווי",
    motivationMatch: ["belonging", "meaning"],
    urgency: "high",
  },
  {
    id: "r2", citizenId: "c4", citizenName: "רבקה לוי",
    title: "ביקור בית מתנדב/ת",
    whyRecommended: "רבקה בבידוד 21 יום. החסמים שלה (בושה, קושי חברתי) מצריכים גישה עדינה בסביבה מוכרת.",
    valueForCitizen: "שבירת בידוד + תחושת שמישהו רואה אותה + בניית אמון",
    confidence: 88,
    expectedBarriers: ["סירוב ראשוני", "בושה", "חוסר אמון"],
    nextAction: "שיחת טלפון קצרה + הצעה לביקור ללא התחייבות",
    motivationMatch: ["belonging", "comfort"],
    urgency: "high",
  },
  {
    id: "r3", citizenId: "c2", citizenName: "אהרון מזרחי",
    title: "אימון מוח וזיכרון",
    whyRecommended: "אהרון אוהב אתגרים אינטלקטואליים. הפעילות תחזק את תחושת העצמאות שחשובה לו.",
    valueForCitizen: "שמירה על חדות מנטלית + תחושת עצמאות + סקרנות",
    confidence: 75,
    expectedBarriers: ["ניידות מוגבלת", "עייפות", "התנגדות לשינוי"],
    nextAction: "הצעה לשיעור ניסיון בבית (אונליין) או הסעה",
    motivationMatch: ["independence", "curiosity"],
    urgency: "medium",
  },
];

// ═══════════════════════════════════════════════════════════════
// NUDGES — חיזוקים ותזכורות חכמות
// ═══════════════════════════════════════════════════════════════

export const NUDGES: Nudge[] = [
  { id: "n1", citizenId: "c3", type: "milestone", message: "כל הכבוד יוסף! השתתפת כבר 4 פעמים השבוע 👏", emoji: "🏆", sentAt: "היום, 08:00", opened: true },
  { id: "n2", citizenId: "c5", type: "reflection", message: "ראינו שנהנית מאוד מסדנת הצילום. רוצה להמשיך?", emoji: "📸", sentAt: "אתמול, 16:00", opened: true },
  { id: "n3", citizenId: "c1", type: "encouragement", message: "שרה, המקהלה מתחילה מחר ב-10:00. נשמח לראות אותך 🎵", emoji: "🎵", sentAt: "היום, 18:00", opened: false },
  { id: "n4", citizenId: "c6", type: "reminder", message: "משה, קבוצת ההליכה יוצאת מחר ב-7:30. מזג האוויר מושלם ☀️", emoji: "🚶", sentAt: "היום, 19:00", opened: false },
  { id: "n5", citizenId: "c4", type: "reactivation", message: "רבקה, חשבנו עלייך. רוצה שנבוא לביקור קצר?", emoji: "💛", sentAt: "היום, 10:00", opened: false },
];

// ═══════════════════════════════════════════════════════════════
// RISK ALERTS
// ═══════════════════════════════════════════════════════════════

export const RISK_ALERTS: RiskAlert[] = [
  { id: "ra1", citizenId: "c4", citizenName: "רבקה לוי", signal: "social_withdrawal", severity: "critical", description: "לא בפעילות 21 יום. ביטלה 3 הזמנות. ירידה חדה במעורבות.", detectedAt: "היום, 07:30", resolved: false, suggestedAction: "ביקור בית דחוף + שיחה עם בן משפחה" },
  { id: "ra2", citizenId: "c2", citizenName: "אהרון מזרחי", signal: "activity_drop", severity: "critical", description: "ירידה מ-3 פעילויות שבועיות ל-0 בשבועיים האחרונים. ירידה קוגניטיבית אפשרית.", detectedAt: "היום, 08:15", resolved: false, suggestedAction: "שיחת טלפון + תיאום הערכה תפקודית" },
  { id: "ra3", citizenId: "c1", citizenName: "שרה כהן", signal: "loneliness_increase", severity: "warning", description: "ציון בדידות עלה מ-3 ל-4. לא יצאה מהבית 7 ימים.", detectedAt: "אתמול, 16:00", resolved: false, suggestedAction: "שיחה אישית + הצעת שירות מותאם" },
  { id: "ra4", citizenId: "c6", citizenName: "משה דהן", signal: "low_persistence", severity: "warning", description: "התמדה ירדה מ-75% ל-60%. ביטל 2 פעילויות ברצף.", detectedAt: "לפני יומיים", resolved: false, suggestedAction: "בירור סיבה + התאמת לוח זמנים" },
];

// ═══════════════════════════════════════════════════════════════
// TIMELINE — CRM טיפולי
// ═══════════════════════════════════════════════════════════════

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "t1", citizenId: "c1", type: "intake", title: "קליטה למערכת", description: "שרה נקלטה. זוהו מוטיבציות: שייכות, משמעות. חסמים: פחד, קושי חברתי.", timestamp: "01.04.26", by: "רונית לוי" },
  { id: "t2", citizenId: "c1", type: "call", title: "שיחת היכרות", description: "שרה סיפרה על אהבתה לשירה. מרגישה בודדה מאז פטירת הבעל.", timestamp: "03.04.26", by: "רונית לוי", mood: 2 },
  { id: "t3", citizenId: "c1", type: "nudge_sent", title: "נשלח חיזוק", description: "הודעה: 'שרה, המקהלה מתחילה ביום ג׳. נשמח לראות אותך 🎵'", timestamp: "07.04.26" },
  { id: "t4", citizenId: "c1", type: "service_start", title: "התחילה מקהלה", description: "שרה הגיעה לשיעור ניסיון! חייכה, שרה, נשארה עד הסוף.", timestamp: "08.04.26", mood: 4 },
  { id: "t5", citizenId: "c1", type: "milestone", title: "ציון דרך 🏆", description: "3 מפגשי מקהלה ברצף! התמדה עולה.", timestamp: "22.04.26", mood: 4 },
  { id: "t6", citizenId: "c1", type: "mood_change", title: "ירידה במצב רוח", description: "שרה לא הגיעה למקהלה. בשיחה אמרה שמרגישה עייפה ולא רלוונטית.", timestamp: "06.05.26", mood: 2 },
  { id: "t7", citizenId: "c1", type: "risk_alert", title: "התראת סיכון", description: "7 ימים ללא פעילות. ציון בדידות עלה.", timestamp: "13.05.26" },
];

// ═══════════════════════════════════════════════════════════════
// KPIs — מדדי הצלחה אמיתיים (לא רק utilization)
// ═══════════════════════════════════════════════════════════════

export const KPIS: KPI[] = [
  { id: "k1", label: "התמדה ממוצעת", value: "64%", description: "% משתתפים שממשיכים אחרי חודש", trend: 5, trendLabel: "+5%", icon: "Target", tone: "success" },
  { id: "k2", label: "ירידת בדידות", value: "-0.8", description: "שינוי ממוצע בציון בדידות", trend: -0.3, trendLabel: "-0.3", icon: "Heart", tone: "success" },
  { id: "k3", label: "מעורבות", value: "58%", description: "% אזרחים פעילים השבוע", trend: 4, trendLabel: "+4%", icon: "Activity", tone: "info" },
  { id: "k4", label: "בסיכון", value: 8, description: "אזרחים עם ירידה במעורבות", trend: 2, trendLabel: "+2", icon: "AlertTriangle", tone: "destructive" },
  { id: "k5", label: "שביעות רצון", value: "4.6/5", description: "ממוצע דירוג משתתפים", trend: 0.2, trendLabel: "+0.2", icon: "Star", tone: "warning" },
];

// ═══════════════════════════════════════════════════════════════
// COORDINATORS
// ═══════════════════════════════════════════════════════════════

export const COORDINATORS: Coordinator[] = [
  { id: "co1", name: "רונית לוי", citizenCount: 143, region: "פסגת זאב" },
  { id: "co2", name: "מיכל כהן", citizenCount: 88, region: "תלפיות + בית חנינא" },
  { id: "co3", name: "סמאח חוסיין", citizenCount: 55, region: "בית חנינא + ואדי ג'וז" },
];
