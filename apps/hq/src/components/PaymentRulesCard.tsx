// כללי מודל התשלום של החשכ"ל (גרסה 0.4): איכות חיים, מחיר ייחוס והיקפו,
// אי-הגעה, שעות ביטול ואשפוז. כל שינוי מתעדכן מיד בתצוגה ובייצוא במטה, ומגיע
// לשטח עם גרסת בסיס חדשה. הכלי מגדיר כללים בלבד ולא מפעיל נקודות.

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  HOSPITALIZATION_TEXT,
  NO_SHOW_RULES,
  QOL_MODES,
  REFERENCE_PRICE_MODES,
  SERVICE_MODES,
  SERVICE_MODE_LABELS,
  isProposal,
  statusNote,
  type Seed,
  type Settings,
} from "@sal-ishi/core";
import { Badge, Button, CheckboxField, ProposalBadge, RadioGroup, SelectField, TableWrap, useToast } from "@sal-ishi/ui";
import { useHq } from "../store";

const QOL_TEXT: Record<(typeof QOL_MODES)[number], string> = {
  fixed_amount: "סכום קבוע מהנקודות: הערך בכללי איכות החיים מכוסה, והשאר על הקשיש (הצעת החשכ\"ל)",
  percent: "אחוז השתתפות עם תקרה חודשית (החלטת מפגש 2)",
};
const REF_TEXT: Record<(typeof REFERENCE_PRICE_MODES)[number], string> = {
  monitor: "מעקב: חציון והתראה על חריגה, בלי חסימה",
  binding: "מחייב בקטגוריות ורשויות שנבחרו: הארנק מכסה עד מחיר הייחוס, וההפרש על הקשיש",
  preactivated_low_competition: "מחייב אוטומטית בקטגוריה ושכונה עם תחרות נמוכה",
};
const NO_SHOW_TEXT: Record<(typeof NO_SHOW_RULES)[number], string> = {
  individual_or_capacity_limited_only: "רק בשירות פרטני, בבית, או בקבוצה מוגבלת מקום",
  always: "בכל שירות",
  never: "אף פעם",
};

/**
 * סימון הגדרה כסופית: בפורמט של 0.4 הסטטוס בתוך ההגדרה, ובפורמט הישן במפתח
 * X_status נפרד.
 */
export function finalizeSetting(settings: Settings, key: string, statusKey?: string): [string, unknown] {
  const final = `סופי ${new Date().toLocaleDateString("he-IL")}`;
  const value = (settings as Record<string, unknown>)[key];
  if (value && typeof value === "object" && !Array.isArray(value) && "status" in value) return [key, { ...value, status: final }];
  return [statusKey ?? `${key}_status`, final];
}

function Status(props: { settings: Settings; settingKey: string; statusKey?: string }) {
  const { updateSetting } = useHq.getState();
  const toast = useToast();
  if (!isProposal(props.settings, props.settingKey)) return <Badge tone="success">סופי</Badge>;
  return (
    <span className="row">
      <ProposalBadge note={statusNote(props.settings, props.settingKey)} />
      <Button
        small
        variant="ghost"
        onClick={() => {
          const [k, v] = finalizeSetting(props.settings, props.settingKey, props.statusKey);
          const err = updateSetting(k, v);
          toast(err ? "error" : "success", err ?? "הערך סומן כסופי");
        }}
      >
        סימון כסופי
      </Button>
    </span>
  );
}

function Block(props: { title: string; settings: Settings; settingKey: string; statusKey?: string; children: ReactNode }) {
  return (
    <div className="stack rule-block">
      <div className="card__header">
        <h3 style={{ margin: 0 }}>{props.title}</h3>
        <Status settings={props.settings} settingKey={props.settingKey} statusKey={props.statusKey} />
      </div>
      {props.children}
    </div>
  );
}

