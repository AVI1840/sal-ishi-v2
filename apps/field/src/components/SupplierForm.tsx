import { useEffect, useState } from "react";
import { COMMUNITIES, DELIVERY_MODES, SUPPLIER_TYPES, supplierScore, type Supplier, type SupplierEvaluation } from "@sal-ishi/core";
import { Alert, Button, CheckboxField, CheckboxGroup, Dialog, SelectField, TextField, useToast } from "@sal-ishi/ui";
import { LANGUAGES, useAnalysis } from "../analysis";
import { nextSupplierCode, useField } from "../store";

export function SupplierForm(props: { open: boolean; onClose: () => void; supplier?: Supplier }) {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const upsertSupplier = useField((s) => s.upsertSupplier);
  const { labels, idx } = useAnalysis();
  const toast = useToast();
  const [draft, setDraft] = useState<Supplier>(() => blank());
  const [touched, setTouched] = useState(false);

  function blank(): Supplier {
    return {
      code: nextSupplierCode(data.suppliers),
      authority: data.authority,
      type: "npo",
      displayName: "",
      neighborhoods: [],
      languages: ["עברית"],
      communityFit: ["general"],
      accessible: true,
      deliveryModes: ["community"],
      contact: {},
    };
  }

  useEffect(() => {
    if (!props.open) return;
    setTouched(false);
    setDraft(props.supplier ? { ...props.supplier, contact: { ...(props.supplier.contact ?? {}) } } : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  const set = <K extends keyof Supplier>(key: K, value: Supplier[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const personal = idx.supplierTypes.get(draft.type)?.personal_data ?? false;
  const codeTaken = !props.supplier && data.suppliers.some((s) => s.code === draft.code);
  const errors = {
    code: !draft.code.trim() ? "צריך קוד ספק" : codeTaken ? "הקוד כבר קיים ברשות" : null,
    neighborhoods: draft.neighborhoods.length ? null : "בחרו לפחות שכונה אחת",
  };

  const save = () => {
    setTouched(true);
    if (errors.code || errors.neighborhoods) return;
    const contact = Object.fromEntries(Object.entries(draft.contact ?? {}).filter(([, v]) => v && String(v).trim()));
    const s: Supplier = { ...draft, authority: data.authority };
    if (Object.keys(contact).length) s.contact = contact;
    else delete s.contact;
    if (!s.displayName?.trim()) delete s.displayName;
    upsertSupplier(s);
    toast("success", `הספק ${s.code} נשמר`);
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.supplier ? `עריכת ספק ${props.supplier.code}` : "ספק חדש"}
      footer={
        <>
          <Button onClick={save}>שמירה</Button>
          <Button variant="secondary" onClick={props.onClose}>ביטול</Button>
        </>
      }
    >
      <div className="grid grid--form">
        <TextField label="קוד ספק" required value={draft.code} disabled={Boolean(props.supplier)} onChange={(e) => set("code", e.target.value.trim())}
          error={touched ? errors.code : null} hint="הקוד הוא מה שעובר לספק העל ולכלי לאזרח" />
        <SelectField label="סוג עוסק" required value={draft.type} onChange={(e) => set("type", e.target.value as Supplier["type"])}
          options={SUPPLIER_TYPES.map((t) => ({ value: t, label: labels.supplierType[t]! }))} />
        <TextField label={personal ? "שם הספק (אדם פרטי)" : "שם הארגון"} value={draft.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} />
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">פרטי קשר</legend>
        <div className="grid grid--form">
          <TextField label="טלפון" type="tel" dir="ltr" value={draft.contact?.phone ?? ""} onChange={(e) => set("contact", { ...draft.contact, phone: e.target.value })} />
          <TextField label="דואר אלקטרוני" type="email" dir="ltr" value={draft.contact?.email ?? ""} onChange={(e) => set("contact", { ...draft.contact, email: e.target.value })} />
        </div>
      </fieldset>
      {personal ? (
        <Alert tone="info" title="ספק שהוא אדם פרטי">
          {seed.settings.supplier_contact_to_hq
            ? "השם ופרטי הקשר נשמרים ברשות ועוברים למטה בחבילת הפיילוט. הם לא עוברים לספק העל ולא לכלי לאזרח."
            : "השם ופרטי הקשר נשמרים ברשות בלבד. למטה, לספק העל ולכלי לאזרח עוברים רק קוד וסוג."}
        </Alert>
      ) : null}

      <CheckboxGroup legend="שכונות" required value={draft.neighborhoods} onChange={(v) => set("neighborhoods", v)}
        options={data.neighborhoods.map((n) => ({ value: n.id, label: n.name }))} error={touched ? errors.neighborhoods : null} />
      <CheckboxGroup legend="שפות" value={draft.languages} onChange={(v) => set("languages", v)} options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
      <CheckboxGroup legend="התאמה קהילתית" value={draft.communityFit} onChange={(v) => set("communityFit", v as Supplier["communityFit"])}
        options={COMMUNITIES.map((c) => ({ value: c, label: labels.community[c]! }))} />
      <CheckboxGroup legend="אופן מסירה" value={draft.deliveryModes ?? []} onChange={(v) => set("deliveryModes", v as Supplier["deliveryModes"])}
        options={DELIVERY_MODES.map((m) => ({ value: m, label: labels.deliveryMode[m]! }))} />
      <CheckboxField label="המקום נגיש לבעלי מוגבלויות" checked={draft.accessible} onChange={(v) => set("accessible", v)} />
      <EvaluationEditor
        evaluations={draft.evaluations ?? []}
        onChange={(evaluations) => set("evaluations", evaluations.length ? evaluations : undefined)}
        scoreLabel={(() => {
          const sc = supplierScore(draft, seed.settings);
          return sc ? `ציון נוכחי ${sc.score.toFixed(1)} מתוך 5 (${sc.quarter})` : "עוד אין הערכה";
        })()}
      />
    </Dialog>
  );
}

const CRITERIA: { key: "quality" | "outcomes" | "satisfaction" | "value"; label: string }[] = [
  { key: "quality", label: "איכות השירות" },
  { key: "outcomes", label: "תוצאות מניעה" },
  { key: "satisfaction", label: "שביעות רצון" },
  { key: "value", label: "עלות-תועלת" },
];

function currentQuarter(): string {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/** הערכה רבעונית של ספק: ארבעה מדדים מ-1 עד 5. המשקלות נקבעים במטה. */
function EvaluationEditor(props: { evaluations: SupplierEvaluation[]; onChange: (e: SupplierEvaluation[]) => void; scoreLabel: string }) {
  const quarter = currentQuarter();
  const current = props.evaluations.find((e) => e.quarter === quarter) ?? { quarter, quality: 3, outcomes: 3, satisfaction: 3, value: 3 };
  const update = (key: (typeof CRITERIA)[number]["key"], v: number) => {
    const next = { ...current, [key]: v };
    props.onChange([...props.evaluations.filter((e) => e.quarter !== quarter), next].sort((a, b) => a.quarter.localeCompare(b.quarter)));
  };
  return (
    <fieldset className="fieldset">
      <legend className="fieldset__legend">דירוג הספק לרבעון {quarter}</legend>
      <p className="field__hint">{props.scoreLabel}. הדירוג לא חוסם שירות. הוא מוצג במטה ומזין את שכבת "המלצות וניסיון" בהתאמה לאזרח.</p>
      <div className="grid grid--form">
        {CRITERIA.map((c) => (
          <SelectField
            key={c.key}
            label={c.label}
            value={String(current[c.key])}
            onChange={(e) => update(c.key, Number(e.target.value))}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}${n === 1 ? " (נמוך)" : n === 5 ? " (גבוה)" : ""}` }))}
          />
        ))}
      </div>
    </fieldset>
  );
}
