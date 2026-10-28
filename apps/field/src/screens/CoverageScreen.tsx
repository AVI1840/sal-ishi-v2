// מבחן כיסוי: שכונה מול חמש קטגוריות הליבה. לחיצה על תא מציגה מה נספר,
// ובפער מציעה שלושה סוגי שירות מהספרייה.

import { useState } from "react";
import { Grid3x3, MessageSquareWarning, Plus } from "lucide-react";
import {
  CONTINUITY_STATUS,
  FileSyncAdapter,
  createBrowserFileIO,
  formatCount,
  suggestServiceTypes,
  unmetByCell,
  type CoverageCell,
  type Service,
  type UnmetDemand,
} from "@sal-ishi/core";
import { Alert, Badge, Button, Dialog, EmptyState, PageHeader, TableWrap, useToast, type Tone } from "@sal-ishi/ui";
import { ServiceForm } from "../components/ServiceForm";
import { useAnalysis } from "../analysis";
import { useField } from "../store";

const LEVEL: Record<CoverageCell["level"], { tone: Tone; text: (c: CoverageCell) => string }> = {
  green: { tone: "success", text: (c) => `עומד (${c.count}/${c.floor})` },
  orange: { tone: "warning", text: (c) => `חסר 1 (${c.count}/${c.floor})` },
  red: { tone: "error", text: (c) => `חסרים ${c.missing} (${c.count}/${c.floor})` },
  not_checked: { tone: "neutral", text: () => "ערוץ ארצי, לא נבדק" },
};

