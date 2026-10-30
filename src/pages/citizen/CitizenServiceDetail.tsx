/**
 * CitizenServiceDetail: דף שירות בודד, שירות אמיתי מהקטלוג.
 *
 * 0.5 מאוחד: העלות בשקלים (מהסל וממך), השלמה למממן אחר (תוספת 3), כללי
 * הביטול, והזמנה בשלושה צעדים. שירות שנפתח באישור המלווה, אשפוז וסל ריק
 * מקבלים הסבר ודרך הלאה במקום כפתור.
 */
import { useParams, Link } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { ArrowRight, MapPin, Clock, Phone, Globe, AlertCircle, Heart, Activity, Users, Laptop, Wrench, Wallet, CalendarX, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { realServices } from "@/data/realServices";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { citizenReasons } from "@/lib/citizenReasons";
import { BookingPanel } from "@/components/citizen/BookingPanel";
import { needsCompanion } from "@/lib/serviceTerms";
import { he } from "@/pilot/i18n/he";
import { createRequest, usePilot } from "@/pilot/store";
import { isProduct, isSubscription, priceLabel, priceOf } from "@/pilot/services";
import { complementLine, ruleText } from "@/pilot/citizen/Service";
import { reasonKey, useCitizen, usePersonalProfile, useWallet } from "@/pilot/citizen/common";
import { personalReasonFor } from "@/lib/personalMatch";
import { amount } from "@/lib/wallet";
import { catalogState } from "@/data/catalogSource";
import { getActiveWeights, type MatchResult } from "@/lib/matchingEngine";
import { DOMAIN_PREVENTION } from "@/pilot/why";

/** איך בחרנו את זה בשבילך: כל סיבה במילים, וכמה היא חזקה. בלי ציון. המשקלות מההגדרות. */
const LAYER_WORDS: { key: keyof MatchResult["layers"]; label: string }[] = [
  { key: "prevention", label: "שומר על הבריאות והתפקוד" },
  { key: "motivation", label: "מתאים למה שחשוב לך" },
  { key: "profileFit", label: "מתאים ליכולות שלך" },
  { key: "proximity", label: "קרוב ונוח, ונכנס בסל" },
  { key: "socialProof", label: "אנשים בשכונה ממליצים" },
];

function HowWeChose(props: { result: MatchResult }) {
  const w = getActiveWeights();
  const rows = LAYER_WORDS.filter((l) => (w[l.key] ?? 0) > 0).map((l) => ({ ...l, value: props.result.layers[l.key] }));
  const strength = (v: number) => (v >= 75 ? "חזק" : v >= 50 ? "בינוני" : "חלש");
  return (
    <details className="bg-white rounded-xl border border-gray-200 group">
      <summary className="min-h-[52px] px-5 flex items-center justify-between cursor-pointer text-lg font-bold text-gray-900">
        איך בחרנו את זה בשבילך
        <span className="text-base font-semibold text-[#1B3A5C] group-open:hidden">לפתוח</span>
        <span className="text-base font-semibold text-[#1B3A5C] hidden group-open:inline">לסגור</span>
      </summary>
      <ul className="px-5 pb-5 space-y-3">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="flex items-center justify-between text-base text-gray-900">
              <span>{r.label}</span>
              <span className="font-semibold">{strength(r.value)}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-gray-100 overflow-hidden" role="img" aria-label={`${r.label}: ${strength(r.value)}`}>
              <div className="h-full rounded-full bg-[#1B3A5C]" style={{ width: `${Math.max(6, Math.min(100, r.value))}%` }} />
            </div>
          </li>
        ))}
        <li className="text-sm text-gray-600">ההמלצה מחושבת לפי מה שסיפרת, היכולות שלך, השכונה והארנק. המשקל של כל סיבה נקבע בהגדרות של התכנית.</li>
      </ul>
    </details>
  );
}

