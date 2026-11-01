/**
 * סוכני המערכת: ששת הסוכנים שהוגדרו בהאקתון (מיפוי שירותים, התאמה, עדכון,
 * מדידה, תמרוץ ומיקוד, ומנהל שמתזמר ביניהם). בכלי הזה כל סוכן רץ באמת, ידנית,
 * על הקטלוג, התיק והכללים של ההדגמה: "להריץ עכשיו" מחשב ומציג תוצאה אמיתית.
 * בייצור הם יתוזמנו אצל ספק העל או האינטגרטור. בלי טענות על ענן או 24/7.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle2, ChevronLeft, Compass, Gauge, Loader2, Megaphone, Network, Play, Shuffle, UserCog, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDemoAuthority, coverage, DEMO_JERUSALEM, isProposal, ruleKeys } from "@sal-ishi/core";
import { catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { matchServicesForCitizen, getActiveWeights } from "@/lib/matchingEngine";
import { buildCaseload, triage } from "@/pilot/caseload";
import { getPilot } from "@/pilot/store";
import { DEMO_ANSWERS, profileFor } from "@/pilot/questionnaire";
import { incentivesOn } from "@/lib/incentives";

interface RunResult {
  lines: string[];
  at: string;
}

interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  does: string;
  input: string;
  output: string;
  today: { label: string; to: string };
  /** איפה הוגדר הסוכן (מסמך או קוד מהמאגר). */
  source: string;
  /** מה רץ כאן בפועל: חישוב או מנוע חוקים על נתוני ההדגמה. */
  engine: string;
  /** סטטוס הסוכן עצמו. בכלי הזה אין סוכן AI פעיל. */
  status: "מנוע פעיל בכלי" | "סימולציה" | "מתוכנן";
  production: string;
  run: () => string[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

function runMapping(): string[] {
  const data = buildDemoAuthority(DEMO_JERUSALEM);
  const cov = coverage(data, catalogState.seed);
  const red = cov.cells.filter((c) => c.level === "red");
  const hoods = new Set(red.map((c) => c.neighborhoodId)).size;
  const access = cov.alerts.filter((a) => a.kind === "accessible").length;
  const unmet = (data.unmetDemand ?? []).reduce((n, u) => n + u.requests, 0);
  return [
    `נסרקו ${data.services.length} שירותים מ-${data.suppliers.length} ספקים ב-${data.neighborhoods.length} שכונות.`,
    `${red.length} פערים אדומים ברצפה, ב-${hoods} שכונות. ${access} התראות נגישות.`,
    `${unmet} בקשות "ביקשו ואין" מהמלוות: מה לגייס קודם.`,
  ];
}

function runMatching(): string[] {
  const people = ["c1", "c2", "c3"].map((id) => profileFor(id, DEMO_ANSWERS[id])!).filter(Boolean);
  const tops = people.map((p) => ({ name: p.name.split(" ")[0], top: matchServicesForCitizen(p, { topN: 3 }) }));
  const w = getActiveWeights();
  return [
    `חושבו ${people.length * realServices.length} התאמות (${people.length} פרופילים מלאים × ${realServices.length} שירותים), לפי המשקלות שבהגדרות: מניעה ${pct(w.prevention)}, רצון ${pct(w.motivation)}, יכולות ${pct(w.profileFit)}, זמינות ${pct(w.proximity)}.`,
    ...tops.map((t) => `${t.name}: ${t.top.map((r) => r.service.name).join(", ")}.`),
    "סינון בטיחות: מי שמרותק לבית לא מקבל שירות שדורש הליכה עצמאית.",
  ];
}

function runUpdate(): string[] {
  const s = catalogState.seed;
  const rules = ruleKeys(s.settings);
  const open = rules.filter((k) => isProposal(s.settings, k)).length;
  return [
    `גרסת הבסיס ${s.meta.version}: ${rules.length} כללים, ${open} מהם הצעה שממתינה להכרעה.`,
    `הקטלוג לאזרח: ${realServices.length} שירותים מאושרים מ-${catalogState.neighborhoods} שכונות (מקור: ${catalogState.origin === "published" ? "קטלוג שפורסם מהמטה" : "קטלוג ההדגמה"}).`,
    "כל שינוי כלל במטה נרשם ביומן ונכנס לגרסה בפרסום. הייצוא לספק מתעדכן מיד.",
  ];
}

function runMeasure(): string[] {
  const people = buildCaseload();
  const started = people.filter((p) => p.firstServiceDone);
  const avg = started.reduce((n, p) => n + p.utilization, 0) / Math.max(1, started.length);
  const red = catalogState.seed.settings.red_flag_avg ?? 0.35;
  const target = catalogState.seed.settings.utilization_target ?? 0.7;
  const low = started.filter((p) => p.utilization < red).length;
  const notStarted = people.filter((p) => !p.firstServiceDone).length;
  const { derived } = getPilot();
  return [
    `מיצוי ממוצע ברבעון: ${pct(avg)} (יעד ${pct(target)}). ${low} מתחת ל-${pct(red)}.`,
    `${notStarted} אזרחים עוד לא התחילו שירות ראשון.`,
    `בהדגמה עכשיו: ${derived.bookings.filter((b) => b.status !== "cancelled").length} הזמנות פעילות, ${derived.requests.filter((r) => r.status === "open").length} בקשות פתוחות.`,
  ];
}

function runCopilot(): string[] {
  const items = triage(buildCaseload(), getPilot().derived);
  const today = items.filter((i) => i.bucket === "today");
  const week = items.filter((i) => i.bucket === "week");
  return [
    `למלווה: ${today.length} לפנות היום, ${week.length} השבוע. הראשון: ${today[0]?.person.name ?? "אין"}.`,
    today[0] ? `הסיבה: ${today[0].reasons[0]?.text ?? "ראו בתיק"}. כל פעולה באישור המלווה.` : "אין מי שדורש פנייה היום.",
  ];
}

function runEngage(): string[] {
  const items = triage(buildCaseload(), getPilot().derived);
  const low = items.filter((i) => i.reasons.some((r) => r.rule === "low_utilization" || r.rule === "no_first_service"));
  return [
    `${low.length} אזרחים שכדאי לעודד: הצעה לשיעור ניסיון, שירות קרוב יותר לבית, או פעילות עם חבר (רק בהסכמה של שניהם).`,
    "ההצעות נוצרו כאן ולא נשלחו לאיש: אין ערוץ הודעות מחובר.",
    incentivesOn() ? "תמריצים בנקודות פעילים." : "תמריצים בנקודות כבויים עד הכרעה על מקור המימון.",
  ];
}

/** מודיעין שירותים והיצע: מיפוי, ועדכון הקטלוג כחלק ממנו (לא סוכן נפרד). */
function runIntel(): string[] {
  return [...runMapping(), ...runUpdate().slice(0, 2)];
}

const SRC = "מסמך ארכיטקטורת הסוכנים (docs/AWS_AGENTS_ARCHITECTURE.md)";

const AGENTS: Agent[] = [
  {
    id: "intel", name: "מודיעין שירותים והיצע", icon: Compass,
    does: "רץ באזור, מוצא שירותים חדשים ומתאימים ומציע אותם לקטלוג, מזהה שינויים בשירות ומידע חסר, ומסמן לבדיקה פער בין ביקוש להיצע: מה ביקשו המלוות ואין, ושכונה מתחת לרצפה. כולל עדכון הקטלוג, שאינו סוכן נפרד.",
    input: "האטלס של השטח, חבילות הפיילוט, בקשות המלוות, גרסאות הקטלוג", output: "הצעות להוספה או עדכון, התראות לאימות, מפת פערים",
    today: { label: "אטלס המטה ופערים", to: "/executive/atlas" },
    source: `${SRC}: Service Discovery Agent (סריקה שבועית ועדכון קטלוג). פרומפט הסריקה: מסמך המיפוי, חלק ה'`,
    engine: "חישוב כיסוי מול הרצפה, פערים, ניהול גרסאות ויומן שינויים על נתוני ההדגמה. אין סריקת רשת, ושינוי מהותי בקטלוג לא מתפרסם בלי אישור המטה",
    status: "מנוע פעיל בכלי",
    production: "סריקה חודשית של מקורות אמיתיים, והצעות לאימות על ידי המטה.", run: runIntel,
  },
  {
    id: "matching", name: "התאמה ותכנון אישי", icon: Shuffle,
    does: "מחשב לכל אזרח את השירותים שמתאימים לו בחמש שכבות, עם משפט למה, ומציע חלופות כשאין התאמה או זמינות. בהמשך: תכנית אישית עם רצף צעדים, לא רק המלצות נקודתיות.",
    input: "פרופיל האזרח והשאלון, הקטלוג, הארנק", output: "2 עד 3 המלצות בכל תחום, עם הסבר",
    today: { label: "אלגוריתם ההתאמה", to: "/executive/algorithm" },
    source: `${SRC}: Matching Engine. הקוד בכלי: אלגוריתם ההתאמה`,
    engine: "מנוע חוקים דטרמיניסטי, חמש שכבות ומשקלות מההגדרות. לא מודל שפה. תכנית אישית ברצף צעדים: מתוכנן",
    status: "מנוע פעיל בכלי",
    production: "רץ על כל שינוי בפרופיל או בקטלוג, אצל הספק.", run: runMatching,
  },
  {
    id: "engage", name: "הנעה אישית ורצף", icon: Megaphone,
    does: "פועל בעיקר מול האזרח: מעודד לצאת, להשתתף ולהתמיד לפי המוטיבציות והתכנית שלו. טיפים והמלצות, תזכורות, יעד קטן כשקשה להתמיד, ו\"החבר שלך גם מגיע\" (רק בהסכמה של שניהם). כל פנייה לאזרח עוברת דרך המלווה.",
    input: "התכנית האישית, ההשתתפות, מה שחשוב לאזרח", output: "הצעות עידוד, תזכורות, הצעות לשינוי בתכנית",
    today: { label: "תזכורות ב\"השירותים שלי\"", to: "/citizen/activities" },
    source: `${SRC}: Nudge Engine, והגדרת הסוכן במסמך ההנחיות לגרסה 0.7`,
    engine: "כללי הצעה לפי מיצוי ושירות ראשון. תזכורות במכשיר בלבד. ההצעות לא נשלחות לאיש: אין ערוץ הודעות מחובר",
    status: "סימולציה",
    production: "מסרים דרך ערוץ מחובר, באישור המלווה ובהסכמת האזרח.", run: runEngage,
  },
  {
    id: "copilot", name: "טייס משנה למלווה", icon: UserCog,
    does: "הופך את עבודת המלווה לפרואקטיבית: מי לפנות היום ולמה, מי לא השתתף, תעדוף לפי דחיפות, והצעת פעולה. לא מחליף את שיקול דעתה ולא מחליט בשמה.",
    input: "התיק, היומן, ההזמנות והבקשות", output: "\"לפנות היום\", תקציר ומשימות מתועדפות, התראות",
    today: { label: "היום של המלווה", to: "/coordinator" },
    source: `${SRC}: Deterioration Monitor ו-Nudge Engine, והגדרת הסוכן במסמך ההנחיות לגרסה 0.7`,
    engine: "כללי מיון דטרמיניסטיים בתיק, פעילים במסך המלווה. תקציר לשיחה וניסוח הודעה: מתוכנן",
    status: "מנוע פעיל בכלי",
    production: "תקצירים והצעות ניסוח, עם מודל שפה רק לניסוח, ובאישור המלווה.", run: runCopilot,
  },
  {
    id: "measure", name: "מדידה, למידה ושיפור", icon: Gauge,
    does: "בודק מה הביא תוצאות: שביעות רצון, מה אנשים אהבו, אחוז הגעה וחזרה, מיצוי ושאר מדדי התכנית, בלי תאים קטנים. מציף התראות כשיש פערים. מבחין בין נתון, מתאם והשפעה מוכחת, וכשאין די נתונים כותב זאת.",
    input: "דוח מצטבר מספק העל, הזמנות ונוכחות", output: "מדדים למטה ולמלווה, דגלים",
    today: { label: "מבט על", to: "/executive" },
    source: `${SRC}: Deterioration Monitor (זיהוי ירידה והתראה מוקדמת)`,
    engine: "חישוב מיצוי ופערים מהתיק ומנתוני ההדגמה. בלי חיזוי ובלי מודל. שביעות רצון והתמדה לאורך זמן: מתוכנן",
    status: "מנוע פעיל בכלי",
    production: "הנתונים המצטברים מגיעים מספק העל כל חודש.", run: runMeasure,
  },
];

const ORCHESTRATOR = {
  name: "מנהל (מתזמר)", icon: Network,
  does: "מפעיל את הסוכנים בסדר הנכון, מעביר תוצאה מאחד לשני, ומעביר לאדם כשצריך החלטה.",
  source: "מסמך ארכיטקטורת הסוכנים (docs/AWS_AGENTS_ARCHITECTURE.md), גיליון ההאקתון: Super Agent. בקוד של גרסה 0.4 (שורש האתר): מסלול המלווה, מסך הסוכנים",
  engine: "בכלי הזה: הלחצן מריץ את חמש הפונקציות בסדר קבוע. זו סימולציה של מתזמר, בלי הסקה ובלי מודל",
  status: "סימולציה" as const,
};

/** מוגדר במקורות, מחוץ לגיליון ההאקתון של שישה הסוכנים. */
const ALSO_DEFINED = [
  { name: "לימור (סוכן שיחה לאזרח)", source: "מסמך ארכיטקטורת הסוכנים, ומאגר libi-ai (LimorAgent, orchestrator)", status: "מתוכנן" as const, note: "שיחה עם האזרח כבויה בגרסה הזו. כל פנייה לאזרח עוברת דרך המלווה." },
];

/** איך הסוכנים עובדים יחד: מי נותן למי מה. */
const FLOW = [
  { who: "מודיעין שירותים והיצע", gives: "קטלוג עדכני ופערים", to: "התאמה, והמטה" },
  { who: "התאמה ותכנון אישי", gives: "2 עד 3 המלצות לכל אזרח, עם הסבר", to: "האזרח והמלווה" },
  { who: "הנעה אישית ורצף", gives: "טיפים, תזכורות והזמנה לצאת, לפי המוטיבציות", to: "האזרח, דרך המלווה" },
  { who: "טייס משנה למלווה", gives: "מי לפנות היום, למה, ומה מוצע לעשות", to: "המלווה, שמאשרת או דוחה" },
  { who: "מדידה, למידה ושיפור", gives: "מה קרה בפועל: הגעה, חזרה, שביעות רצון", to: "כולם, וגם התראה כשיש פער" },
];
const FEEDBACK = [
  "להתאמה: מה עבד ומה להחליף, כדי שההמלצה הבאה תהיה טובה יותר (בלי לשנות את המשקלות, שנקבעים במטה).",
  "למודיעין השירותים: איפה חסר שירות, כדי לגייס ספק או להרחיב קיים.",
  "להנעה: מי נשר או לא התחיל, כדי להציע שיחה, שיעור ניסיון או חבר.",
  "לטייס המשנה ולמלווה: התראה עם סיבה, מקור הנתון ומה מוצע לעשות.",
];

/** מנועי חוקים וחישוב: לא סוכנים. */
const ENGINES = [
  { name: "מנוע ההתאמה", text: "חמש שכבות, משקלות 30/30/25/15/0 מההגדרות. דטרמיניסטי, עם הסבר.", to: "/executive/algorithm", label: "לאלגוריתם" },
  { name: "כללי הכיסוי והרצפה", text: "רצפה של 3 שירותים רציפים בכל תחום ליבה בכל שכונה.", to: "/executive/atlas", label: "לאטלס המטה" },
  { name: "נוסחת המיצוי", text: "נקודות שנוצלו חלקי 500 כפול חודשי החלון, למחזיקי סל. לא עולה על 100%.", to: "/executive", label: "למדדי השטח" },
  { name: "כללי המיון בתיק", text: "מי לפנות היום ולמה: אשפוז, בקשה, אין שירות ראשון, מיצוי נמוך.", to: "/coordinator", label: "ליום של המלווה" },
];

function AgentCard(props: { agent: Agent; result?: RunResult; running: boolean; onRun: () => void }) {
  const { agent: a } = props;
  return (
    <article className="libi-card p-5 flex flex-col gap-3" aria-labelledby={`ag-${a.id}`}>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <a.icon className="w-6 h-6" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 id={`ag-${a.id}`} className="text-lg font-bold text-foreground">{a.name}</h2>
          <span className="inline-flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-success-soft text-success border-success/30">{a.status}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-warning-soft text-warning-foreground border-warning/40">סוכן AI: מתוכנן</span>
          </span>
        </div>
      </div>
      <p className="text-sm text-foreground"><span className="font-semibold">הייעוד: </span>{a.does}</p>
      <dl className="text-sm space-y-1">
        <div><dt className="inline font-semibold">מקור ההגדרה: </dt><dd className="inline text-muted-foreground">{a.source}</dd></div>
        <div><dt className="inline font-semibold">מה רץ כאן: </dt><dd className="inline text-muted-foreground">{a.engine}</dd></div>
        <div><dt className="inline font-semibold">מקבל: </dt><dd className="inline text-muted-foreground">{a.input}</dd></div>
        <div><dt className="inline font-semibold">מוציא: </dt><dd className="inline text-muted-foreground">{a.output}</dd></div>
        <div><dt className="inline font-semibold">בייצור (מתוכנן): </dt><dd className="inline text-muted-foreground">{a.production}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2 mt-auto">
        <button type="button" onClick={props.onRun} disabled={props.running} className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
          {props.running ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />} להריץ את החישוב
        </button>
        <Link to={a.today.to} className="min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold inline-flex items-center gap-1">
          {a.today.label} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      {props.result ? (
        <div className="rounded-lg bg-success-soft/50 border border-success/30 p-3" role="status">
          <p className="text-xs text-muted-foreground mb-1">חישוב על נתוני הדגמה, רץ ב-{props.result.at}</p>
          <ul className="space-y-1">
            {props.result.lines.map((l) => (
              <li key={l} className="text-sm text-foreground flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> {l}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export default function ExecutiveAgents() {
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const now = () => new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const runOne = (a: Agent) =>
    new Promise<void>((resolve) => {
      setRunning(a.id);
      setTimeout(() => {
        setResults((r) => ({ ...r, [a.id]: { lines: a.run(), at: now() } }));
        setRunning(null);
        resolve();
      }, 400);
    });
  const runAll = async () => {
    setResults({});
    for (const a of AGENTS) await runOne(a);
    setResults((r) => ({
      ...r,
      orchestrator: {
        at: now(),
        lines: [
          "מודיעין ← התאמה ← הנעה ← טייס משנה ← מדידה: חמשת החישובים רצו בסדר, על נתוני ההדגמה.",
          "מה שדורש החלטה אנושית מוצג לאדם: למלווה (\"לפנות היום\"), ולמטה (כללים שבהצעה). שום דבר לא משתנה אוטומטית.",
        ],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] rounded-2xl p-7 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-7 h-7" aria-hidden="true" /> סוכני המערכת
        </h1>
        <p className="text-base text-white/90 mt-2 max-w-3xl">
          חמישה סוכנים, ומתזמר שמחבר ביניהם: מודיעין שירותים והיצע, התאמה ותכנון אישי, הנעה אישית ורצף, טייס משנה למלווה, ומדידה, למידה ושיפור. "עדכון" כבר לא סוכן נפרד אלא חלק ממודיעין השירותים. סוכן AI עדיין לא קיים בכלי הזה:
          מה שרץ כאן הוא מנוע חוקים וחישוב על נתוני ההדגמה, בלחיצה, בדיוק אותן פונקציות שהכלי משתמש בהן. הסוכנים עצמם מתוכננים, אצל ספק העל.
        </p>
        <button type="button" onClick={runAll} disabled={running !== null} className="mt-4 min-h-[48px] px-5 rounded-xl bg-white text-[#1B3A5C] font-bold inline-flex items-center gap-2 disabled:opacity-60">
          <Network className="w-5 h-5" aria-hidden="true" /> להריץ את כל החישובים בסדר (סימולציה של מתזמר)
        </button>
      </div>

      {/* המנהל והשרשרת */}
      <section className="libi-card p-5" aria-labelledby="orch-h">
        <h2 id="orch-h" className="text-lg font-bold text-foreground flex items-center gap-2">
          <ORCHESTRATOR.icon className="w-6 h-6 text-primary" aria-hidden="true" /> {ORCHESTRATOR.name}
        </h2>
        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md border bg-warning-soft text-warning-foreground border-warning/40 mt-1">{ORCHESTRATOR.status}</span>
        <p className="text-sm text-foreground mt-1">{ORCHESTRATOR.does}</p>
        <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">מקור ההגדרה: </span>{ORCHESTRATOR.source}</p>
        <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">מה רץ כאן: </span>{ORCHESTRATOR.engine}</p>
        <ol className="mt-4 flex flex-wrap items-center gap-2" aria-label="סדר הריצה">
          {AGENTS.map((a, i) => (
            <li key={a.id} className="flex items-center gap-2">
              <span className={cn("min-h-[40px] px-3 rounded-lg border text-sm font-semibold inline-flex items-center gap-1.5", results[a.id] ? "bg-success-soft text-success border-success/30" : running === a.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border")}>
                <a.icon className="w-4 h-4" aria-hidden="true" /> {a.name}
              </span>
              {i < AGENTS.length - 1 ? <ChevronLeft className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : null}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="min-h-[40px] px-3 rounded-lg border border-dashed border-primary text-sm font-semibold inline-flex items-center">החלטה אנושית: מלווה ומטה</span>
          </li>
        </ol>
        {results.orchestrator ? (
          <ul className="mt-3 space-y-1" role="status">
            {results.orchestrator.lines.map((l) => (
              <li key={l} className="text-sm text-foreground flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> {l}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {AGENTS.map((a) => (
          <AgentCard key={a.id} agent={a} result={results[a.id]} running={running === a.id} onRun={() => void runOne(a)} />
        ))}
      </div>

      <section className="libi-card p-5" aria-labelledby="flow-h">
        <h2 id="flow-h" className="text-lg font-bold text-foreground">איך הם עובדים יחד, לטובת האזרחית והמלווה</h2>
        <p className="text-sm text-muted-foreground mt-1">לולאה אחת על מקור נתונים אחד, עם אדם שמחליט בכל נקודה. המתזמר קובע את הסדר, מעביר תוצאה מסוכן לסוכן, ועוצר כשצריך החלטה אנושית.</p>
        <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {FLOW.map((f, i) => (
            <li key={f.who} className="rounded-lg border border-border p-3 text-sm">
              <span className="block font-semibold text-foreground">{i + 1}. {f.who}</span>
              <span className="block text-muted-foreground">נותן: {f.gives}</span>
              <span className="block text-muted-foreground">למי: {f.to}</span>
            </li>
          ))}
        </ol>
        <h3 className="text-sm font-semibold text-foreground mt-4">והמדידה מחזירה את התוצאה אל הלולאה:</h3>
        <ul className="mt-1 space-y-1 text-sm text-foreground list-disc pr-5">
          {FEEDBACK.map((x) => <li key={x}>{x}</li>)}
        </ul>
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning-soft/40 p-3 text-sm text-foreground">
          <p className="font-semibold">ניטור שינויים: יכולת של המתזמר, לא סוכן. מתוכנן, עוד לא ממומש</p>
          <p className="text-muted-foreground mt-1">שינוי בשירות מפעיל את מודיעין השירותים ואת ההתאמה. שינוי בפרופיל או במטרה מפעיל את ההתאמה. היעדרות או ירידה בהשתתפות מפעילה את ההנעה ואת טייס המשנה. משוב חדש מפעיל את המדידה. בכלי הזה הלחצן מריץ חישובים בסדר קבוע, ואין עדיין מנוע אירועים. התכנון: docs/v07-agents/ARCHITECTURE.md.</p>
        </div>
        <p className="text-xs text-muted-foreground mt-3">כללי ברזל: סוכן לא משנה זכאות, תקציב או גישה לשירות. הוא מציע, והמלווה או המטה מחליטים. כל תוצר של סוכן מסומן כהמלצה או כסימולציה, עם מקור הנתון.</p>
      </section>

      <section className="libi-card p-5" aria-labelledby="also-h">
        <h2 id="also-h" className="text-lg font-bold text-foreground">הוגדר במקורות, מחוץ לשישה</h2>
        <ul className="mt-2 space-y-2">
          {ALSO_DEFINED.map((x) => (
            <li key={x.name} className="text-sm text-foreground">
              <span className="font-semibold">{x.name}</span> · <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-warning-soft text-warning-foreground border-warning/40">{x.status}</span>
              <span className="block text-muted-foreground">מקור: {x.source}. {x.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="libi-card p-5" aria-labelledby="eng-h">
        <h2 id="eng-h" className="text-lg font-bold text-foreground">מנועים וכללים: לא סוכנים</h2>
        <p className="text-sm text-muted-foreground mb-3">חישוב וכללים שהמטה קובע ושפועלים בכלי, בלי מודל שפה. הם הבסיס שהסוכנים יישענו עליו.</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ENGINES.map((e) => (
            <li key={e.name} className="rounded-lg border border-border p-3 text-sm">
              <span className="block font-semibold text-foreground">{e.name}</span>
              <span className="block text-muted-foreground">{e.text}</span>
              <Link to={e.to} className="inline-flex items-center gap-1 min-h-[44px] text-primary font-semibold">{e.label} <ChevronLeft className="w-4 h-4" aria-hidden="true" /></Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        הסוכנים לא פועלים לבד מול אזרחים: כל פנייה לאזרח עוברת דרך המלווה, וכל שינוי כלל דרך המטה. אין כאן שרת, ואין הודעות שנשלחות באמת, ואין פעולה אוטומטית שמשנה זכאות, תקציב או גישה לשירות.
      </p>
    </div>
  );
}
