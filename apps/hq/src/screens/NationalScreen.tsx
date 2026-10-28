// תמונה ארצית: השוואה בין פיילוטים לפי אותם כללים, כיסוי לכל שכונה, מיצוי
// ודגלים אדומים, ומגוון ספקים.

import { Map as MapIcon } from "lucide-react";
import type { CoverageCell, UtilizationFlag } from "@sal-ishi/core";
import { Badge, EmptyState, PageHeader, TableWrap, type Tone } from "@sal-ishi/ui";
import { monthLabel, percent, useHqAnalysis } from "../analysis";

const LEVEL: Record<CoverageCell["level"], { tone: Tone; text: (c: CoverageCell) => string }> = {
  green: { tone: "success", text: (c) => `עומד ${c.count}/${c.floor}` },
  orange: { tone: "warning", text: (c) => `חסר 1 (${c.count}/${c.floor})` },
  red: { tone: "error", text: (c) => `חסרים ${c.missing} (${c.count}/${c.floor})` },
  not_checked: { tone: "neutral", text: () => "ארצי" },
};

const FLAG: Record<UtilizationFlag, { tone: Tone; label: string }> = {
  red: { tone: "error", label: "דגל אדום" },
  below_target: { tone: "warning", label: "מתחת ליעד" },
  on_target: { tone: "success", label: "ביעד" },
  no_data: { tone: "neutral", label: "אין נתונים" },
};

export default function NationalScreen() {
  const { state, seed, summaries, coverage, diversity, labels } = useHqAnalysis();

  if (!summaries.length) {
    return (
      <>
        <PageHeader title="תמונה ארצית" />
        <EmptyState icon={<MapIcon size={40} />} title="אין עדיין פיילוטים">קלטו חבילות פיילוט במסך קליטת החבילות.</EmptyState>
      </>
    );
  }

  const total = (f: (s: (typeof summaries)[number]) => number) => summaries.reduce((n, s) => n + f(s), 0);
  const checked = seed.core_categories.filter((c) => !c.national_list_only);

  return (
    <>
      <PageHeader
        title="תמונה ארצית"
        description={`כל הפיילוטים לפי אותם כללים (גרסת בסיס ${seed.meta.version}): רצפה של ${seed.settings.core_floor} שירותים רציפים לכל קטגוריית ליבה, יעד מיצוי ${percent(seed.settings.utilization_target)} ודגל אדום מתחת ל-${percent(seed.settings.red_flag_avg)}.`}
      />

      <div className="grid grid--kpi">
        <Kpi value={summaries.length} label="פיילוטים" />
        <Kpi value={total((s) => s.neighborhoods)} label="שכונות" />
        <Kpi value={total((s) => s.approved)} label={`שירותים מאושרים מתוך ${total((s) => s.services)}`} />
        <Kpi value={total((s) => s.coverage.red)} label="פערי כיסוי אדומים" />
        <Kpi value={total((s) => s.redFlags)} label="שכונות בדגל אדום במיצוי" />
      </div>

      <section className="stack" aria-labelledby="cmp-h">
        <h2 id="cmp-h">השוואה בין פיילוטים</h2>
        <TableWrap label="השוואה בין פיילוטים">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פיילוט</th>
                <th scope="col">שכונות</th>
                <th scope="col">שירותים</th>
                <th scope="col">נכנסו</th>
                <th scope="col">אושרו</th>
                <th scope="col">כיסוי (ירוק / כתום / אדום)</th>
                <th scope="col">התראות</th>
                <th scope="col">ספקים</th>
                <th scope="col">דגלים אדומים</th>
                <th scope="col">נתונים עד</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.authority}>
                  <th scope="row">{s.authority}</th>
                  <td className="num">{s.neighborhoods}</td>
                  <td className="num">{s.services}</td>
                  <td className="num">{s.entered}</td>
                  <td className="num">{s.approved}</td>
                  <td>
                    <div className="row">
                      <Badge tone="success">{s.coverage.green}</Badge>
                      <Badge tone="warning">{s.coverage.orange}</Badge>
                      <Badge tone="error">{s.coverage.red}</Badge>
                    </div>
                  </td>
                  <td className="num">{s.alerts}</td>
                  <td>
                    {s.suppliers}
                    <div className="muted">
                      {Object.entries(s.suppliersByType).map(([t, n]) => `${labels.supplierType[t]} ${n}`).join(", ")}
                    </div>
                  </td>
                  <td>{s.redFlags ? <Badge tone="error">{s.redFlags}</Badge> : <Badge tone="success">0</Badge>}</td>
                  <td>{monthLabel(s.asOfMonth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="stack" aria-labelledby="cov-h">
        <h2 id="cov-h">כיסוי ומיצוי לפי שכונה</h2>
        <TableWrap label="כיסוי ומיצוי לפי שכונה">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פיילוט</th>
                <th scope="col">שכונה</th>
                {checked.map((cc) => <th key={cc.id} scope="col">{cc.name}</th>)}
                <th scope="col">מיצוי</th>
              </tr>
            </thead>
            <tbody>
              {summaries.flatMap((s) =>
                state.neighborhoods
                  .filter((n) => n.authority === s.authority)
                  .map((n) => {
                    const u = s.utilization.find((x) => x.neighborhoodId === n.id);
                    return (
                      <tr key={n.id}>
                        <td>{s.authority}</td>
                        <th scope="row">
                          {n.name}
                          <div><Badge tone={n.community === "general" ? "neutral" : "info"}>{labels.community[n.community]}</Badge></div>
                        </th>
                        {checked.map((cc) => {
                          const cell = coverage.cells.find((c) => c.neighborhoodId === n.id && c.coreCategoryId === cc.id)!;
                          return <td key={cc.id}><Badge tone={LEVEL[cell.level].tone}>{LEVEL[cell.level].text(cell)}</Badge></td>;
                        })}
                        <td>
                          {u ? (
                            <>
                              <Badge tone={FLAG[u.flag].tone}>{FLAG[u.flag].label}</Badge>
                              <div className="muted">{percent(u.rate)}</div>
                            </>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  }),
              )}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="stack" aria-labelledby="div-h">
        <h2 id="div-h">מגוון ספקים לפי קטגוריית ליבה</h2>
        <p className="muted">כמה ספקים שונים מספקים שירות בכל קטגוריה. ספק אחד בקטגוריה הוא סיכון לרציפות.</p>
        <TableWrap label="מגוון ספקים">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פיילוט</th>
                {seed.core_categories.map((cc) => <th key={cc.id} scope="col">{cc.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.authority}>
                  <th scope="row">{s.authority}</th>
                  {seed.core_categories.map((cc) => {
                    const n = diversity.find((d) => d.authority === s.authority && d.coreCategoryId === cc.id)?.suppliers ?? 0;
                    return (
                      <td key={cc.id}>
                        {n <= 1 ? <Badge tone={n === 0 ? "neutral" : "warning"}>{n === 0 ? "אין" : "ספק יחיד"}</Badge> : <span className="num-inline">{n}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}

function Kpi(props: { value: number; label: string }) {
  return (
    <div className="card kpi">
      <span className="kpi__value">{props.value.toLocaleString("he-IL")}</span>
      <span className="kpi__label">{props.label}</span>
    </div>
  );
}
