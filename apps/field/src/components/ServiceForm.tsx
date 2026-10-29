// טופס שירות: שדות החובה מסומנים, ומבחן הכניסה רץ בזמן ההקלדה. מגרסה 0.4 גם
// שדות מודל התשלום (שעות ליחידה, אופן מתן, הגבלת מקום, שער מלווה), ותנאי
// השירות שנגזרים מההגדרות מוצגים בזמן אמת.

import { useEffect, useMemo, useState } from "react";
import {
  ATTENDANCE_METHODS,
  COMMUNITIES,
  COPAY_TIERS,
  DELIVERY_MODES,
  REACHES,
  SERVICE_MODES,
  SERVICE_MODE_LABELS,
  copayRate,
  defaultCopayTier,
  entryTest,
  hourlyPrice,
  isProduct,
  isProposal,
  missingMandatoryFields,
  statusNote,
  suggestedGate,
  suggestedServiceMode,
  OTHER_FUNDERS,
  FUNCTIONAL_LEVELS,
  MOBILITY_LEVELS,
  DIGITAL_LEVELS,
  EVIDENCE_LEVELS,
  complementOf,
  complementSentence,
  type FitProfile,
  type Seed,
  type Service,
} from "@sal-ishi/core";
import {
  Alert,
  Badge,
  Button,
  CheckboxField,
  CheckboxGroup,
  Dialog,
  ProposalBadge,
  RadioGroup,
  SelectField,
  ServiceTermsPanel,
  TextArea,
  TextField,
  useToast,
} from "@sal-ishi/ui";
import { LANGUAGES, entryTone, shekel, useAnalysis } from "../analysis";
import { newId, useField } from "../store";

type Draft = Omit<Service, "unitPrice" | "marketPrice" | "pricePoints" | "hoursPerUnit"> & {
  unitPrice: string;
  marketPrice: string;
  pricePoints: string;
  hoursPerUnit: string;
};

const toNum = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? undefined : Number(s));

function emptyDraft(authority: string, startMonth: string): Draft {
  return {
    id: newId(),
    authority,
    neighborhoodId: "",
    name: "",
    categoryCode: "",
    serviceTypeId: "",
    supplierCode: "",
    languages: ["עברית"],
    format: "",
    unit: "",
    unitPrice: "",
    marketPrice: "",
    pricePoints: "",
    hoursPerUnit: "",
    copayTier: "core_and_prevention",
    communityFit: ["general"],
    deliveryMode: "community",
    attendanceMethod: ["operator"],
    otherFunder: false,
    enforceable: true,
    startMonth,
    status: "טיוטה",
  };
}

function toDraft(s: Service): Draft {
  return {
    ...s,
    unitPrice: s.unitPrice?.toString() ?? "",
    marketPrice: s.marketPrice?.toString() ?? "",
    pricePoints: s.pricePoints?.toString() ?? "",
    hoursPerUnit: s.hoursPerUnit?.toString() ?? "",
  };
}

function fromDraft(d: Draft): Service {
  const { unitPrice, marketPrice, pricePoints, hoursPerUnit, ...rest } = d;
  const s: Service = { ...rest };
  const up = toNum(unitPrice);
  const mp = toNum(marketPrice);
  const pp = toNum(pricePoints);
  const hp = toNum(hoursPerUnit);
  if (up !== undefined) s.unitPrice = up;
  if (mp !== undefined) s.marketPrice = mp;
  if (pp !== undefined) s.pricePoints = pp;
  if (hp !== undefined && hp > 0) s.hoursPerUnit = hp;
  if (!s.serviceMode) delete s.serviceMode;
  if (s.serviceMode !== "group") delete s.capacityLimited;
  if (!s.gatedByCompanion) delete s.gateReason;
  if (!s.otherFunder) {
    delete s.otherFunderName;
    delete s.otherFunderCoverage;
    delete s.requiresPriorClaim;
  }
  if (s.fitProfile && (!s.fitProfile.functionalLevels.length || !s.fitProfile.mobility.length)) delete s.fitProfile;
  if (!s.programId) delete s.programId;
  if (!s.reach || s.reach === "neighborhood") delete s.reach;
  if (!s.servesNeighborhoods?.length || s.reach) delete s.servesNeighborhoods;
  if (!s.cancellationPolicy) delete s.cancellationPolicy;
  return s;
}

