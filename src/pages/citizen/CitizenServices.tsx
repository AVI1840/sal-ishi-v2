/**
 * CitizenServices: השירותים בשכונה. כל שירות מאושר שמגיע לשכונה של האזרחית, מהאטלס
 * (אותו קטלוג שהמלווה והמטה רואים): מה, מי מפעיל, איפה, מתי, וכמה זה עולה
 * מהארנק, ודירוג הספק. שלושה חלקים: השירותים בשכונה (הכותרת), שירותים בהתאמה
 * אישית (מה שמתאים למה שסיפרה, תמיד למעלה), ושירותים לפי קטגוריה: בכל קטגוריה
 * עד 6 שירותים שמנוע ההתאמה התאים לה, ועד 9 ב"להראות עוד". התחומים שבחרה
 * קודם. רחב, אבל לא מעמיס. כללי ההתאמה הם של המנוע, בלי שינוי. בלי ציונים.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Check, ChevronLeft, Clock, MapPin, Search, Sparkles, UserCheck } from "lucide-react";
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
const MAX_SHOWN = 6;
const MAX_MORE = 9;
/** ברשימה אחת (התאמה, פופולריות, קרבה): כמה בכל פעם. */
const PAGE = 12;

type Order = "fit" | "category" | "popular" | "near";
const ORDERS: { id: Order; label: string; title: string }[] = [
  { id: "fit", label: "הכי מתאים לי", title: "כל השירותים, לפי ההתאמה אלייך" },
  { id: "category", label: "לפי קטגוריה", title: "שירותים לפי קטגוריה" },
  { id: "popular", label: "פופולרי בשכונה", title: "כל השירותים, הפופולריים קודם" },
  { id: "near", label: "קרוב לבית", title: "כל השירותים, הקרובים לבית קודם" },
];
const DEMAND_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** כמה קרוב לבית: בבית, בשכונה, באזור, מרחוק או בטלפון, ארצי. */
function nearRank(s: RealService, home: string): number {
  if (s.deliveryMode === "home" || s.serviceMode === "home") return 0;
  if (s.deliveryMode === "remote" || s.serviceMode === "remote") return 3;
  if (s.reach === "national") return 4;
  if (s.neighborhood === home) return 1;
  return 2;
}
const NEAR_LABEL = ["מגיע אלייך הביתה", "בשכונה שלך", "באזור, קרוב לשכונה", "מהבית, בטלפון או במחשב", "ארצי"];

function domainOf(s: RealService): string {
  return s.coreCategoryId ?? QOL;
}

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

