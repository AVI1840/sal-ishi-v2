// פערים וחלופות (תוספת 3): לכל פער ברצפה, חלופות כהצעה: רשות סמוכה, שירות אזורי
// או שירות מרחוק. יעד העושר (5 בקטגוריה) מוצג כמדד בלבד, לא כהתראה אדומה.

import { gapAlternatives, isProposal, type Service } from "@sal-ishi/core";
import { Badge, EmptyState, PageHeader, ProposalBadge, TableWrap } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";

const LEVEL = { red: { tone: "error", text: "אדום" }, orange: { tone: "warning", text: "כתום" } } as const;

function Alternatives(props: { title: string; list: Service[] }) {
  if (!props.list.length) return null;
  return (
    <p>
      <strong>{props.title}: </strong>
      {props.list.map((s) => s.name).join(", ")}
    </p>
  );
}

export default function GapsScreen() {
  const { state, seed, coverage } = useHqAnalysis();
  const hoods = new Map(state.neighborhoods.map((n) => [n.id, n]));
  const cats = new Map(seed.core_categories.map((c) => [c.id, c.name]));
  const gaps = coverage.cells.filter((c) => c.level === "red" || c.level === "orange");
  const accessible = coverage.alerts.filter((a) => a.kind === "accessible");
  const checked = coverage.cells.filter((c) => c.level !== "not_checked");
  const richness = checked.filter((c) => c.count >= (c.target ?? Infinity)).length;

  return (
    <>
      <PageHeader
        title="פערים וחלופות"
        description="לכל פער ברצפה (3 שירותים רציפים בקטגוריה, בכל שכונה) מוצגות חלופות. אלה הצעות, וההחלטה אצל הרשות והמטה."
      />
      <section className="card stack" aria-labelledby="rich-h">
        <h2 id="rich-h">
          יעד עושר: {richness} מתוך {checked.length} תאים {isProposal(seed.settings, "target_per_category") ? <ProposalBadge /> : null}
        </h2>
        <p className="muted">יעד של 5 שירותים בקטגוריה בשכונה. מדד בלבד, לא חוסם ולא מסומן באדום.</p>
      </section>

      {accessible.length ? (
        <section className="card stack" aria-labelledby="acc-h">
          <h2 id="acc-h">
            נגישות ({accessible.length}) {isProposal(seed.settings, "floor_min_accessible") ? <ProposalBadge /> : null}
          </h2>
          <ul>
            {accessible.map((a, i) => (
              <li key={i}>
                {hoods.get(a.neighborhoodId)?.name}: {a.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gaps.length === 0 ? (
        <EmptyState title="אין פערים ברצפה">כל השכונות עומדות ברצפה בכל קטגוריות הליבה.</EmptyState>
      ) : (
        <TableWrap label="פערים ברצפה">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">שכונה</th>
                <th scope="col">קטגוריה</th>
                <th scope="col">רציפים</th>
                <th scope="col">רמה</th>
                <th scope="col">חלופות (הצעה)</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((c) => {
                const alt = gapAlternatives(state, seed, c.neighborhoodId, c.coreCategoryId);
                const none = !alt.otherAuthority.length && !alt.regional.length && !alt.remote.length;
                return (
                  <tr key={`${c.neighborhoodId}|${c.coreCategoryId}`}>
                    <td>{hoods.get(c.neighborhoodId)?.name}</td>
                    <td>{cats.get(c.coreCategoryId)}</td>
                    <td>
                      {c.count} מתוך {c.floor}
                    </td>
                    <td>
                      <Badge tone={LEVEL[c.level as "red" | "orange"].tone}>{LEVEL[c.level as "red" | "orange"].text}</Badge>
                    </td>
                    <td>
                      <Alternatives title="ברשות אחרת" list={alt.otherAuthority} />
                      <Alternatives title="אזורי או רשותי" list={alt.regional} />
                      <Alternatives title="מרחוק" list={alt.remote} />
                      {none ? <span className="muted">אין חלופה בקטלוג. לגייס ספקים לשכונה.</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  );
}