/**
 * שירות חדש: אופן המתן ושער המלווה מוצעים לפי סוג השירות, והמשתמש יכול לשנות.
 * בשירות קיים לא ממלאים לבד (רשימת ההשלמות מציעה ומחכה לאישור).
 */
function newServiceDefaults(seed: Seed, format: string, categoryCode: string): Partial<Draft> {
  const gate = suggestedGate(seed, categoryCode);
  return {
    serviceMode: suggestedServiceMode({ format, deliveryMode: "community" }),
    ...(gate ? { gatedByCompanion: true, gateReason: gate } : {}),
  };
}

export const REACH_LABELS: Record<string, string> = {
  neighborhood: "שכונה",
  authority: "כל הרשות",
  regional: "אזורי (כמה רשויות)",
  national: "ארצי",
};

const FUNCTIONAL_LABEL: Record<string, string> = { independent: "עצמאי", partial_help: "זקוק לעזרה חלקית", homebound: "מרותק לבית" };
const MOBILITY_LABEL: Record<string, string> = { independent_walking: "הליכה עצמאית", walker_wheelchair: "נגיש להליכון ולכיסא גלגלים", home_remote: "בבית או מרחוק" };
const DIGITAL_LABEL: Record<string, string> = { none: "לא", basic_phone: "טלפון רגיל", smartphone: "סמארטפון" };
const EVIDENCE_LABEL: Record<string, string> = { high: "גבוהה", medium: "בינונית", low: "נמוכה", unknown: "לא ידוע" };

/** פרופיל התאמה (תוספת 3): מתאר את השירות, לא את האדם. הכל בחירה, בלי טקסט חופשי. */
function FitProfileFields(props: { value: FitProfile | undefined; onChange: (v: FitProfile) => void }) {
  const v: FitProfile = props.value ?? { functionalLevels: [], mobility: [], digitalRequired: "none" };
  return (
    <fieldset className="fieldset">
      <legend className="fieldset__legend">פרופיל התאמה של השירות</legend>
      <CheckboxGroup legend="למי מתאים: רמת תפקוד" required value={v.functionalLevels} onChange={(x) => props.onChange({ ...v, functionalLevels: x as FitProfile["functionalLevels"] })} options={FUNCTIONAL_LEVELS.map((x) => ({ value: x, label: FUNCTIONAL_LABEL[x]! }))} />
      <CheckboxGroup legend="ניידות" required value={v.mobility} onChange={(x) => props.onChange({ ...v, mobility: x as FitProfile["mobility"] })} options={MOBILITY_LEVELS.map((x) => ({ value: x, label: MOBILITY_LABEL[x]! }))} hint="לפחות שירות אחד מכל שלושה ברצפה צריך להיות נגיש להליכון ולכיסא גלגלים" />
      <div className="grid grid--form">
        <SelectField label="נדרש טלפון" value={v.digitalRequired} onChange={(e) => props.onChange({ ...v, digitalRequired: e.target.value as FitProfile["digitalRequired"] })} options={DIGITAL_LEVELS.map((x) => ({ value: x, label: DIGITAL_LABEL[x]! }))} />
        <SelectField label="רמת ראיות (רשות)" placeholder="לא נבחר" value={v.evidenceLevel ?? ""} onChange={(e) => props.onChange({ ...v, evidenceLevel: (e.target.value || undefined) as FitProfile["evidenceLevel"] })} options={EVIDENCE_LEVELS.map((x) => ({ value: x, label: EVIDENCE_LABEL[x]! }))} />
      </div>
      <div className="grid grid--form">
        <CheckboxField label="מתאים לירידה קוגניטיבית קלה" checked={v.suitableMildCognitiveDecline ?? false} onChange={(x) => props.onChange({ ...v, suitableMildCognitiveDecline: x })} />
        <CheckboxField label="נדרש אישור רפואי" checked={v.medicalClearanceRequired ?? false} onChange={(x) => props.onChange({ ...v, medicalClearanceRequired: x })} />
      </div>
      <p className="muted">אין סינון לפי מגדר או דת. אלה מסננים שהאזרח בוחר בעצמו.</p>
    </fieldset>
  );
}