function ServiceCard({ service, reason, reasons = [], badge, level = 3 }: { service: RealService; reason?: string; reasons?: string[]; badge?: string; level?: 3 | 4 }) {
  const Title = level === 4 ? "h4" : "h3";
  const showImages = useShowImages();
  const { image, gradient } = showImages ? getServiceImageInfo(service) : { image: undefined, gradient: "" };
  const when = whenText(service);
  return (
    <li>
      <Link
        to={`/citizen/services/${service.id}`}
        className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all"
      >
        {/* למעלה: תמונה, שם ומחיר. מתחת: הפרטים לכל רוחב הכרטיס, כך שגם בטלפון צר ובטקסט מוגדל אין טור צר. */}
        <div className="flex items-start gap-3">
          {showImages ? (
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
              {image ? <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className={cn("w-full h-full", gradient)} />}
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <Title className="text-base font-bold text-gray-900 leading-tight">{service.name}</Title>
            <span className="inline-block max-w-full mt-1 text-sm px-2 py-0.5 rounded-lg font-semibold bg-blue-50 text-[#1B3A5C]">{priceText(service)}</span>
            {badge ? <span className="inline-block max-w-full mt-1 mr-1 text-sm px-2 py-0.5 rounded-lg font-semibold bg-emerald-50 text-emerald-900">{badge}</span> : null}
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-500 shrink-0 self-center" aria-hidden="true" />
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-gray-700">
          {reason ? (
            <p className="text-[#1B3A5C] font-medium flex items-start gap-1">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span>{reason}</span>
            </p>
          ) : null}
          {reasons.filter((r) => r !== reason).slice(0, 2).map((r) => (
            <p key={r} className="text-emerald-900 flex items-start gap-1">
              <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span>{r}</span>
            </p>
          ))}
          <p className="flex items-start gap-1">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {whereText(he, service)} <span className="text-gray-500" aria-hidden="true">·</span> {service.provider}
            </span>
          </p>
          {when ? (
            <p className="flex items-start gap-1">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span>{when}</span>
            </p>
          ) : null}
          <p className="flex items-start gap-1">
            <Award className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <span>{service.supplierScore ? `דירוג הספק ${service.supplierScore.toFixed(1)} מתוך 5` : "ספק חדש בשוק"}</span>
          </p>
          {service.gatedByCompanion ? (
            <p className="text-violet-900 flex items-start gap-1">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> <span>נפתח יחד עם המלווה</span>
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export default function CitizenServices() {
  const { simulation } = usePilot().state;
  const profile = usePersonalProfile();
  const wallet = useWallet();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [order, setOrder] = useState<Order>("fit");
  const [page, setPage] = useState(PAGE);
  const [noCopay, setNoCopay] = useState(false);
  const [fromHome, setFromHome] = useState(false);

  const all = useMemo(() => servicesFor(profile.neighborhood), [profile.neighborhood]);
  // סדר המנוע (כללי ההתאמה כמו שהם): לפי הציון שלו בכל תחום.
  const ranked = useMemo(() => {
    const ids = new Set(all.map((s) => s.id));
    return matchServicesForCitizen(profile, { topN: 500, minScore: 0 }).filter((r) => ids.has(r.service.id));
  }, [all, profile]);
  const rank = useMemo(() => new Map(ranked.map((r, i) => [r.service.id, i])), [ranked]);
  const picks = useMemo(() => personalRecommendations(profile, ranked, 3), [profile, ranked]);
  const chosen = usePilot().derived.interests.get(profile.id) ?? [];
  const [more, setMore] = useState<Set<string>>(new Set());
  const reasonOf = new Map(picks.map((p) => [p.result.service.id, p.reason]));
  // למה זה מתאים: ההסברים של המנוע בשפת האזרח, ורמת התאמה במילים (בלי ציון).
  const whyOf = useMemo(() => new Map(ranked.map((r) => [r.service.id, citizenReasons(r.explanations)])), [ranked]);
  const fitOf = useMemo(() => new Map(ranked.map((r) => [r.service.id, r.totalScore >= 70 ? "מתאים לך מאוד" : r.totalScore >= 55 ? "מתאים לך" : undefined])), [ranked]);

  const domains = useMemo(() => {
    const present = new Set(all.map(domainOf));
    const core = catalogState.seed.core_categories.filter((c) => present.has(c.id)).map((c) => ({ id: c.id, name: c.name }));
    const list = present.has(QOL) ? [...core, { id: QOL, name: "איכות חיים" }] : core;
    // התחומים שבחרה ("לספר מה חשוב לי") קודם.
    return [...list.filter((d) => chosen.includes(d.id)), ...list.filter((d) => !chosen.includes(d.id))];
  }, [all, chosen]);

  const q = query.trim();
  const shown = all.filter(
    (s) =>
      (domain === "all" || domainOf(s) === domain) &&
      (!q || s.name.includes(q) || (s.subcategory ?? "").includes(q)) &&
      (!noCopay || priceOf(s).copay === 0) &&
      (!fromHome || nearRank(s, profile.neighborhood) === 0 || nearRank(s, profile.neighborhood) === 3),
  );
  // בהתאמה אישית: תמיד למעלה, בלי קשר לסינון. בקטגוריות הן לא חוזרות, חוץ מבחיפוש.
  const forYou = all.filter((s) => reasonOf.has(s.id)).sort((a, b) => [...reasonOf.keys()].indexOf(a.id) - [...reasonOf.keys()].indexOf(b.id));
  const rest = q ? shown : shown.filter((s) => !forYou.includes(s));
  const byRank = (a: RealService, b: RealService) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999);
  const sorted = [...rest].sort((a, b) =>
    order === "popular"
      ? (DEMAND_RANK[a.demand ?? ""] ?? 3) - (DEMAND_RANK[b.demand ?? ""] ?? 3) || byRank(a, b)
      : order === "near"
        ? nearRank(a, profile.neighborhood) - nearRank(b, profile.neighborhood) || byRank(a, b)
        : byRank(a, b),
  );
  const badgeOf = (s: RealService) =>
    order === "popular" ? (s.demand === "high" ? "פופולרי מאוד בשכונה" : s.demand === "medium" ? "פופולרי בשכונה" : undefined) : order === "near" ? NEAR_LABEL[nearRank(s, profile.neighborhood)] : fitOf.get(s.id);
  const current = ORDERS.find((o) => o.id === order)!;
  const groups = domains
    .map((d) => {
      const items = rest.filter((s) => domainOf(s) === d.id).sort(byRank);
      // בחיפוש: הכל. אחרת עד 6, ועד 9 ב"להראות עוד".
      const cap = q ? items.length : more.has(d.id) ? MAX_MORE : MAX_SHOWN;
      return { ...d, items: items.slice(0, cap), total: Math.min(items.length, q ? items.length : MAX_MORE) };
    })
    .filter((g) => g.items.length);

  if (simulation.noServices) {
    return (
      <main id="main" tabIndex={-1} className="px-6 pt-16 pb-6 space-y-3" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">{he.noServicesTitle}</h1>
        <p className="text-base text-gray-800">{he.noServicesText}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Search className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-base font-bold text-white">סל אישי</span>
        </div>
        <h1 className="text-3xl font-bold">השירותים בשכונה שלך</h1>
        <p className="text-lg text-white/85 mt-1">
          {profile.neighborhood} · {all.length} שירותים מאושרים, {all.filter((s) => s.reach !== "national").length} מהם בשכונה ובאזור
        </p>
        <p className="text-base text-white/90 mt-2">נשארו בארנק שלך {amount(wallet.left)}</p>
      </div>

      <main id="main" tabIndex={-1} className="px-6 pt-5 pb-6 space-y-8" data-read>
        {forYou.length ? (
          <section aria-labelledby="foryou-h">
            <h2 id="foryou-h" className="text-2xl font-bold text-gray-900">שירותים בהתאמה אישית עבורך</h2>
            <p className="text-base text-gray-700 mt-1 mb-3">לפי מה שסיפרת לנו ולמלווה.</p>
            <ul className="space-y-3">
              {forYou.map((sv) => <ServiceCard key={sv.id} service={sv} reason={reasonOf.get(sv.id)} badge={fitOf.get(sv.id)} reasons={whyOf.get(sv.id)} />)}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="bycat-h" className="space-y-5">
          <h2 id="bycat-h" className="text-2xl font-bold text-gray-900">{current.title}</h2>
          <div role="radiogroup" aria-label="לסדר לפי" className="grid grid-cols-2 gap-2">
            {ORDERS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={order === o.id}
                onClick={() => (setOrder(o.id), setPage(PAGE))}
                className={cn(
                  "min-h-[48px] px-3 rounded-xl text-base font-semibold border",
                  order === o.id ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-[#1B3A5C] border-[#1B3A5C]/40",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="סינון אישי">
            {[
              { on: noCopay, set: setNoCopay, label: "בלי תשלום ממני" },
              { on: fromHome, set: setFromHome, label: "בבית או בטלפון" },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                aria-pressed={f.on}
                onClick={() => (f.set(!f.on), setPage(PAGE))}
                className={cn("min-h-[44px] px-4 rounded-full text-base font-semibold border inline-flex items-center gap-1", f.on ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-800 border-gray-300")}
              >
                {f.on ? <Check className="w-4 h-4" aria-hidden="true" /> : null} {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" aria-hidden="true" />
            <input
              type="search"
              aria-label="חיפוש שירות"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="למשל: שירה, הליכה, טלפון"
              className="w-full min-h-[52px] pr-11 pl-4 rounded-xl border border-gray-300 bg-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="קטגוריה">
            {[{ id: "all", name: "הכל" }, ...domains].map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={domain === d.id}
                onClick={() => setDomain(d.id)}
                className={cn(
                  "min-h-[44px] px-4 rounded-full text-base font-semibold border",
                  domain === d.id ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-gray-800 border-gray-300",
                )}
              >
                {d.name}
              </button>
            ))}
          </div>

          <p className="sr-only" role="status" aria-live="polite">{shown.length} שירותים</p>

          {order !== "category" ? (
            <>
              <ul className="space-y-3">
                {sorted.slice(0, page).map((sv) => <ServiceCard key={sv.id} service={sv} badge={badgeOf(sv)} reasons={whyOf.get(sv.id)} />)}
              </ul>
              {sorted.length > page ? (
                <button
                  type="button"
                  className="w-full min-h-[48px] rounded-xl border border-[#1B3A5C] text-[#1B3A5C] text-base font-semibold"
                  onClick={() => setPage(page + PAGE)}
                >
                  להראות עוד {Math.min(PAGE, sorted.length - page)} (מתוך {sorted.length})
                </button>
              ) : null}
            </>
          ) : null}

          {order === "category" && groups.map((g) => (
            <section key={g.id} aria-labelledby={`d-${g.id}`}>
              <h3 id={`d-${g.id}`} className="text-xl font-bold text-gray-900 mb-3">{g.name}</h3>
              <ul className="space-y-3">
                {g.items.map((sv) => <ServiceCard key={sv.id} service={sv} level={4} badge={fitOf.get(sv.id)} reasons={whyOf.get(sv.id)} />)}
              </ul>
              {g.total > g.items.length ? (
                <button
                  type="button"
                  className="mt-3 w-full min-h-[48px] rounded-xl border border-[#1B3A5C] text-[#1B3A5C] text-base font-semibold"
                  onClick={() => setMore(new Set([...more, g.id]))}
                >
                  להראות עוד {g.total - g.items.length} ב{g.name}
                </button>
              ) : null}
            </section>
          ))}

          {shown.length === 0 ? <p className="text-base text-gray-800">לא מצאנו. אפשר לנסות מילה אחרת, או לבקש מהמלווה.</p> : null}
        </section>

        <p className="text-sm text-gray-600">{SUPPLIER_RATING_NOTE_CITIZEN}</p>
      </main>
    </div>
  );
}
