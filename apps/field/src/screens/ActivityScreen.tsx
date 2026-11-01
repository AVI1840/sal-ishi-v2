// מה הולך: פעילות חודשית מצטברת, מגמה, מיצוי בחלון מתגלגל ושירותים מתחת לסף.
// גרסה 0.4: מיצוי (כסף) וחדירה (אנשים) הם מדדים נפרדים, ונוספו פריסה, זמן
// לשירות ראשון ומדד מחיר לשעה. הנתונים על אנשים מצטברים, מדוח ספק העל.

import { useMemo, useState } from "react";
import { FileSpreadsheet, LineChart as LineIcon } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ACTIVITY_IMPORT_FIELDS,
  CONTINUITY_STATUS,
  activeMinSessions,
  activityTemplateWorkbook,
  formatCount,
  hourlyPriceIndex,
  isProposal,
  metricName,
  penetration,
  pricePeriod,
  spread,
  statusNote,
  timeToFirstService,
  rowsToActivity,
  servicesBelowThreshold,
  utilization,
  utilizationWindowMonths,
  windowMonths,
  type UtilizationFlag, quarterText } from "@sal-ishi/core";
import { Badge, Button, EmptyState, PageHeader, ProposalBadge, SelectField, TableWrap, type Tone, useToast } from "@sal-ishi/ui";
import { ImportDialog } from "../components/ImportDialog";
import { monthLabel, percent, shekel, useAnalysis } from "../analysis";
import { latestMonth, useField, type EnrollmentPatch } from "../store";

/** שדה מספרי בטבלה: נשמר ביציאה מהשדה, וריק נשאר ריק. */
function NumberCell(props: { id: string; label: string; value: number | undefined; decimal?: boolean; onSave: (v: number | undefined) => void }) {
  return (
    <>
      <label className="visually-hidden" htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        className="input input--narrow"
        type="number"
        min={0}
        step={props.decimal ? "0.1" : "1"}
        inputMode={props.decimal ? "decimal" : "numeric"}
        defaultValue={props.value ?? ""}
        key={`${props.id}-${props.value ?? ""}`}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          const v = raw === "" ? undefined : Number(raw);
          if (v !== undefined && (!Number.isFinite(v) || v < 0 || (!props.decimal && !Number.isInteger(v)))) return;
          if (v === props.value) return;
          props.onSave(v);
        }}
      />
    </>
  );
}

const FLAG: Record<UtilizationFlag, { tone: Tone; label: string }> = {
  red: { tone: "error", label: "דגל אדום" },
  below_target: { tone: "warning", label: "מתחת ליעד" },
  on_target: { tone: "success", label: "ביעד" },
  no_data: { tone: "neutral", label: "אין נתונים" },
};

// צבעי סדרות מהפלטה של מערכת העיצוב.
const SERIES = ["#0368b0", "#367C39", "#BD4200", "#6a1b9a", "#0c3058", "#c93435"];

