// מה הולך: פעילות חודשית מצטברת, מגמה, מיצוי בחלון מתגלגל ושירותים מתחת לסף.

import { useMemo, useState } from "react";
import { FileSpreadsheet, LineChart as LineIcon } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ACTIVITY_IMPORT_FIELDS,
  CONTINUITY_STATUS,
  activityTemplateWorkbook,
  formatCount,
  rowsToActivity,
  servicesBelowThreshold,
  utilization,
  utilizationWindowMonths,
  windowMonths,
  type UtilizationFlag,
} from "@sal-ishi/core";
import { Badge, Button, EmptyState, PageHeader, SelectField, TableWrap, type Tone, useToast } from "@sal-ishi/ui";
import { ImportDialog } from "../components/ImportDialog";
import { monthLabel, percent, shekel, useAnalysis } from "../analysis";
import { latestMonth, useField } from "../store";

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
  const { coverage } = useAnalysis();
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

          <section className="card" aria-labelledby="util-h">
            <h2 id="util-h">מיצוי הארנק האישי</h2>
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
                            setEnrollment(n.id, asOf, v);
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