export default function CoverageScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const { coverage, labels, idx } = useAnalysis();
  const mergeUnmetDemand = useField((s) => s.mergeUnmetDemand);
  const toast = useToast();
  const unmet = unmetByCell(data.unmetDemand ?? [], seed);
  const [open, setOpen] = useState<CoverageCell | null>(null);

  // קליטת קובץ "ביקשו ואין" מהכלי של המלווה. השכונה מזוהה לפי שם.
  const importUnmet = async () => {
    try {
      const file = await new FileSyncAdapter(createBrowserFileIO()).receiveUnmetDemand();
      if (!file) return;
      const byName = new Map(data.neighborhoods.map((n) => [n.name, n.id]));
      const rows: UnmetDemand[] = [];
      let skipped = 0;
      for (const r of file.rows) {
        const id = byName.get(r.neighborhoodName);
        if (id) rows.push({ neighborhoodId: id, serviceTypeId: r.serviceTypeId, month: r.month, requests: r.requests });
        else skipped++;
      }
      mergeUnmetDemand(rows);
      toast(skipped ? "warning" : "success", `נקלטו ${rows.length} שורות ביקוש${skipped ? `, ${skipped} שורות עם שכונה שלא מוגדרת ברשות לא נקלטו` : ""}`);
    } catch (e) {
      toast("error", `הקובץ לא נקלט: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const [prefill, setPrefill] = useState<Partial<Service> | null>(null);

  const cellOf = (n: string, cc: string) => coverage.cells.find((c) => c.neighborhoodId === n && c.coreCategoryId === cc)!;
  const nById = new Map(data.neighborhoods.map((n) => [n.id, n]));
  const ccById = new Map(seed.core_categories.map((c) => [c.id, c]));
  const sById = new Map(data.services.map((s) => [s.id, s]));

  const openNeighborhood = open ? nById.get(open.neighborhoodId) : undefined;
  const openCategory = open ? ccById.get(open.coreCategoryId) : undefined;
  const openUnits = open ? coverage.units.filter((u) => u.neighborhoodId === open.neighborhoodId && openCategory?.codes.includes(u.categoryCode)) : [];
  const suggestions = open
    ? suggestServiceTypes(seed, open.coreCategoryId, 3, { presentCodes: openUnits.filter((u) => open.unitKeys.includes(u.key)).map((u) => u.categoryCode) })
    : [];
  const openUnmet = open ? unmet.get(`${open.neighborhoodId}|${open.coreCategoryId}`) : undefined;

  if (!data.neighborhoods.length) {
    return (
      <>
        <PageHeader title="מבחן כיסוי" />
        <EmptyState icon={<Grid3x3 size={40} />} title="אין שכונות">הגדירו שכונות במסך הרשות שלי.</EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="מבחן כיסוי"
        description={`לכל שכונה ולכל קטגוריית ליבה: כמה שירותים רציפים שנכנסו או אושרו, מול רצפה של ${seed.settings.core_floor}. שירות רציף: לפחות ${seed.settings.min_participants} משתתפים בחודש השיא ולפחות ${seed.settings.min_active_months} חודשים פעילים. סבבים של אותה תוכנית נספרים פעם אחת, ושירות ברמת רשות נספר בכל שכונותיה.`}
        actions={<Button variant="secondary" icon={<MessageSquareWarning size={18} />} onClick={importUnmet}>קליטת "ביקשו ואין" מהמלוות</Button>}
      />

      <div className="row" role="group" aria-label="מקרא">
        <Badge tone="success">עומד ברצפה</Badge>
        <Badge tone="warning">חסר שירות אחד</Badge>
        <Badge tone="error">חסרים שניים ומעלה</Badge>
        <Badge tone="neutral">לא נבדק</Badge>
        <span className="cell-alert">ביקשו ואין: בקשות שהמלוות סימנו ואין להן מענה</span>
      </div>

      <TableWrap label="מטריצת כיסוי">
        <table className="table coverage">
          <caption className="visually-hidden">כיסוי לפי שכונה וקטגוריית ליבה. לחיצה על תא מציגה פירוט.</caption>
          <thead>
            <tr>
              <th scope="col">שכונה</th>
              {seed.core_categories.map((cc) => <th key={cc.id} scope="col">{cc.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.neighborhoods.map((n) => (
              <tr key={n.id}>
                <th scope="row">
                  {n.name}
                  <div><Badge tone={n.community === "general" ? "neutral" : "info"}>{labels.community[n.community]}</Badge></div>
                </th>
                {seed.core_categories.map((cc) => {
                  const cell = cellOf(n.id, cc.id);
                  const lv = LEVEL[cell.level];
                  const alerts = coverage.alerts.filter((a) => a.neighborhoodId === n.id && a.coreCategoryId === cc.id);
                  const asked = unmet.get(`${n.id}|${cc.id}`)?.requests ?? 0;
                  return (
                    <td key={cc.id}>
                      {cell.level === "not_checked" ? (
                        <Badge tone={lv.tone}>{lv.text(cell)}</Badge>
                      ) : (
                        <button className="cell-btn" type="button" onClick={() => setOpen(cell)} aria-label={`${n.name}, ${cc.name}: ${lv.text(cell)}${alerts.length ? `, ${alerts.length} התראות` : ""}${asked ? `, ביקשו ואין: ${formatCount(asked, seed.settings)}` : ""}. פירוט`}>
                          <Badge tone={lv.tone}>{lv.text(cell)}</Badge>
                          {alerts.length ? <span className="cell-alert">{alerts.length === 1 ? "התראה" : `${alerts.length} התראות`}</span> : null}
                          {asked ? <span className="cell-alert">ביקשו ואין: {formatCount(asked, seed.settings)}</span> : null}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <section className="stack" aria-labelledby="alerts-h">
        <h2 id="alerts-h">התראות ({coverage.alerts.length})</h2>
        <p className="muted">התראות לא חוסמות שירות. הן מסמנות מה כדאי להשלים.</p>
        {coverage.alerts.length ? (
          <ul className="stack plain-list">
            {coverage.alerts.map((a, i) => (
              <li key={i}>
                <Alert tone="warning" title={nById.get(a.neighborhoodId)?.name}>
                  {a.kind === "community" ? "התאמה קהילתית: " : a.kind === "breadth" ? "רוחב: " : "תת-תחום: "}
                  {a.message}
                </Alert>
              </li>
            ))}
          </ul>
        ) : (
          <Alert tone="success">אין התראות.</Alert>
        )}
      </section>

      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? `${openNeighborhood?.name}: ${openCategory?.name}` : ""}
      >
        {open ? (
          <>
            <Badge tone={LEVEL[open.level].tone}>{LEVEL[open.level].text(open)}</Badge>
            <h3>שירותים בקטגוריה</h3>
            {openUnits.length ? (
              <ul className="stack plain-list">
                {openUnits.map((u) => (
                  <li key={u.key} className="row">
                    <Badge tone={u.status === CONTINUITY_STATUS.continuous && open.unitKeys.includes(u.key) ? "success" : "neutral"}>
                      {open.unitKeys.includes(u.key) ? "נספר" : u.status}
                    </Badge>
                    <span>{u.serviceIds.map((id) => sById.get(id)?.name).join(" + ")}</span>
                    <span className="muted">שיא {u.peakParticipants} משתתפים, {u.activeMonths} חודשים</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>אין עדיין שירותים בקטגוריה הזו בשכונה.</p>
            )}
            {openUnmet ? (
              <Alert tone="warning" title={`ביקשו ואין: ${formatCount(openUnmet.requests, seed.settings)} בקשות`}>
                <ul>
                  {[...openUnmet.types.entries()].map(([t, n]) => (
                    <li key={t}>{idx.serviceTypes.get(t)?.name ?? t}: {formatCount(n, seed.settings)}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}
            {open.level !== "green" || openUnmet ? (
              <>
                <h3>הצעות להשלמה מהספרייה</h3>
                <ul className="stack plain-list">
                  {suggestions.map((t) => (
                    <li key={t.id} className="row suggestion">
                      <span><strong>{t.name}</strong> <span className="muted">{t.category} {idx.categories.get(t.category)?.name} | {t.format} | {t.note ?? ""}</span></span>
                      <Button
                        small
                        variant="secondary"
                        icon={<Plus size={16} />}
                        aria-label={`הוספת ${t.name} לשכונה`}
                        onClick={() => {
                          setPrefill({
                            neighborhoodId: open.neighborhoodId,
                            serviceTypeId: t.id,
                            communityFit: openNeighborhood && openNeighborhood.community !== "general" ? [openNeighborhood.community] : ["general"],
                          });
                          setOpen(null);
                        }}
                      >
                        הוספה
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : null}
      </Dialog>

      <ServiceForm open={prefill !== null} prefill={prefill ?? undefined} onClose={() => setPrefill(null)} />
    </>
  );
}