export default function ActivityScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const { mergeActivity, setEnrollment } = useField.getState();
  const { coverage, idx } = useAnalysis();
  const toast = useToast();
  const [importing, setImporting] = useState(false);

  const months = useMemo(() => [...new Set(data.activity.map((a) => a.month))].sort(), [data.activity]);
  const [asOf, setAsOf] = useState(() => latestMonth(data.activity));
  const win = windowMonths(asOf, utilizationWindowMonths(seed.settings));

  const utilRows = data.neighborhoods.map((n) => ({
    n,
    u: utilization({ neighborhoodId: n.id, asOfMonth: asOf, services: data.services, activity: data.activity, enrollment: data.enrollment }, seed),
    enrolled: data.enrollment.find((e) => e.neighborhoodId === n.id && e.month === asOf)?.enrolled,
  }));

  const row = (nid: string) => data.enrollment.find((e) => e.neighborhoodId === nid && e.month === asOf);
  const save = (nid: string, name: string, patch: EnrollmentPatch, what: string) => {
    setEnrollment(nid, asOf, patch);
    toast("success", `עודכן ${what} ב${name}`);
  };
  const penRows = data.neighborhoods.map((n) => ({
    n,
    p: penetration(n.id, data.enrollment, seed.settings, asOf),
    f: timeToFirstService(n.id, data.enrollment, seed.settings, asOf),
    r: row(n.id),
  }));
  const totals = penRows.reduce(
    (acc, { r }) => ({ active: acc.active + (r?.activeParticipants ?? 0), eligible: acc.eligible + (r?.eligible ?? 0) }),
    { active: 0, eligible: 0 },
  );
  const spent = utilRows.reduce((a, r) => a + r.u.spent, 0);
  const capacity = utilRows.reduce((a, r) => a + r.u.capacity, 0);
  const productsAvailable = data.services.some((s) => s.reach === "national" && s.status === "אושר");
  const sp = spread(coverage, productsAvailable);
  const slow = penRows.filter((x) => x.f.overMax).length;
  const prices = hourlyPriceIndex(data.services, seed, asOf);
  const minSessions = activeMinSessions(seed.settings);
  const activeProposal = isProposal(seed.settings, "active_participant_min_sessions_month");

  const serviceNeighborhood = new Map(data.services.map((s) => [s.id, s.neighborhoodId]));
  const trend = months.map((m) => {
    const row: Record<string, string | number> = { month: monthLabel(m) };
    for (const n of data.neighborhoods) row[n.name] = 0;
    for (const a of data.activity) {
      if (a.month !== m) continue;
      const n = data.neighborhoods.find((x) => x.id === serviceNeighborhood.get(a.serviceId));
      if (n) row[n.name] = (row[n.name] as number) + a.uniqueParticipants;
    }
    return row;
  });

  const below = servicesBelowThreshold(data.services, data.activity, asOf, seed);
  const sById = new Map(data.services.map((s) => [s.id, s]));
  const nName = new Map(data.neighborhoods.map((n) => [n.id, n.name]));
  const unitCounts = Object.values(CONTINUITY_STATUS).map((st) => ({ st, n: coverage.units.filter((u) => u.status === st).length }));

  return (
    <>
      <PageHeader
        title="מה הולך"
        description={`פעילות חודשית מצטברת בלבד: שירות, חודש, משתתפים ייחודיים ומפגשים. מספר קטן מ-${seed.settings.small_cell_threshold} מוצג כ-"<${seed.settings.small_cell_threshold}".`}
        actions={
          <Button variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!data.services.length} onClick={() => setImporting(true)}>
            ייבוא פעילות מ-Excel
          </Button>
        }
      />

      {!data.activity.length ? (
        <EmptyState icon={<LineIcon size={40} />} title="עוד אין פעילות">
          ייבאו קובץ Excel עם שירות, חודש ומספר משתתפים ייחודיים לכל שירות.
        </EmptyState>
      ) : (
        <>
          <div className="row">
            <div style={{ minWidth: 220 }}>
              <SelectField
                label="חודש אחרון בחלון"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
                hint={`חלון מיצוי: ${win.map(monthLabel).join(", ")}`}
              />
            </div>
          </div>

          <section className="grid grid--kpi" aria-label={`מדדים ב-${monthLabel(asOf)}`}>
            <div className="card kpi">
              <span className="kpi__value">{percent(capacity ? spent / capacity : null)}</span>
              <span className="kpi__label">{metricName(seed, "utilization")}: כסף שנוצל מהארנק</span>
            </div>
            <div className="card kpi">
              <span className="kpi__value">{percent(totals.eligible && totals.active >= seed.settings.small_cell_threshold ? totals.active / totals.eligible : null)}</span>
              <span className="kpi__label">{metricName(seed, "penetration")}: משתתפים פעילים מתוך הזכאים</span>
            </div>
            <div className="card kpi">
              <span className="kpi__value">{sp.meeting} מתוך {sp.neighborhoods}</span>
              <span className="kpi__label">{metricName(seed, "spread")}: שכונות שעומדות ברצפה בכל קטגוריות הליבה</span>
            </div>
            <div className="card kpi">
              <span className="kpi__value">{slow}</span>
              <span className="kpi__label">שכונות מעל {seed.settings.first_service_max_days} ימים ל{metricName(seed, "time_to_first_service")}</span>
            </div>
          </section>

          <section className="card" aria-labelledby="util-h">
            <h2 id="util-h">{metricName(seed, "utilization")} הארנק האישי (כסף)</h2>
            <p className="muted">
              הוצאה מהארנק מול {shekel(seed.settings.personal_wallet)} לכל מחזיק סל בחודש, בחלון של {win.length} חודשים. יעד {percent(seed.settings.utilization_target)}, דגל אדום מתחת ל-{percent(seed.settings.red_flag_avg)}.
              {seed.settings.qol_counts_in_target ? "" : " איכות חיים וליווי המלווה לא נספרים."}
            </p>
            <TableWrap label="מיצוי לפי שכונה">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">שכונה</th>
                    <th scope="col">מחזיקי סל ב-{monthLabel(asOf)}</th>
                    <th scope="col">הוצאה בחלון</th>
                    <th scope="col">תקציב בחלון</th>
                    <th scope="col">מיצוי</th>
                    <th scope="col">מצב</th>
                  </tr>
                </thead>
                <tbody>
                  {utilRows.map(({ n, u, enrolled }) => (
                    <tr key={n.id}>
                      <th scope="row">{n.name}</th>
                      <td>
                        <label className="visually-hidden" htmlFor={`enr-${n.id}`}>מחזיקי סל ב{n.name} בחודש {monthLabel(asOf)}</label>
                        <input
                          id={`enr-${n.id}`}
                          className="input input--narrow"
                          type="number"
                          min={0}
                          inputMode="numeric"
                          defaultValue={enrolled ?? ""}
                          key={`${n.id}-${asOf}-${enrolled ?? ""}`}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (e.target.value === "" || !Number.isInteger(v) || v < 0 || v === enrolled) return;
                            setEnrollment(n.id, asOf, { enrolled: v });
                            toast("success", `עודכן מספר מחזיקי הסל ב${n.name}`);
                          }}
                        />
                      </td>
                      <td className="num">{shekel(u.spent)}</td>
                      <td className="num">{shekel(u.capacity)}</td>
                      <td className="num">{percent(u.rate)}</td>
                      <td><Badge tone={FLAG[u.flag].tone}>{FLAG[u.flag].label}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <section className="card" aria-labelledby="pen-h">
            <h2 id="pen-h">{metricName(seed, "penetration")} (אנשים) ו{metricName(seed, "time_to_first_service")}</h2>
            <p className="muted">
              נתונים מצטברים מדוח ספק העל לשכונה ולחודש {monthLabel(asOf)}. משתתף פעיל: לפחות {minSessions} מפגשים בחודש
              {activeProposal ? <> <ProposalBadge note={statusNote(seed.settings, "active_participant_min_sessions_month")} /></> : null}.
              {" "}{metricName(seed, "penetration")} היא פעילים חלקי הזכאים ברמות 1 עד 3, ואינה {metricName(seed, "utilization")}, שמודד כסף. מספר קטן מ-{seed.settings.small_cell_threshold} לא מוצג.
            </p>
            <TableWrap label={`${metricName(seed, "penetration")} וזמן לשירות ראשון לפי שכונה`}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">שכונה</th>
                    <th scope="col">משתתפים פעילים</th>
                    <th scope="col">זכאים ברמות 1 עד 3</th>
                    <th scope="col">{metricName(seed, "penetration")}</th>
                    <th scope="col">ימים ממוצע לשירות ראשון</th>
                    <th scope="col">נרשמים בחודש</th>
                    <th scope="col">מצב</th>
                  </tr>
                </thead>
                <tbody>
                  {penRows.map(({ n, p, f, r }) => (
                    <tr key={n.id}>
                      <th scope="row">{n.name}</th>
                      <td>
                        <NumberCell id={`act-${n.id}`} label={`משתתפים פעילים ב${n.name}`} value={r?.activeParticipants}
                          onSave={(v) => save(n.id, n.name, { activeParticipants: v }, "מספר המשתתפים הפעילים")} />
                      </td>
                      <td>
                        <NumberCell id={`eli-${n.id}`} label={`זכאים ב${n.name}`} value={r?.eligible}
                          onSave={(v) => save(n.id, n.name, { eligible: v }, "מספר הזכאים")} />
                      </td>
                      <td className="num">{p.suppressed ? `<${seed.settings.small_cell_threshold}` : percent(p.rate)}</td>
                      <td>
                        <NumberCell id={`ftd-${n.id}`} label={`ימים ממוצע לשירות ראשון ב${n.name}`} value={r?.firstServiceDaysAvg} decimal
                          onSave={(v) => save(n.id, n.name, { firstServiceDaysAvg: v }, "הזמן לשירות ראשון")} />
                      </td>
                      <td>
                        <NumberCell id={`ftc-${n.id}`} label={`נרשמים חדשים ב${n.name}`} value={r?.firstServiceCount}
                          onSave={(v) => save(n.id, n.name, { firstServiceCount: v }, "מספר הנרשמים")} />
                      </td>
                      <td>
                        {f.suppressed ? (
                          <Badge tone="neutral">פחות מ-{seed.settings.small_cell_threshold} נרשמים, לא מוצג</Badge>
                        ) : f.avgDays === null ? (
                          <Badge tone="neutral">אין נתונים</Badge>
                        ) : f.overMax ? (
                          <Badge tone="warning">מעל {seed.settings.first_service_max_days} ימים</Badge>
                        ) : (
                          <Badge tone="success">עד {seed.settings.first_service_max_days} ימים</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>

          <section className="card" aria-labelledby="hourly-h">
            <h2 id="hourly-h">{metricName(seed, "hourly_price_index")}, {quarterText(pricePeriod(asOf, seed.settings))}</h2>
            <p className="muted">ממוצע של מחיר ליחידה חלקי שעות השירות ביחידה, לפי קטגוריה. נכנסים שירותים שהתחילו עד סוף התקופה ולא נדחו, ושיש להם שעות ליחידה.</p>
            {prices.length ? (
              <TableWrap label={metricName(seed, "hourly_price_index")}>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">קטגוריה</th>
                      <th scope="col">שירותים</th>
                      <th scope="col">מחיר ממוצע לשעה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.filter((x) => x.authority === data.authority).map((x) => (
                      <tr key={x.categoryCode}>
                        <th scope="row">{x.categoryCode} {idx.categories.get(x.categoryCode)?.name ?? ""}</th>
                        <td className="num">{x.services}</td>
                        <td className="num">{x.avgHourly.toLocaleString("he-IL", { maximumFractionDigits: 2 })} ש"ח</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <p>אין עדיין שירותים עם שעות ליחידה. השלימו אותם בקטלוג.</p>
            )}
          </section>

          <section className="card" aria-labelledby="trend-h">
            <h2 id="trend-h">מגמה: משתתפים ייחודיים לפי חודש</h2>
            <p className="muted">סכום המשתתפים הייחודיים בכל שירותי השכונה. הנתונים המלאים בטבלה שמתחת לגרף.</p>
            <div className="chart" aria-hidden="true">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid stroke="#e9ebef" />
                  <XAxis dataKey="month" reversed tick={{ fill: "#266794", fontSize: 12 }} />
                  <YAxis orientation="right" tick={{ fill: "#266794", fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontFamily: "Rubik", direction: "rtl", textAlign: "right" }} />
                  <Legend wrapperStyle={{ direction: "rtl" }} />
                  {data.neighborhoods.map((n, i) => (
                    <Line key={n.id} type="monotone" dataKey={n.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2}
                      strokeDasharray={i % 2 ? "6 3" : undefined} dot={{ r: 3 }} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details>
              <summary>טבלת הנתונים של הגרף</summary>
              <TableWrap label="משתתפים לפי חודש ושכונה">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">חודש</th>
                      {data.neighborhoods.map((n) => <th key={n.id} scope="col">{n.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((row) => (
                      <tr key={row.month}>
                        <th scope="row">{row.month}</th>
                        {data.neighborhoods.map((n) => <td key={n.id} className="num">{formatCount(row[n.name] as number, seed.settings)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </details>
          </section>

          <section className="card" aria-labelledby="below-h">
            <h2 id="below-h">שירותים מתחת לסף ב-{monthLabel(asOf)} ({below.length})</h2>
            <p className="muted">פחות מ-{seed.settings.min_participants} משתתפים בחודש. שירות כזה לא נספר כרציף.</p>
            {below.length ? (
              <TableWrap label="שירותים מתחת לסף">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">שירות</th>
                      <th scope="col">שכונה</th>
                      <th scope="col">משתתפים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {below.map((b) => {
                      const s = sById.get(b.serviceId)!;
                      return (
                        <tr key={b.serviceId}>
                          <th scope="row">{s.name}</th>
                          <td>{nName.get(s.neighborhoodId)}</td>
                          <td className="num">{formatCount(b.participants, seed.settings)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <p>כל השירותים הפעילים בחודש מעל הסף.</p>
            )}
          </section>

          <section className="card" aria-labelledby="units-h">
            <h2 id="units-h">רציפות</h2>
            <div className="row">
              {unitCounts.map(({ st, n }) => (
                <Badge key={st} tone={st === CONTINUITY_STATUS.continuous ? "success" : st === CONTINUITY_STATUS.event ? "info" : "neutral"}>
                  {st}: {n}
                </Badge>
              ))}
            </div>
            <p className="muted">חודש פעילות אחד בלבד נחשב "אירוע" ולא נספר בכיסוי.</p>
          </section>
        </>
      )}

      <ImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        title="ייבוא פעילות חודשית"
        description="כל שורה: שירות (לפי שם או מזהה), חודש, משתתפים ייחודיים, ואם יש, מפגשים והוצאה מהארנק. שורה לאותו שירות וחודש מחליפה את הקיימת."
        fields={ACTIVITY_IMPORT_FIELDS}
        template={activityTemplateWorkbook}
        templateName="תבנית_פעילות"
        onImport={(rows, mapping) => {
          const { activity, errors } = rowsToActivity(rows, mapping, data.services);
          mergeActivity(activity);
          if (activity.length) {
            toast("success", `נקלטו ${activity.length} רשומות פעילות`);
            setAsOf(latestMonth([...data.activity, ...activity]));
          }
          return { imported: activity.length, errors };
        }}
      />
    </>
  );
}