export function PaymentRulesCard(props: { seed: Seed; authorities: string[] }) {
  const { settings } = props.seed;
  const { updateSetting } = useHq.getState();
  const toast = useToast();
  const [scopeCategory, setScopeCategory] = useState("");
  const [scopeAuthority, setScopeAuthority] = useState("");

  const save = (key: string, value: unknown, what: string) => {
    const err = updateSetting(key, value);
    toast(err ? "error" : "success", err ? `${what}: ${err}` : `עודכן: ${what}`);
  };
  const setValue = (key: "qol_mode" | "reference_price_mode" | "no_show_charge_rule", value: string, what: string) =>
    save(key, { ...settings[key], value }, what);

  const scope = settings.reference_price_binding_scope;
  const categories = props.seed.categories.filter((c) => c.core);
  const catName = new Map(props.seed.categories.map((c) => [c.code, c.name]));
  const hours = settings.cancellation_notice_hours;

  return (
    <section className="card" aria-labelledby="pay-h">
      <h2 id="pay-h">מודל התשלום של החשכ"ל</h2>
      <p className="muted">
        הכללים כאן מוצגים בכל שירות, בשטח ובכלי לאזרח, ונכנסים לתקן קליטת המפעילים. הכלי לא מפעיל נקודות ולא מחייב: ביצוע העסקאות אצל ספק העל.
      </p>

      <Block title="איכות חיים" settings={settings} settingKey="qol_mode">
        <RadioGroup
          legend="אופן הכיסוי של פריטי איכות חיים"
          value={settings.qol_mode.value}
          onChange={(v) => setValue("qol_mode", v, "אופן הכיסוי באיכות חיים")}
          options={QOL_MODES.map((m) => ({ value: m, label: QOL_TEXT[m] }))}
          hint={`במצב אחוז: ${Math.round(settings.qol_copay * 100)}% על הקשיש, והארנק עד ${settings.qol_cap_month} ש"ח בחודש.`}
        />
      </Block>

      <Block title="מחיר ייחוס" settings={settings} settingKey="reference_price_mode">
        <RadioGroup
          legend="מצב מחיר הייחוס"
          value={settings.reference_price_mode.value}
          onChange={(v) => setValue("reference_price_mode", v, "מצב מחיר הייחוס")}
          options={REFERENCE_PRICE_MODES.map((m) => ({ value: m, label: REF_TEXT[m] }))}
          hint={`תחרות נמוכה: פחות מ-${settings.low_competition_operator_threshold} ספקים שונים באותה קטגוריה ושכונה. החציון מחושב על כל הפיילוטים, לפי סוג שירות ויחידה.`}
        />
        {settings.reference_price_mode.value === "binding" || scope.length ? (
          <div className="stack">
            <div className="card__header">
              <h4 style={{ margin: 0 }}>היכן מחיר הייחוס מחייב ({scope.length})</h4>
              <Status settings={settings} settingKey="reference_price_binding_scope" />
            </div>
            {settings.reference_price_mode.value !== "binding" ? (
              <p className="muted">הרשימה נשמרת, אבל חלה רק במצב "מחייב בקטגוריות ורשויות שנבחרו".</p>
            ) : null}
            {scope.length ? (
              <TableWrap label="קטגוריות ורשויות שבהן מחיר הייחוס מחייב">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">קטגוריה</th>
                      <th scope="col">רשות</th>
                      <th scope="col"><span className="visually-hidden">פעולות</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope.map((b) => (
                      <tr key={`${b.categoryCode}|${b.authority}`}>
                        <th scope="row">{b.categoryCode} {catName.get(b.categoryCode) ?? ""}</th>
                        <td>{b.authority}</td>
                        <td>
                          <Button
                            small
                            variant="ghost"
                            icon={<Trash2 size={16} />}
                            aria-label={`הסרת ${b.categoryCode} ב${b.authority}`}
                            onClick={() => save("reference_price_binding_scope", scope.filter((x) => x !== b), "היקף מחיר הייחוס")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <p className="muted">עוד לא נבחרו קטגוריות ורשויות.</p>
            )}
            <div className="grid grid--form">
              <SelectField label="קטגוריה" value={scopeCategory} onChange={(e) => setScopeCategory(e.target.value)} placeholder="בחרו קטגוריה"
                options={categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))} />
              <SelectField label="רשות" value={scopeAuthority} onChange={(e) => setScopeAuthority(e.target.value)} placeholder="בחרו רשות"
                options={props.authorities.map((a) => ({ value: a, label: a }))} />
            </div>
            <div>
              <Button
                variant="secondary"
                icon={<Plus size={18} />}
                disabled={!scopeCategory || !scopeAuthority || scope.some((b) => b.categoryCode === scopeCategory && b.authority === scopeAuthority)}
                onClick={() => {
                  save("reference_price_binding_scope", [...scope, { categoryCode: scopeCategory, authority: scopeAuthority }], "היקף מחיר הייחוס");
                  setScopeCategory("");
                }}
              >
                הוספה לרשימה
              </Button>
            </div>
          </div>
        ) : null}
      </Block>

      <Block title="אי-הגעה" settings={settings} settingKey="no_show_charge_rule">
        <RadioGroup
          legend="מתי אי-הגעה מחויבת"
          value={settings.no_show_charge_rule.value}
          onChange={(v) => setValue("no_show_charge_rule", v, "חיוב באי-הגעה")}
          options={NO_SHOW_RULES.map((m) => ({ value: m, label: NO_SHOW_TEXT[m] }))}
        />
      </Block>

      <Block title="הודעה מראש לביטול (שעות)" settings={settings} settingKey="cancellation_notice_hours">
        <div className="grid grid--form">
          {SERVICE_MODES.map((m) => {
            const v = hours[m];
            return (
              <div className="field" key={m}>
                <label className="field__label" htmlFor={`cancel-${m}`}>{SERVICE_MODE_LABELS[m]}</label>
                <input
                  id={`cancel-${m}`}
                  className="input input--narrow"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-describedby={`cancel-${m}-hint`}
                  key={`${m}-${String(v)}`}
                  defaultValue={v ?? ""}
                  onBlur={(e) => {
                    const raw = e.target.value.trim();
                    const next = raw === "" ? null : Number(raw);
                    if (next === (v ?? null)) return;
                    if (next !== null && (!Number.isInteger(next) || next < 0)) return;
                    save("cancellation_notice_hours", { ...hours, [m]: next }, `שעות ביטול, ${SERVICE_MODE_LABELS[m]}`);
                  }}
                />
                <span id={`cancel-${m}-hint`} className="field__hint">{v === null || v === undefined ? "טרם נקבע (ריק)" : `${v} שעות`}</span>
              </div>
            );
          })}
        </div>
      </Block>

      <Block title="אשפוז" settings={settings} settingKey="hospitalization_refund">
        <div className="grid grid--form">
          {(["group", "individual"] as const).map((k) => (
            <SelectField
              key={k}
              label={k === "group" ? "קבוצה" : "פרטני, בבית ומרחוק"}
              value={settings.hospitalization_refund[k]}
              onChange={(e) => save("hospitalization_refund", { ...settings.hospitalization_refund, [k]: e.target.value }, "החזר באשפוז")}
              options={Object.entries(HOSPITALIZATION_TEXT).map(([value, label]) => ({ value, label }))}
            />
          ))}
        </div>
        <CheckboxField
          label="הודעה למלווה באשפוז"
          checked={settings.hospitalization_refund.notify_companion}
          onChange={(v) => save("hospitalization_refund", { ...settings.hospitalization_refund, notify_companion: v }, "הודעה למלווה באשפוז")}
        />
      </Block>
    </section>
  );
}
