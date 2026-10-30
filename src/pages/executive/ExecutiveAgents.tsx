/**
 * סוכני המערכת: ששת הסוכנים שהוגדרו בהאקתון (מיפוי שירותים, התאמה, עדכון,
 * מדידה, תמרוץ ומיקוד, ומנהל שמתזמר ביניהם). בכלי הזה כל סוכן רץ באמת, ידנית,
 * על הקטלוג, התיק והכללים של ההדגמה: "להריץ עכשיו" מחשב ומציג תוצאה אמיתית.
 * בייצור הם יתוזמנו אצל ספק העל או האינטגרטור. בלי טענות על ענן או 24/7.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle2, ChevronLeft, Compass, Gauge, Loader2, Megaphone, Network, Play, RefreshCw, Shuffle, type LucideIcon } from "lucide-react";
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
  status: "פועל בכלי" | "חלקי בכלי" | "אצל הספק";
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

function runNudge(): string[] {
  const items = triage(buildCaseload(), getPilot().derived);
  const today = items.filter((i) => i.bucket === "today");
  const week = items.filter((i) => i.bucket === "week");
  const low = items.filter((i) => i.reasons.some((r) => r.rule === "low_utilization" || r.rule === "no_first_service"));
  return [
    `למלווה: ${today.length} לפנות היום, ${week.length} השבוע. הראשון: ${today[0]?.person.name ?? "אין"}.`,
    `${low.length} אזרחים שכדאי לעודד: הצעה לשיעור ניסיון, או שירות קרוב יותר לבית.`,
    incentivesOn() ? "תמריצים בנקודות פעילים." : "תמריצים בנקודות כבויים עד הכרעה על מקור המימון.",
  ];
}

const AGENTS: Agent[] = [
  {
    id: "mapping", name: "מיפוי שירותים", icon: Compass,
    does: "סורק את השירותים בכל שכונה, מזהה פערים ברצפה ושירותים שחסרים, ומה ביקשו ואין.",
    input: "האטלס של השטח, חבילות הפיילוט, בקשות המלוות", output: "פערים, חלופות, רשימת גיוס ספקים",
    today: { label: "אטלס המטה ופערים", to: "/executive/atlas" }, status: "פועל בכלי",
    production: "סריקה חודשית, ועדכון אוטומטי של רשימת הגיוס לרשות.", run: runMapping,
  },
  {
    id: "matching", name: "התאמה", icon: Shuffle,
    does: "מחשב לכל אזרח את השירותים שמתאימים לו בחמש שכבות, עם משפט למה.",
    input: "פרופיל האזרח והשאלון, הקטלוג, הארנק", output: "2 עד 3 המלצות בכל תחום, עם הסבר",
    today: { label: "אלגוריתם ההתאמה", to: "/executive/algorithm" }, status: "פועל בכלי",
    production: "רץ על כל שינוי בפרופיל או בקטלוג, אצל הספק.", run: runMatching,
  },
  {
    id: "update", name: "עדכון", icon: RefreshCw,
    does: "מחזיק את הקטלוג והכללים מעודכנים: גרסאות, יומן שינויים, וייצוא לספק לפי התקן.",
    input: "החלטות המטה, שינויי ספקים", output: "גרסת כללים, קטלוג לאזרח, תקן קליטה",
    today: { label: "ספריית הסל", to: "/executive/catalog" }, status: "פועל בכלי",
    production: "פרסום גרסה לספק העל, עם בדיקת סכמה.", run: runUpdate,
  },
  {
    id: "measure", name: "מדידה", icon: Gauge,
    does: "מודד מיצוי, חדירה, פריסה וזמן לשירות ראשון, בלי תאים קטנים.",
    input: "דוח מצטבר מספק העל, הזמנות ונוכחות", output: "מדדים למטה ולמלווה, דגלים",
    today: { label: "מבט על", to: "/executive" }, status: "חלקי בכלי",
    production: "הנתונים המצטברים מגיעים מספק העל כל חודש.", run: runMeasure,
  },
  {
    id: "nudge", name: "תמרוץ ומיקוד", icon: Megaphone,
    does: "ממקד את המלווה במי שצריך אותה, ומציע איך לעודד: שיחה, שיעור ניסיון, תמריץ.",
    input: "המדדים, הכללים, מה שחשוב לאזרח", output: "\"לפנות היום\", משימות, הצעות עידוד",
    today: { label: "היום של המלווה", to: "/coordinator" }, status: "פועל בכלי",
    production: "תזכורות ומסרים נשלחים דרך הספק, באישור המלווה.", run: runNudge,
  },
];

const ORCHESTRATOR = {
  name: "מנהל (מתזמר)", icon: Network,
  does: "מפעיל את הסוכנים בסדר הנכון, מעביר תוצאה מאחד לשני, ומעביר לאדם כשצריך החלטה.",
};

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
          <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-md border mt-1", a.status === "פועל בכלי" ? "bg-success-soft text-success border-success/30" : "bg-warning-soft text-warning-foreground border-warning/40")}>{a.status}</span>
        </div>
      </div>
      <p className="text-sm text-foreground">{a.does}</p>
      <dl className="text-sm space-y-1">
        <div><dt className="inline font-semibold">מקבל: </dt><dd className="inline text-muted-foreground">{a.input}</dd></div>
        <div><dt className="inline font-semibold">מוציא: </dt><dd className="inline text-muted-foreground">{a.output}</dd></div>
        <div><dt className="inline font-semibold">בייצור: </dt><dd className="inline text-muted-foreground">{a.production}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2 mt-auto">
        <button type="button" onClick={props.onRun} disabled={props.running} className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
          {props.running ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />} להריץ עכשיו
        </button>
        <Link to={a.today.to} className="min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold inline-flex items-center gap-1">
          {a.today.label} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      {props.result ? (
        <div className="rounded-lg bg-success-soft/50 border border-success/30 p-3" role="status">
          <p className="text-xs text-muted-foreground mb-1">רץ ב-{props.result.at}</p>
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
          "מיפוי ← התאמה ← עדכון ← מדידה ← תמרוץ: כל השרשרת רצה.",
          "מה שדורש החלטה אנושית הועבר: למלווה (\"לפנות היום\"), ולמטה (כללים שבהצעה).",
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
          שישה סוכנים שהוגדרו בהאקתון: מיפוי שירותים, התאמה, עדכון, מדידה, תמרוץ ומיקוד, ומנהל שמתזמר ביניהם. כאן כל סוכן רץ באמת על הקטלוג, התיק והכללים של
          ההדגמה, בלחיצה. בייצור הם יתוזמנו אצל ספק העל.
        </p>
        <button type="button" onClick={runAll} disabled={running !== null} className="mt-4 min-h-[48px] px-5 rounded-xl bg-white text-[#1B3A5C] font-bold inline-flex items-center gap-2 disabled:opacity-60">
          <Network className="w-5 h-5" aria-hidden="true" /> להריץ את כל השרשרת דרך המנהל
        </button>
      </div>

      {/* המנהל והשרשרת */}
      <section className="libi-card p-5" aria-labelledby="orch-h">
        <h2 id="orch-h" className="text-lg font-bold text-foreground flex items-center gap-2">
          <ORCHESTRATOR.icon className="w-6 h-6 text-primary" aria-hidden="true" /> {ORCHESTRATOR.name}
        </h2>
        <p className="text-sm text-foreground mt-1">{ORCHESTRATOR.does}</p>
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

      <p className="text-sm text-muted-foreground">
        הסוכנים לא פועלים לבד מול אזרחים: כל פנייה לאזרח עוברת דרך המלווה, וכל שינוי כלל דרך המטה. אין כאן שרת, ואין הודעות שנשלחות באמת.
      </p>
    </div>
  );
}
