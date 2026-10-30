/**
 * CitizenServices: השוק של הסל. כל שירות מאושר שמגיע לשכונה של האזרחית, מהאטלס
 * (אותו קטלוג שהמלווה והמטה רואים). בנוי לבני 70 ומעלה: חמש דרכים גדולות לחפש
 * (מומלץ לי, כל השירותים, קרוב לבית, פופולרי בשכונה, לפי נושא), נושאים עם
 * תמונה, סינון מהיר, ושתי תצוגות לבחירה (כרטיסים גדולים עם תמונה, או רשימה
 * קצרה). הארנק תמיד למעלה. ההתאמה היא של המנוע, בלי ציונים מול האזרחית.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award, Check, ChevronLeft, Clock, Grid2x2, Home as HomeIcon, LayoutList, ListChecks, MapPin, Search,
  Sparkles, Star, UserCheck, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealService } from "@/data/realServices";
import { catalogState } from "@/data/catalogSource";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { personalRecommendations } from "@/lib/personalMatch";
import { citizenReasons } from "@/lib/citizenReasons";
import { amount } from "@/lib/wallet";
import { SUPPLIER_RATING_NOTE_CITIZEN } from "@/lib/supplierRating";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { usePilot } from "@/pilot/store";
import { isCoordinated, isProduct, isSubscription, priceLabel, priceOf, servicesFor, slotsFor } from "@/pilot/services";
import { weeklyText } from "@/components/citizen/BookingPanel";
import { whereText } from "@/pilot/citizen/Service";
import { usePersonalProfile, useWallet } from "@/pilot/citizen/common";

const QOL = "qol";
const PAGE = 12;
/** "מומלץ לי": שלוש המלצות קודם, ואז "עוד". */
const FIRST = 3;

type Mode = "forme" | "all" | "near" | "popular" | "topics";
const MODES: { id: Mode; label: string; hint: string; icon: typeof Star }[] = [
  { id: "forme", label: "מומלץ לי", hint: "לפי מה שסיפרת", icon: Sparkles },
  { id: "all", label: "כל השירותים", hint: "הכי מתאים קודם", icon: ListChecks },
  { id: "near", label: "קרוב לבית", hint: "בבית, בשכונה, באזור", icon: HomeIcon },
  { id: "popular", label: "פופולרי בשכונה", hint: "מה שאחרים בוחרים", icon: Users },
  { id: "topics", label: "לפי נושא", hint: "שייכות, בריאות ועוד", icon: Grid2x2 },
];

/** שמות הנושאים בשפת האזרח, ותמונה לכל נושא. */
const TOPIC: Record<string, { name: string; img: string }> = {
  belonging: { name: "שייכות ומשמעות", img: "./images/community-club.png" },
  health_function: { name: "בריאות ותנועה", img: "./images/exercise-balls.png" },
  resilience: { name: "חוסן ותמיכה", img: "./images/volunteering.png" },
  digital: { name: "טלפון ומחשב", img: "./images/telemedicine.png" },
  prevention_products: { name: "בטיחות בבית", img: "./images/services-mosaic.png" },
  [QOL]: { name: "איכות חיים", img: "./images/art-class.png" },
};

const DEMAND_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const VIEW_KEY = "sal-ishi-market-view";

/** כמה קרוב לבית: בבית, בשכונה, באזור, מרחוק או בטלפון, ארצי. */
function nearRank(s: RealService, home: string): number {
  if (s.deliveryMode === "home" || s.serviceMode === "home") return 0;
  if (s.deliveryMode === "remote" || s.serviceMode === "remote") return 3;
  if (s.reach === "national") return 4;
  if (s.neighborhood === home) return 1;
  return 2;
}
const NEAR_LABEL = ["מגיע אלייך הביתה", "בשכונה שלך", "באזור, קרוב לשכונה", "מהבית, בטלפון או במחשב", "ארצי"];

const domainOf = (s: RealService) => s.coreCategoryId ?? QOL;

