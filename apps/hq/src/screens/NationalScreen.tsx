// תמונה ארצית: השוואה בין פיילוטים לפי אותם כללים, כיסוי לכל שכונה, מיצוי
// ודגלים אדומים, ומגוון ספקים. גרסה 0.4: מיצוי (כסף) וחדירה (אנשים) בנפרד,
// פריסה, זמן לשירות ראשון, ושירותים שדורשים השלמה לפי פיילוט.

import { Map as MapIcon } from "lucide-react";
import {
  formatCount,
  metricName,
  migrationGaps,
  penetration,
  spread,
  timeToFirstService,
  type CoverageCell,
  type UtilizationFlag,
} from "@sal-ishi/core";
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
  const { state, seed, summaries, coverage, diversity, labels, idx } = useHqAnalysis();

  if (!summaries.length) {
    return (
      <>
        <PageHeader title="תמונה ארצית" />
        <EmptyState icon={<MapIcon size={40} />} title="אין עדיין פיילוטים">קלטו חבילות פיילוט במסך קליטת החבילות.</EmptyState>
      </>
    );
  }

  const total = (f: (s: (typeof summaries)[number]) => number) => summaries.reduce((n, s) => n + f(s), 0);
  const checked = seed.core_categories.filter((c) => !c.national_list_only || seed.settings.products_count_in_floor);
  const productsAvailable = state.services.some((s) => s.reach === "national" && s.status === "אושר");
  const small = seed.settings.small_cell_threshold;
  // מדדי 0.4 לכל פיילוט: חדירה וזמן לשירות ראשון מהנתונים המצטברים, ופריסה מהכיסוי.
  const metrics = new Map(
    summaries.map((s) => {
      const ns = state.neighborhoods.filter((n) => n.authority === s.authority);
      const ids = new Set(ns.map((n) => n.id));
      const asOf = s.asOfMonth ?? undefined;
      const pen = ns.map((n) => penetration(n.id, state.enrollment, seed.settings, asOf));
      const first = ns.map((n) => timeToFirstService(n.id, state.enrollment, seed.settings, asOf));
      const rows = state.enrollment.filter((e) => ids.has(e.neighborhoodId) && e.month === pen.find((x) => x.month)?.month);
      const active = rows.reduce((a, e) => a + (e.activeParticipants ?? 0), 0);
      const eligible = rows.reduce((a, e) => a + (e.eligible ?? 0), 0);
      const sp = spread({ ...coverage, cells: coverage.cells.filter((c) => ids.has(c.neighborhoodId)) }, productsAvailable);
      const gaps = migrationGaps(state.services.filter((x) => x.authority === s.authority), seed).filter((g) => g.gaps.length).length;
      const spent = s.utilization.reduce((a, u) => a + u.spent, 0);
      const capacity = s.utilization.reduce((a, u) => a + u.capacity, 0);
      return [s.authority, {
        pen: new Map(ns.map((n, i) => [n.id, pen[i]!])),
        first: new Map(ns.map((n, i) => [n.id, first[i]!])),
        active, eligible,
        penRate: eligible && active >= small ? active / eligible : null,
        utilRate: capacity ? spent / capacity : null,
        spent, capacity, sp, gaps,
        slow: first.filter((f) => f.overMax).length,
      }] as const;
    }),
  );
  const all = [...metrics.values()];
  const sum = (f: (m: (typeof all)[number]) => number) => all.reduce((a, m) => a + f(m), 0);
  const nationalPen = sum((m) => m.eligible) && sum((m) => m.active) >= small ? sum((m) => m.active) / sum((m) => m.eligible) : null;
  const nationalUtil = sum((m) => m.capacity) ? sum((m) => m.spent) / sum((m) => m.capacity) : null;

  return (
    <>
      <PageHeader
        title="תמונה ארצית"
        description={`כל הפיילוטים לפי אותם כללים (גרסת כללים ${seed.meta.version}): רצפה של ${seed.settings.core_floor} שירותים רציפים לכל קטגוריית ליבה, יעד מיצוי ${percent(seed.settings.utilization_target)} ודגל אדום מתחת ל-${percent(seed.settings.red_flag_avg)}.`}
      />

      <div className="grid grid--kpi">
        <Kpi value={summaries.length} label="פיילוטים" />
        <Kpi value={total((s) => s.neighborhoods)} label="שכונות" />
        <Kpi value={total((s) => s.approved)} label={`שירותים מאושרים מתוך ${total((s) => s.services)}`} />
        <Kpi value={total((s) => s.coverage.red)} label="פערי כיסוי אדומים" />
        <Kpi value={total((s) => s.redFlags)} label="שכונות בדגל אדום במיצוי" />
      </div>

      <section className="stack" aria-labelledby="m04-h">
        <h2 id="m04-h">מדדים</h2>
        <p className="muted">
          {metricName(seed, "utilization")} מודד כסף: מה נוצל מהארנק. {metricName(seed, "penetration")} מודדת אנשים: משתתפים פעילים מתוך הזכאים ברמות 1 עד 3, מדוח ספק העל.
          {" "}{metricName(seed, "spread")}: שכונות שעומדות ברצפה בכל קטגוריות הליבה שנבדקות{seed.settings.products_count_in_floor ? "" : ", בלי מוצרים"}.
        </p>
        <div className="grid grid--kpi">
          <Kpi value={percent(nationalUtil)} label={`${metricName(seed, "utilization")} ארצי (כסף)`} />
          <Kpi value={percent(nationalPen)} label={`${metricName(seed, "penetration")} ארצית (אנשים)`} />
          <Kpi value={`${sum((m) => m.sp.meeting)} מתוך ${sum((m) => m.sp.neighborhoods)}`} label={`${metricName(seed, "spread")}: שכונות שעומדות ברצפה`} />
          <Kpi value={sum((m) => m.slow)} label={`שכונות מעל ${seed.settings.first_service_max_days} ימים לשירות ראשון`} />
          <Kpi value={sum((m) => m.gaps)} label="שירותים שדורשים השלמה לגרסה 0.4" />
        </div>
        {!productsAvailable ? <p><Badge tone="warning">אין עדיין מוצר ארצי מאושר</Badge></p> : null}
      </section>

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
                <th scope="col">{metricName(seed, "utilization")}</th>
                <th scope="col">{metricName(seed, "penetration")}</th>
                <th scope="col">{metricName(seed, "spread")}</th>
                <th scope="col">דורשים השלמה</th>
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
                  <td className="num">{percent(metrics.get(s.authority)!.utilRate)}</td>
                  <td className="num">{percent(metrics.get(s.authority)!.penRate)}</td>
                  <td className="num">{metrics.get(s.authority)!.sp.meeting}/{metrics.get(s.authority)!.sp.neighborhoods}</td>
                  <td>{metrics.get(s.authority)!.gaps ? <Badge tone="warning">{metrics.get(s.authority)!.gaps}</Badge> : <Badge tone="success">0</Badge>}</td>
                  <td>{monthLabel(s.asOfMonth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="stack" aria-labelledby="cov-h">
        <h2 id="cov-h">כיסוי, {metricName(seed, "utilization")} ו{metricName(seed, "penetration")} לפי שכונה</h2>
        <TableWrap label="כיסוי, מיצוי וחדירה לפי שכונה">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פיילוט</th>
                <th scope="col">שכונה</th>
                {checked.map((cc) => <th key={cc.id} scope="col">{cc.name}</th>)}
                <th scope="col">{metricName(seed, "utilization")}</th>
                <th scope="col">{metricName(seed, "penetration")}</th>
                <th scope="col">ימים לשירות ראשון</th>
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
                        <td className="num">
                          {(() => {
                            const pn = metrics.get(s.authority)!.pen.get(n.id);
                            return pn?.suppressed ? `<${small}` : percent(pn?.rate ?? null);
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const f = metrics.get(s.authority)!.first.get(n.id);
                            if (!f || (f.avgDays === null && !f.suppressed)) return "-";
                            if (f.suppressed) return <span className="muted">פחות מ-{small} נרשמים</span>;
                            return <Badge tone={f.overMax ? "warning" : "success"}>{f.avgDays} ימים</Badge>;
                          })()}
                        </td>
                      </tr>
                    );
                  }),
              )}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="stack" aria-labelledby="unmet-h">
        <h2 id="unmet-h">ביקשו ואין: ביקוש שלא נענה</h2>
        <p className="muted">מה שהמלוות סימנו כבקשה של אזרח בלי מענה בשכונה. ספירה מצטברת בלבד, מספר קטן מ-{seed.settings.small_cell_threshold} מוצג כ-"&lt;{seed.settings.small_cell_threshold}".</p>
        {(() => {
          const rows = new Map<string, { type: string; pilots: Map<string, number>; total: number }>();
          const nAuth = new Map(state.neighborhoods.map((n) => [n.id, n.authority]));
          for (const u of state.unmetDemand ?? []) {
            const r = rows.get(u.serviceTypeId) ?? { type: u.serviceTypeId, pilots: new Map<string, number>(), total: 0 };
            const a = nAuth.get(u.neighborhoodId) ?? "";
            r.pilots.set(a, (r.pilots.get(a) ?? 0) + u.requests);
            r.total += u.requests;
            rows.set(u.serviceTypeId, r);
          }
          const sorted = [...rows.values()].sort((a, b) => b.total - a.total);
          return sorted.length ? (
            <TableWrap label="ביקוש שלא נענה לפי סוג שירות">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">סוג שירות</th>
                    {summaries.map((s) => <th key={s.authority} scope="col">{s.authority}</th>)}
                    <th scope="col">סה"כ</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.type}>
                      <th scope="row">{idx.serviceTypes.get(r.type)?.name ?? r.type}</th>
                      {summaries.map((s) => <td key={s.authority} className="num">{r.pilots.get(s.authority) ? formatCount(r.pilots.get(s.authority)!, seed.settings) : "-"}</td>)}
                      <td className="num">{formatCount(r.total, seed.settings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <p>עוד לא דווח ביקוש שלא נענה.</p>
          );
        })()}
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

function Kpi(props: { value: number | string; label: string }) {
  return (
    <div className="card kpi">
      <span className="kpi__value">{typeof props.value === "number" ? props.value.toLocaleString("he-IL") : props.value}</span>
      <span className="kpi__label">{props.label}</span>
    </div>
  );
}