const LANG_MAP: Record<string, string> = {
  hebrew: "עברית", arabic: "ערבית", russian: "רוסית", english: "אנגלית",
  yiddish: "יידיש", amharic: "אמהרית", french: "צרפתית", bukharian: "בוכרית",
};

const ACCESS_MAP: Record<string, string> = {
  wheelchair: "נגיש לכיסא גלגלים", transport: "הסעות", home_visit: "ביקורי בית",
  remote: "מרחוק / דיגיטלי", elevator: "מעלית", parking: "חניה", emergency_button: "כפתור חירום",
};

const CATEGORY_ICON: Record<number, typeof Heart> = {
  1: Heart, 2: Activity, 3: Users, 4: Laptop, 5: Wrench,
};

const HOW: Record<string, string> = {
  group: "בקבוצה, במקום קבוע בשכונה.",
  individual: "פגישה אישית עם איש מקצוע.",
  home: "מגיעים עד הבית.",
  remote: "בטלפון או במחשב, מהבית.",
};

const actionPrimary = "w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2";

function Notice(props: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={cn("flex items-start gap-2.5 p-4 rounded-xl border text-base", props.tone === "warning" ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-blue-50 border-blue-200 text-gray-900")}>
      <Info className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
      <div>{props.children}</div>
    </div>
  );
}

export default function CitizenServiceDetail() {
  const { id } = useParams();
  const service = realServices.find((s) => s.id === id);
  const { derived } = usePilot();
  const { profile: citizen } = useCitizen();
  const personal = usePersonalProfile();
  const wallet = useWallet();
  const showImages = useShowImages();

  const matchResult = useMemo(() => {
    if (!service) return null;
    const all = matchServicesForCitizen(personal, { topN: 500, minScore: 0 });
    return all.find((r) => r.service.id === service.id) ?? null;
  }, [service, personal]);

  if (!service) {
    return (
      <main id="main" tabIndex={-1} className="px-6 pt-6 pb-6 space-y-4" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">השירות לא נמצא</h1>
        <p className="text-base text-gray-700">ייתכן שהוא כבר לא בקטלוג. אפשר לחפש שירות אחר, או לבקש מהמלווה.</p>
        <Link to="/citizen" className="flex items-center justify-center min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold">
          {he.findService}
        </Link>
      </main>
    );
  }
  const Icon = CATEGORY_ICON[service.category] ?? Heart;
  const imgInfo = getServiceImageInfo(service);

  // תנאי השירות בלי שורת הביטול: הביטול מוסבר בשפה פשוטה בכרטיס נפרד.
  // קודם מה שהיא סיפרה ("סיפרת ש..."), ואחר כך סיבות נוספות בשפה פשוטה.
  const told = personalReasonFor(personal, service.name);
  const reasons = [...(told ? [told] : []), ...citizenReasons(matchResult?.explanations ?? [])].slice(0, 4);
  const price = priceOf(service);
  // התחום לפי ההחלטה (חמשת תחומי הליבה), ולא תווית הקטגוריה הישנה.
  const domainName = catalogState.seed.core_categories.find((c) => c.id === service.coreCategoryId)?.name ?? "איכות חיים";
  const complement = complementLine(he, price);
  const mine = (kind: string) => derived.requests.find((r) => r.citizenId === citizen.id && r.serviceId === service.id && r.kind === kind && (r.status === "open" || r.status === "approved"));
  const gateRequest = mine("gated_service");
  const gated = needsCompanion(service) && gateRequest?.status !== "approved";
  const hospitalized = derived.hospitalized.has(citizen.id);
  const tooExpensive = !price.unknown && price.covered > wallet.left;
  const needsClaim = price.state === "full" || price.state === "prior_claim" || price.state === "varies";
  const claimOpen = Boolean(mine("claim_help"));

  return (
    <div className="min-h-screen bg-gray-50 pb-6" dir="rtl">

      {/* חזרה. שם השירות הוא הכותרת שבכרטיס הראשי, כי כלי הנגישות יושבים בפינה השמאלית העליונה */}
      <header className="sticky top-10 z-30 bg-white border-b border-gray-200 px-5 h-14 flex items-center">
        <Link to="/citizen" className="min-h-[44px] px-2 -mx-2 inline-flex items-center gap-1.5 text-base font-semibold text-[#1B3A5C]">
          <ArrowRight className="w-5 h-5" aria-hidden="true" /> לשירותים
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="px-5 pt-5 space-y-4 max-w-3xl mx-auto" data-read>

        {/* Hero: תמונה במצב תמונות, כרטיס כחול במצב נקי */}
        {showImages ? (
          <div className="relative h-48 rounded-xl overflow-hidden">
            {imgInfo.image ? (
              <img src={imgInfo.image} alt={service.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className={cn("w-full h-full", imgInfo.gradientDark)} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-5 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow leading-tight">{service.name}</h1>
                <p className="text-sm text-white/90 mt-1">{service.provider}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <span className="text-sm px-2 py-1 rounded-lg bg-black/50 text-white font-semibold">
                {domainName}
              </span>
            </div>
          </div>
        ) : (
          /* Original clean hero card */
          <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{service.name}</h1>
                <p className="text-sm text-white/90 mt-0.5">{service.provider}</p>
                <p className="text-xs text-white/80 mt-1">{domainName}</p>
              </div>
            </div>
          </div>
        )}

        {/* כמה זה עולה: בשקלים, מהסל וממך, או השלמה למממן אחר */}
        <section aria-labelledby="cost-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-2">
          <h2 id="cost-h" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {he.cost}
          </h2>
          <p className="text-base text-gray-900">
            {complement ?? priceLabel(service, amount)}
          </p>
          <p className="text-sm text-gray-700">נשארו בארנק שלך החודש {amount(wallet.left)} מתוך {amount(wallet.total)}.</p>
        </section>

        {/* אם צריך לבטל */}
        {!isProduct(service) && (
          <section aria-labelledby="cancel-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-1">
            <h2 id="cancel-h" className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarX className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {isSubscription(service) ? "אם רוצים לעזוב" : he.cancelTitle}
            </h2>
            {(isSubscription(service) ? ["אפשר לעזוב בכל חודש. מה שלא נוצל חוזר לארנק."] : ruleText(he, service)).map((line) => (
              <p key={line} className="text-base text-gray-800">{line}</p>
            ))}
          </section>
        )}

        {/* איך זה עובד, בשפה פשוטה. בלי מונחים פנימיים (שעות ביחידה, חלוקת העלות). */}
        {service.serviceMode ? (
          <section aria-labelledby="how-h" className="bg-white rounded-xl p-4 border border-gray-100">
            <h2 id="how-h" className="text-base font-semibold text-gray-900 mb-1">איך זה עובד</h2>
            <p className="text-base text-gray-800">
              {HOW[service.serviceMode] ?? ""}
              {service.capacityLimited ? " יש מספר מקומות מוגבל, ואם מלא נכנסים לרשימת המתנה." : ""}
            </p>
          </section>
        ) : null}

        {/* Details: רק כשיש פרטים בקטלוג */}
        {(service.address || service.days || service.phone || service.website) && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
          {service.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">כתובת</p><p className="text-sm text-gray-800">{service.address}</p></div>
            </div>
          )}
          {service.days && (
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">ימים ושעות</p><p className="text-sm text-gray-800">{service.days}{service.hours && ` · ${service.hours}`}</p></div>
            </div>
          )}
          {service.phone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">טלפון</p><a href={`tel:${service.phone}`} className="text-sm text-[#1B3A5C] hover:underline">{service.phone}</a></div>
            </div>
          )}
          {service.website && (
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">אתר</p><a href={`https://${service.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1B3A5C] hover:underline">{service.website}</a></div>
            </div>
          )}
        </div>
        )}

        {/* למה זה מתאים לך: בשפת האזרח, בלי ציון ובלי נקודות */}
        <section aria-labelledby="why-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-2">
          <h2 id="why-h" className="text-lg font-bold text-gray-900">{he.reasonTitle}</h2>
          <ul className="space-y-1.5">
            {(reasons.length ? reasons : [he.reason[reasonKey(service)]]).map((r) => (
              <li key={r} className="flex items-start gap-2 text-base text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
        </section>

        {/* מה זה נותן לך */}
        <section aria-labelledby="value-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-2">
          <h2 id="value-h" className="text-lg font-bold text-gray-900">מה זה נותן לך</h2>
          <p className="text-base text-gray-800">{DOMAIN_PREVENTION[service.coreCategoryId ?? ""] ?? "רגע טוב בשבוע, ליד הבית"}.</p>
          {service.hoursPerUnit ? (
            <p className="text-base text-gray-800">
              {service.hoursPerUnit} שעות של פעילות {service.unit ? `לכל ${service.unit}` : ""}, עם מדריך מקצועי.
            </p>
          ) : null}
          {!price.unknown && price.state !== "full" ? (
            <p className="text-base text-gray-800">
              שווה {amount(price.total)}. {price.copay === 0 ? "לך זה לא עולה כסף, הכל מהסל." : `מהסל ${amount(price.covered)}, ממך ${amount(price.copay)}.`}
            </p>
          ) : null}
        </section>

        {matchResult ? <HowWeChose result={matchResult} /> : null}

        {/* Languages */}
        {service.languages.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-base font-semibold text-gray-900 mb-2">שפות השירות</p>
            <div className="flex flex-wrap gap-2">
              {service.languages.map((lang) => (
                <span key={lang} className="text-base px-3 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                  {LANG_MAP[lang] ?? lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {service.accessibility.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-base font-semibold text-gray-900 mb-2">נגישות</p>
            <div className="flex flex-wrap gap-2">
              {service.accessibility.map((a) => (
                <span key={a} className="text-base px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
                  {ACCESS_MAP[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* הערות הקטלוג הן פנימיות (רשות ומטה), ולא מוצגות לאזרח. */}

        {/* דירוג: רק אחרי השתתפות, ב"הפעילויות שלי" */}

        {/* מה אפשר לעשות עכשיו */}
        <div className="space-y-3 pt-2">
          {needsClaim && (
            claimOpen ? (
              <p role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-base text-emerald-900">{he.claimSent}</p>
            ) : (
              <button
                type="button"
                className={actionPrimary}
                onClick={() => createRequest({ citizenId: citizen.id, kind: "claim_help", serviceId: service.id, serviceName: service.name, note: price.funder ?? undefined, actor: "citizen" })}
              >
                {he.claimHelp}
              </button>
            )
          )}
          {price.state === "full" ? null : hospitalized ? (
            <Notice>{he.hospitalBlock}</Notice>
          ) : gated ? (
            <>
              <Notice>
                {he.gatedExplain}
                {gateRequest ? <strong className="block mt-1">{he.status.open}</strong> : null}
              </Notice>
              {!gateRequest && (
                <button
                  type="button"
                  className={actionPrimary}
                  onClick={() => createRequest({ citizenId: citizen.id, kind: "gated_service", serviceId: service.id, serviceName: service.name, actor: "citizen" })}
                >
                  {he.askCompanion}
                </button>
              )}
            </>
          ) : tooExpensive ? (
            <Notice tone="warning">{he.notEnough}</Notice>
          ) : (
            <BookingPanel service={service} />
          )}
          {service.phone && (
            <a
              href={`tel:${service.phone}`}
              className="w-full min-h-[48px] bg-white border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold hover:bg-[#1B3A5C]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              להתקשר למפעיל: {service.phone}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