function priceText(s: RealService): string {
  const p = priceOf(s);
  if (p.state === "full") return `${p.funder ?? he.otherFunder} מממן`;
  return priceLabel(s, amount, true);
}

function whenText(s: RealService): string | null {
  if (isProduct(s)) return null;
  const slots = slotsFor(s);
  if (isCoordinated(s) || slots.length === 0) return he.coordinated;
  return isSubscription(s) ? weeklyText(slots[0]) : formatSlot(he, slots[0]);
}

function useView(): ["cards" | "list", (v: "cards" | "list") => void] {
  const [view, setView] = useState<"cards" | "list">(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "cards";
    } catch {
      return "cards";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* אחסון חסום */
    }
  }, [view]);
  return [view, setView];
}

interface CardProps {
  service: RealService;
  view: "cards" | "list";
  reason?: string;
  reasons?: string[];
  badge?: string;
  Title?: "h3" | "h4";
}

/** כרטיס שירות: גדול עם תמונה, או שורה קצרה. אותו מידע, שתי צורות. */
function ServiceCard({ service, view, reason, reasons = [], badge, Title = "h3" }: CardProps) {
  const showImages = useShowImages();
  const { image, gradient } = getServiceImageInfo(service);
  const when = whenText(service);
  const topic = TOPIC[domainOf(service)]?.name;
  const why = reason ?? reasons[0];

  if (view === "list") {
    return (
      <li>
        <Link to={`/citizen/services/${service.id}`} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 min-h-[72px] hover:border-[#1B3A5C]/40">
          <div className="flex-1 min-w-0">
            <Title className="text-lg font-bold text-gray-900 leading-tight">{service.name}</Title>
            <p className="text-base text-gray-700 mt-0.5">
              {priceText(service)} <span aria-hidden="true">·</span> {whereText(he, service)}
            </p>
            {why ? <p className="text-base text-[#1B3A5C] mt-0.5">{why}</p> : null}
          </div>
          <ChevronLeft className="w-6 h-6 text-gray-500 shrink-0" aria-hidden="true" />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={`/citizen/services/${service.id}`}
        className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#1B3A5C]/40 hover:shadow-md transition-all"
      >
        {showImages ? (
          <div className="relative h-36 w-full">
            {image ? <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className={cn("w-full h-full", gradient)} />}
            {topic ? <span className="absolute top-2 right-2 text-sm font-semibold bg-white/95 text-[#1B3A5C] px-2 py-0.5 rounded-lg">{topic}</span> : null}
            {badge ? <span className="absolute top-2 left-2 text-sm font-semibold bg-emerald-700 text-white px-2 py-0.5 rounded-lg">{badge}</span> : null}
          </div>
        ) : null}
        <div className="p-4 flex flex-col gap-1.5 flex-1">
          <Title className="text-xl font-bold text-gray-900 leading-tight">{service.name}</Title>
          {!showImages && badge ? <span className="self-start text-sm font-semibold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-lg">{badge}</span> : null}
          {why ? (
            <p className="text-base text-[#1B3A5C] font-medium flex items-start gap-1.5">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> <span>{why}</span>
            </p>
          ) : null}
          {reasons.filter((r) => r !== why).slice(0, 1).map((r) => (
            <p key={r} className="text-base text-emerald-900 flex items-start gap-1.5">
              <Check className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> <span>{r}</span>
            </p>
          ))}
          <p className="text-base text-gray-800 flex items-start gap-1.5">
            <Wallet className="w-5 h-5 shrink-0 mt-0.5 text-[#1B3A5C]" aria-hidden="true" /> <span className="font-semibold">{priceText(service)}</span>
          </p>
          <p className="text-base text-gray-700 flex items-start gap-1.5">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {whereText(he, service)} <span aria-hidden="true">·</span> {service.provider}
            </span>
          </p>
          {when ? (
            <p className="text-base text-gray-700 flex items-start gap-1.5">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> <span>{when}</span>
            </p>
          ) : null}
          {service.supplierScore ? (
            <p className="text-sm text-gray-600 flex items-start gap-1.5">
              <Award className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" /> <span>דירוג הספק {service.supplierScore.toFixed(1)} מתוך 5</span>
            </p>
          ) : null}
          {service.gatedByCompanion ? (
            <p className="text-base text-violet-900 flex items-start gap-1.5">
              <UserCheck className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> <span>נפתח יחד עם המלווה</span>
            </p>
          ) : null}
          <span className="mt-auto pt-2 inline-flex items-center justify-center gap-1 min-h-[48px] rounded-xl bg-[#1B3A5C] text-white text-base font-bold">
            לפרטים ולהצטרפות <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function CitizenServices() {
  const { simulation } = usePilot().state;
  const chosen = usePilot().derived.interests.get(usePersonalProfile().id) ?? [];
  const profile = usePersonalProfile();
  const wallet = useWallet();
  const [view, setView] = useView();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("forme");
  const [topic, setTopic] = useState<string | null>(null);
  const [page, setPage] = useState(FIRST);
  const [noCopay, setNoCopay] = useState(false);
  const [fromHome, setFromHome] = useState(false);
  const [myLanguage, setMyLanguage] = useState(false);

  const all = useMemo(() => servicesFor(profile.neighborhood), [profile.neighborhood]);
  const ranked = useMemo(() => {
    const ids = new Set(all.map((s) => s.id));
    return matchServicesForCitizen(profile, { topN: 500, minScore: 0 }).filter((r) => ids.has(r.service.id));
  }, [all, profile]);
  const rank = useMemo(() => new Map(ranked.map((r, i) => [r.service.id, i])), [ranked]);
  const picks = useMemo(() => personalRecommendations(profile, ranked, 3), [profile, ranked]);
  const reasonOf = new Map(picks.map((p) => [p.result.service.id, p.reason]));
  const whyOf = useMemo(() => new Map(ranked.map((r) => [r.service.id, citizenReasons(r.explanations)])), [ranked]);
  const fitOf = useMemo(() => new Map(ranked.map((r) => [r.service.id, r.totalScore >= 70 ? "מתאים לך מאוד" : r.totalScore >= 55 ? "מתאים לך" : undefined])), [ranked]);

  const topics = useMemo(() => {
    const present = new Set(all.map(domainOf));
    const ids = [...catalogState.seed.core_categories.map((c) => c.id), QOL].filter((id) => present.has(id));
    const ordered = [...ids.filter((d) => chosen.includes(d)), ...ids.filter((d) => !chosen.includes(d))];
    return ordered.map((id) => ({ id, ...(TOPIC[id] ?? { name: id, img: "" }), count: all.filter((s) => domainOf(s) === id).length }));
  }, [all, chosen]);

  const langCode: Record<string, string> = { עברית: "hebrew", ערבית: "arabic", רוסית: "russian" };
  const q = query.trim();
  const filtered = all.filter(
    (s) =>
      (!topic || domainOf(s) === topic) &&
      (!q || s.name.includes(q) || (s.subcategory ?? "").includes(q) || (s.serviceTypeName ?? "").includes(q)) &&
      (!noCopay || priceOf(s).copay === 0) &&
      (!fromHome || [0, 3].includes(nearRank(s, profile.neighborhood))) &&
      (!myLanguage || s.languages.includes(langCode[profile.language] ?? "hebrew")),
  );
  const byRank = (a: RealService, b: RealService) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999);
  const forMe = [...filtered.filter((s) => reasonOf.has(s.id)), ...filtered.filter((s) => !reasonOf.has(s.id) && fitOf.get(s.id)).sort(byRank)];
  const list =
    mode === "forme"
      ? forMe
      : [...filtered].sort((a, b) =>
          mode === "popular"
            ? (DEMAND_RANK[a.demand ?? ""] ?? 3) - (DEMAND_RANK[b.demand ?? ""] ?? 3) || byRank(a, b)
            : mode === "near"
              ? nearRank(a, profile.neighborhood) - nearRank(b, profile.neighborhood) || byRank(a, b)
              : byRank(a, b),
        );
  const badgeOf = (s: RealService) =>
    mode === "popular" ? (s.demand === "high" ? "פופולרי מאוד" : s.demand === "medium" ? "פופולרי" : undefined) : mode === "near" ? NEAR_LABEL[nearRank(s, profile.neighborhood)] : fitOf.get(s.id);
  const gridClass = view === "cards" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3";
  const used = wallet.total ? Math.min(100, Math.round(((wallet.total - wallet.left) / wallet.total) * 100)) : 0;

  if (simulation.noServices) {
    return (
      <main id="main" tabIndex={-1} className="px-6 pt-16 pb-6 space-y-3" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">{he.noServicesTitle}</h1>
        <p className="text-base text-gray-800">{he.noServicesText}</p>
      </main>
    );
  }

  const chip = (on: boolean) =>
    cn("min-h-[48px] px-4 rounded-full text-base font-semibold border inline-flex items-center gap-1.5", on ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-800 border-gray-300");

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* כותרת וארנק */}
      <div className="bg-[#1B3A5C] text-white px-6 pt-24 pb-6">
        <h1 className="text-3xl font-bold">השירותים בשכונה שלך</h1>
        <p className="text-lg text-white/90 mt-1">
          {profile.neighborhood} · {all.length} שירותים מאושרים, {all.filter((s) => s.reach !== "national").length} מהם בשכונה ובאזור
        </p>
        <div className="mt-4 bg-white/10 rounded-xl p-4">
          <p className="text-lg">
            נשארו לך <span className="text-2xl font-bold">{amount(wallet.left)}</span> החודש
          </p>
          <div className="mt-2 h-3 bg-white/25 rounded-full overflow-hidden" role="img" aria-label={`השתמשת ב-${used} אחוז מהארנק החודש`}>
            <div className="h-full bg-white rounded-full" style={{ width: `${used}%` }} />
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" aria-hidden="true" />
          <input
            type="search"
            aria-label="חיפוש שירות"
            value={query}
            onChange={(e) => (setQuery(e.target.value), setPage(PAGE))}
            placeholder="מה מחפשים? למשל: שירה, הליכה, טלפון"
            className="w-full min-h-[56px] pr-11 pl-4 rounded-xl border-0 bg-white text-gray-900 text-lg placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-white/40"
          />
        </div>
      </div>

      <main id="main" tabIndex={-1} className="px-4 sm:px-6 pt-5 pb-6 space-y-6" data-read>
        {/* חמש דרכים לחפש */}
        <section aria-labelledby="how-h">
          <h2 id="how-h" className="text-xl font-bold text-gray-900 mb-3">איך לחפש?</h2>
          <div role="radiogroup" aria-label="איך לחפש" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                onClick={() => (setMode(m.id), setPage(m.id === "forme" ? FIRST : PAGE), m.id !== "topics" && setTopic(null))}
                className={cn(
                  "min-h-[64px] px-3 py-2 rounded-xl border text-right flex items-center gap-2",
                  mode === m.id ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-gray-900 border-gray-300 hover:border-[#1B3A5C]/50",
                )}
              >
                <m.icon className="w-6 h-6 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-base font-bold leading-tight">{m.label}</span>
                  <span className={cn("block text-sm", mode === m.id ? "text-white/85" : "text-gray-600")}>{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* נושאים עם תמונה */}
        {mode === "topics" || topic ? (
          <section aria-labelledby="topics-h">
            <h2 id="topics-h" className="text-xl font-bold text-gray-900 mb-3">נושאים</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="נושא">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={topic === t.id}
                  onClick={() => (setTopic(topic === t.id ? null : t.id), setPage(PAGE))}
                  className={cn("relative h-28 rounded-xl overflow-hidden border-2 text-right", topic === t.id ? "border-[#1B3A5C] ring-2 ring-[#1B3A5C]/40" : "border-transparent")}
                >
                  {t.img ? <img src={t.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <span className="absolute bottom-2 right-3 left-3 text-white">
                    <span className="block text-lg font-bold leading-tight">{t.name}</span>
                    <span className="block text-sm">{t.count} שירותים</span>
                  </span>
                  {topic === t.id ? <Check className="absolute top-2 left-2 w-7 h-7 p-1 rounded-full bg-white text-[#1B3A5C]" aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* סינון מהיר ותצוגה */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="סינון">
          <button type="button" aria-pressed={noCopay} onClick={() => setNoCopay(!noCopay)} className={chip(noCopay)}>
            {noCopay ? <Check className="w-4 h-4" aria-hidden="true" /> : null} בלי תשלום ממני
          </button>
          <button type="button" aria-pressed={fromHome} onClick={() => setFromHome(!fromHome)} className={chip(fromHome)}>
            {fromHome ? <Check className="w-4 h-4" aria-hidden="true" /> : null} בבית או בטלפון
          </button>
          <button type="button" aria-pressed={myLanguage} onClick={() => setMyLanguage(!myLanguage)} className={chip(myLanguage)}>
            {myLanguage ? <Check className="w-4 h-4" aria-hidden="true" /> : null} ב{profile.language}
          </button>
          <span className="flex-1" />
          <div className="inline-flex rounded-full border border-gray-300 bg-white p-1" role="group" aria-label="תצוגה">
            <button type="button" aria-pressed={view === "cards"} onClick={() => setView("cards")} className={cn("min-h-[44px] px-3 rounded-full text-base font-semibold inline-flex items-center gap-1", view === "cards" ? "bg-[#1B3A5C] text-white" : "text-gray-800")}>
              <Grid2x2 className="w-5 h-5" aria-hidden="true" /> כרטיסים
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("min-h-[44px] px-3 rounded-full text-base font-semibold inline-flex items-center gap-1", view === "list" ? "bg-[#1B3A5C] text-white" : "text-gray-800")}>
              <LayoutList className="w-5 h-5" aria-hidden="true" /> רשימה
            </button>
          </div>
        </div>

        <section aria-labelledby="results-h" className="space-y-3">
          <h2 id="results-h" className="text-xl font-bold text-gray-900">
            {mode === "forme" ? "מומלץ לך" : MODES.find((m) => m.id === mode)?.label}
            {topic ? `: ${TOPIC[topic]?.name ?? ""}` : ""}
            <span className="text-base font-normal text-gray-600"> · {list.length} שירותים</span>
          </h2>
          {mode === "forme" ? <p className="text-base text-gray-700">לפי מה שסיפרת לנו ולמלווה. הראשונים מתאימים לך הכי הרבה.</p> : null}
          <p className="sr-only" role="status" aria-live="polite">{list.length} שירותים</p>
          <ul className={gridClass}>
            {list.slice(0, page).map((sv) => (
              <ServiceCard key={sv.id} service={sv} view={view} reason={reasonOf.get(sv.id)} reasons={whyOf.get(sv.id)} badge={badgeOf(sv)} />
            ))}
          </ul>
          {list.length > page ? (
            <button type="button" className="w-full min-h-[52px] rounded-xl border-2 border-[#1B3A5C] text-[#1B3A5C] text-lg font-bold bg-white" onClick={() => setPage(page + PAGE)}>
              {mode === "forme" && page === FIRST ? `עוד שירותים שמתאימים לך (${list.length - page})` : `להראות עוד ${Math.min(PAGE, list.length - page)} (מתוך ${list.length})`}
            </button>
          ) : null}
          {list.length === 0 ? (
            <p className="text-lg text-gray-800 bg-white border border-gray-200 rounded-xl p-4">
              לא מצאנו. אפשר לנסות מילה אחרת, להוריד סינון, או לבקש מהמלווה.
            </p>
          ) : null}
          {mode === "forme" && list.length > 0 ? (
            <button type="button" onClick={() => (setMode("all"), setPage(PAGE))} className="w-full min-h-[52px] rounded-xl bg-white border border-gray-300 text-gray-900 text-lg font-semibold">
              לראות את כל {all.length} השירותים
            </button>
          ) : null}
        </section>

        <p className="text-sm text-gray-600">{SUPPLIER_RATING_NOTE_CITIZEN}</p>
      </main>
    </div>
  );
}