export function ServiceForm(props: { open: boolean; onClose: () => void; service?: Service; prefill?: Partial<Service> }) {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const upsertService = useField((s) => s.upsertService);
  const { idx, labels, refs } = useAnalysis();
  const toast = useToast();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(data.authority, thisMonth));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!props.open) return;
    setTouched(false);
    if (props.service) {
      setDraft(toDraft(props.service));
      return;
    }
    const base = emptyDraft(data.authority, thisMonth);
    const p = props.prefill ?? {};
    const type = p.serviceTypeId ? idx.serviceTypes.get(p.serviceTypeId) : undefined;
    const categoryCode = p.categoryCode ?? type?.category ?? "";
    setDraft({
      ...base,
      ...(p.neighborhoodId ? { neighborhoodId: p.neighborhoodId } : {}),
      ...(p.communityFit ? { communityFit: p.communityFit } : {}),
      categoryCode,
      serviceTypeId: type?.id ?? "",
      name: p.name ?? type?.name ?? "",
      format: type?.format ?? "",
      unit: type?.unit ?? "",
      copayTier: categoryCode ? defaultCopayTier(seed, categoryCode) : base.copayTier,
      ...(type ? newServiceDefaults(seed, type.format, categoryCode) : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const types = seed.service_types.filter((t) => t.category === draft.categoryCode);
  const service = fromDraft(draft);
  const entry = entryTest(service, seed);
  const activity = data.activity.filter((a) => a.serviceId === service.id);
  const missing = missingMandatoryFields(service, activity, seed);
  const ref = refs.get(`${draft.serviceTypeId}|${draft.unit}`);
  const suppliers = data.suppliers.filter((s) => !draft.neighborhoodId || s.neighborhoods.includes(draft.neighborhoodId));
  const cancellationIsProposal = isProposal(seed.settings, "cancellation_notice_hours");
  const product = draft.categoryCode ? isProduct(seed, draft.categoryCode) : false;
  const hourly = hourlyPrice(service);
  const modeSuggestion = !draft.serviceMode && !product ? suggestedServiceMode(service) : null;

  const errors = useMemo(
    () => ({
      name: draft.name.trim() ? null : "צריך שם לשירות",
      neighborhoodId: draft.neighborhoodId ? null : "בחרו שכונה",
    }),
    [draft.name, draft.neighborhoodId],
  );

  const onCategory = (code: string) => {
    setDraft((d) => ({ ...d, categoryCode: code, serviceTypeId: "", copayTier: defaultCopayTier(seed, code) }));
  };
  const onType = (id: string) => {
    const t = idx.serviceTypes.get(id);
    setDraft((d) => ({
      ...d,
      serviceTypeId: id,
      format: t?.format ?? d.format,
      unit: t?.unit ?? d.unit,
      name: d.name || t?.name || "",
      ...(!props.service && t && !d.serviceMode ? newServiceDefaults(seed, t.format, d.categoryCode) : {}),
    }));
  };
  const onUnitPrice = (v: string) => {
    setDraft((d) => {
      const n = toNum(v);
      const autoPoints = d.pricePoints === "" || toNum(d.pricePoints) === (toNum(d.unitPrice) ?? 0) * seed.settings.points_per_shekel;
      return { ...d, unitPrice: v, pricePoints: autoPoints && n !== undefined ? String(n * seed.settings.points_per_shekel) : d.pricePoints };
    });
  };

  const save = () => {
    setTouched(true);
    if (errors.name || errors.neighborhoodId) return;
    upsertService(service);
    toast("success", `השירות "${service.name}" נשמר. מבחן כניסה: ${entry.status}`);
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.service ? "עריכת שירות" : "שירות חדש"}
      footer={
        <>
          <Button onClick={save}>שמירה</Button>
          <Button variant="secondary" onClick={props.onClose}>ביטול</Button>
        </>
      }
    >
      <div className="entry-panel" aria-live="polite">
        <span className="muted">מבחן כניסה:</span>
        <Badge tone={entryTone(entry.status)}>{entry.status}</Badge>
        <span>{entry.reason}</span>
        {missing.length ? <Badge tone="warning">חסרים {missing.length} שדות חובה: {missing.map((m) => m.label).join(", ")}</Badge> : null}
      </div>

      <div className="grid grid--form">
        <TextField label="שם השירות" required value={draft.name} onChange={(e) => set("name", e.target.value)} error={touched ? errors.name : null} />
        <SelectField
          label="שכונה"
          required
          value={draft.neighborhoodId}
          onChange={(e) => set("neighborhoodId", e.target.value)}
          placeholder="בחרו שכונה"
          options={data.neighborhoods.map((n) => ({ value: n.id, label: `${n.name} (${labels.community[n.community]})` }))}
          error={touched ? errors.neighborhoodId : null}
        />
        <SelectField
          label="קטגוריה"
          value={draft.categoryCode}
          onChange={(e) => onCategory(e.target.value)}
          placeholder="בחרו קטגוריה"
          options={seed.categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}${c.layer === "בחוץ" ? " (מחוץ לסל)" : ""}` }))}
        />
        <SelectField
          label="סוג שירות"
          required
          value={draft.serviceTypeId}
          onChange={(e) => onType(e.target.value)}
          placeholder={draft.categoryCode ? "בחרו סוג שירות" : "בחרו קודם קטגוריה"}
          disabled={!draft.categoryCode}
          options={types.map((t) => ({ value: t.id, label: `${t.id} ${t.name}` }))}
        />
        <SelectField
          label="ספק"
          required
          value={draft.supplierCode}
          onChange={(e) => set("supplierCode", e.target.value)}
          placeholder={suppliers.length ? "בחרו ספק" : "אין ספקים בשכונה. הוסיפו באטלס הספקים"}
          options={suppliers.map((s) => ({ value: s.code, label: `${s.code} ${s.displayName ?? ""} (${labels.supplierType[s.type]})` }))}
        />
        <TextField label="קוד תוכנית" hint="סבבים של אותה תוכנית נספרים כשירות אחד" value={draft.programId ?? ""} onChange={(e) => set("programId", e.target.value)} />
        <TextField label="פורמט" value={draft.format} onChange={(e) => set("format", e.target.value)} />
        <TextField label="יחידה" value={draft.unit} onChange={(e) => set("unit", e.target.value)} />
        <TextField label="חודש התחלה" type="month" value={draft.startMonth} onChange={(e) => set("startMonth", e.target.value)} />
      </div>

      <div className="grid grid--form">
        <TextField label="מחיר ליחידה (ש&quot;ח)" required inputMode="decimal" value={draft.unitPrice} onChange={(e) => onUnitPrice(e.target.value)}
          hint={ref?.median != null ? `מחיר ייחוס ברשות: ${shekel(ref.median)} (${ref.samples} דגימות)` : "אין עדיין מחיר ייחוס (פחות משלוש דגימות)"} />
        <TextField label="מחיר שוק לייחוס (ש&quot;ח)" inputMode="decimal" value={draft.marketPrice} onChange={(e) => set("marketPrice", e.target.value)} />
        <TextField label="מחיר בנקודות" inputMode="decimal" value={draft.pricePoints} onChange={(e) => set("pricePoints", e.target.value)}
          hint={`נקודה = ${1 / seed.settings.points_per_shekel} ש"ח`} />
        <SelectField
          label="השתתפות עצמית"
          value={draft.copayTier}
          onChange={(e) => set("copayTier", e.target.value as Service["copayTier"])}
          options={COPAY_TIERS.map((t) => ({ value: t, label: labels.copayTier[t]! }))}
          hint={`שיעור לפי ההגדרות: ${Math.round(copayRate(seed.settings, draft.copayTier) * 100)}%`}
        />
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">מודל התשלום</legend>
        {product ? (
          <p className="muted">מוצר בערוץ הארצי: בלי שעות שירות ובלי אופן מתן. התקרה הרבעונית מוצגת בתנאים.</p>
        ) : (
          <div className="stack">
            <div className="grid grid--form">
              <TextField
                label="שעות שירות ליחידה"
                required
                inputMode="decimal"
                value={draft.hoursPerUnit}
                onChange={(e) => set("hoursPerUnit", e.target.value)}
                hint={hourly !== null ? `מחיר לשעה: ${hourly.toLocaleString("he-IL", { maximumFractionDigits: 2 })} ש"ח` : `כמה שעות שירות יש ביחידה אחת (${draft.unit || "יחידה"})`}
                error={touched && !toNum(draft.hoursPerUnit) ? "צריך מספר שעות גדול מאפס" : null}
              />
            </div>
            <RadioGroup
              legend="אופן מתן השירות"
              value={draft.serviceMode ?? ""}
              onChange={(v) => set("serviceMode", v as Service["serviceMode"])}
              options={SERVICE_MODES.map((m) => ({ value: m, label: SERVICE_MODE_LABELS[m] }))}
              hint={modeSuggestion ? `חסר. הצעה לפי הפורמט: ${SERVICE_MODE_LABELS[modeSuggestion]}` : "קובע את שעות הביטול, החיוב באי-הגעה וההחזר באשפוז"}
            />
            {modeSuggestion ? (
              <div>
                <Button variant="secondary" small onClick={() => set("serviceMode", modeSuggestion)}>
                  החלת ההצעה: {SERVICE_MODE_LABELS[modeSuggestion]}
                </Button>
              </div>
            ) : null}
            {draft.serviceMode === "group" ? (
              <CheckboxField
                label="קבוצה מוגבלת מקום, עם רשימת המתנה"
                checked={draft.capacityLimited ?? false}
                onChange={(v) => set("capacityLimited", v)}
                hint="בקבוצה מוגבלת מקום אי-הגעה מחויבת"
              />
            ) : null}
          </div>
        )}
        <CheckboxField
          label="נפתח רק באישור מלווה"
          checked={draft.gatedByCompanion ?? false}
          onChange={(v) => set("gatedByCompanion", v)}
          hint="למשל ארוחה חמה או הטבת איכות חיים לפי צורך מתועד"
        />
        {draft.gatedByCompanion ? (
          <TextField
            label="סיבה לפתיחה באישור מלווה"
            required
            value={draft.gateReason ?? ""}
            onChange={(e) => set("gateReason", e.target.value)}
            error={touched && !draft.gateReason?.trim() ? "צריך סיבה, אחרת השירות יסומן חסרים נתונים" : null}
          />
        ) : null}
        <ServiceTermsPanel service={service} seed={seed} showShekel />
      </fieldset>

      <CheckboxGroup legend="שפות" required value={draft.languages} onChange={(v) => set("languages", v)} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
      <CheckboxGroup
        legend="התאמה קהילתית"
        value={draft.communityFit}
        onChange={(v) => set("communityFit", v as Service["communityFit"])}
        options={COMMUNITIES.map((c) => ({ value: c, label: labels.community[c]! }))}
      />
      <RadioGroup
        legend="אופן מסירה"
        value={draft.deliveryMode}
        onChange={(v) => set("deliveryMode", v as Service["deliveryMode"])}
        options={DELIVERY_MODES.map((m) => ({ value: m, label: labels.deliveryMode[m]! }))}
        hint="שירות בבית או מרחוק מזהה מענה למרותקי בית"
      />
      <RadioGroup
        legend="היקף השירות"
        value={draft.reach ?? "neighborhood"}
        onChange={(v) => set("reach", v as Service["reach"])}
        options={REACHES.filter((r) => r !== "national").map((r) => ({ value: r, label: REACH_LABELS[r]! }))}
        hint="שירות ברמת רשות או אזורי נספר בכיסוי של כל שכונות הרשות. מוצרים ארציים מנוהלים במטה."
      />
      {(draft.reach ?? "neighborhood") === "neighborhood" && data.neighborhoods.length > 1 ? (
        <CheckboxGroup
          legend="שכונות נוספות שהשירות משרת"
          value={draft.servesNeighborhoods ?? []}
          onChange={(v) => set("servesNeighborhoods", v)}
          options={data.neighborhoods.filter((n) => n.id !== draft.neighborhoodId).map((n) => ({ value: n.id, label: n.name }))}
          hint="השירות ייספר גם בכיסוי של השכונות שתסמנו"
        />
      ) : null}
      <CheckboxGroup
        legend="אימות נוכחות"
        value={draft.attendanceMethod}
        onChange={(v) => set("attendanceMethod", v as Service["attendanceMethod"])}
        options={ATTENDANCE_METHODS.map((m) => ({ value: m, label: labels.attendance[m]! }))}
        hint="הכלי מתעד את השיטה ואינו מפעיל אותה"
      />
      <TextArea
        label="הערות למדיניות הביטול"
        hint="הכללים עצמם (שעות הודעה, אי-הגעה ואשפוז) נקבעים בהגדרות ומוצגים בתנאי השירות"
        value={draft.cancellationPolicy ?? ""}
        onChange={(e) => set("cancellationPolicy", e.target.value)}
        extra={cancellationIsProposal ? <ProposalBadge note={statusNote(seed.settings, "cancellation_notice_hours")} /> : null}
      />
      <div className="grid grid--form">
        <CheckboxField label="יש לשירות מממן אחר" checked={draft.otherFunder} onChange={(v) => set("otherFunder", v)} hint="סל משלים בלבד: הסל מממן רק את ההשלמה" />
        <CheckboxField label="יש מנגנון מימוש ואימות" checked={draft.enforceable} onChange={(v) => set("enforceable", v)} hint="שובר או נקודות, וסימון נוכחות" />
      </div>
      {draft.otherFunder ? (
        <fieldset className="fieldset">
          <legend className="fieldset__legend">מממן אחר: סל משלים בלבד</legend>
          <div className="grid grid--form">
            <SelectField
              label="מי מממן"
              required
              placeholder="לבחור"
              value={draft.otherFunderName ?? ""}
              onChange={(e) => set("otherFunderName", (e.target.value || undefined) as Service["otherFunderName"])}
              options={OTHER_FUNDERS.filter((f) => f !== "אין").map((f) => ({ value: f, label: f }))}
            />
            <SelectField
              label="כמה הוא מכסה"
              required
              placeholder="לבחור"
              value={draft.otherFunderCoverage?.kind ?? ""}
              onChange={(e) => set("otherFunderCoverage", e.target.value ? { kind: e.target.value as "amount" | "percent" | "varies", value: draft.otherFunderCoverage?.value } : undefined)}
              options={[{ value: "amount", label: "סכום (ש\"ח)" }, { value: "percent", label: "אחוז מהמחיר" }, { value: "varies", label: "משתנה לפי מקרה" }]}
            />
            {draft.otherFunderCoverage && draft.otherFunderCoverage.kind !== "varies" ? (
              <TextField
                label={draft.otherFunderCoverage.kind === "amount" ? "הסכום שהוא מכסה" : "האחוז שהוא מכסה"}
                inputMode="decimal"
                value={draft.otherFunderCoverage.value ?? ""}
                onChange={(e) => set("otherFunderCoverage", { kind: draft.otherFunderCoverage!.kind, value: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            ) : null}
          </div>
          <CheckboxField label="חובה לממש קודם מול המממן האחר" checked={draft.requiresPriorClaim ?? false} onChange={(v) => set("requiresPriorClaim", v)} hint="המלווה תקבל משימת מיצוי" />
          {(() => {
            const line = complementSentence(complementOf({ ...draft, unitPrice: undefined, pricePoints: Number(draft.pricePoints) || Number(draft.unitPrice) || 0 }, seed), seed.settings.points_per_shekel);
            return line ? <Alert tone="info">{line}</Alert> : <Alert tone="warning">חסר כמה המממן האחר מכסה: השירות יקבל "חסרים נתונים".</Alert>;
          })()}
        </fieldset>
      ) : null}
      <FitProfileFields value={draft.fitProfile} onChange={(v) => set("fitProfile", v)} />
      {draft.categoryCode === "5.4" ? (
        <Alert tone="info" title="ארוחה חמה">
          קריטריון הכניסה עדיין בהכרעה ({String(seed.settings.hot_meal_entry_status ?? "")}): {seed.settings.hot_meal_entry_criteria.join(", ")}.
        </Alert>
      ) : null}
    </Dialog>
  );
}
