// קליטת חבילות: קבלת חבילות פיילוט, בדיקת סכמה וחתימה, הצגת הבדלים לפני
// מיזוג. חבילה שכבר נטענה לא משנה דבר.

import { useState } from "react";
import { Database, Inbox, RotateCcw } from "lucide-react";
import {
  FileSyncAdapter,
  createBrowserFileIO,
  diffPackage,
  type PackageDiff,
  type PilotPackage,
} from "@sal-ishi/core";
import { Alert, Badge, Button, Dialog, EmptyState, PageHeader, TableWrap, useToast } from "@sal-ishi/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHq } from "../store";

interface Pending {
  pkg: PilotPackage;
  diff: PackageDiff;
  fileName: string;
}

export default function IntakeScreen() {
  const state = useHq((s) => s.state);
  const seed = useHq((s) => s.seed);
  const { merge, loadDemo, reset } = useHq.getState();
  const toast = useToast();
  const [queue, setQueue] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<{ fileName: string; error: string }[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const current = queue[0];

  const receive = async () => {
    const results = await new FileSyncAdapter(createBrowserFileIO()).receivePilotPackages();
    if (!results.length) return;
    const ok: Pending[] = [];
    const bad: { fileName: string; error: string }[] = [];
    for (const r of results) {
      if (r.ok) ok.push({ pkg: r.pkg, fileName: r.fileName, diff: diffPackage(useHq.getState().state, r.pkg) });
      else bad.push({ fileName: r.fileName, error: r.error });
    }
    setErrors(bad);
    setQueue(ok);
    if (bad.length) toast("error", `${bad.length} קבצים לא נקלטו`);
  };

  const next = () => setQueue((q) => q.slice(1));

  const approve = () => {
    if (!current) return;
    try {
      merge(current.pkg);
      toast("success", `החבילה של ${current.pkg.authority} מוזגה`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : String(e));
    }
    // ההבדלים של החבילה הבאה מחושבים מחדש מול המצב המעודכן.
    setQueue((q) => q.slice(1).map((p) => ({ ...p, diff: diffPackage(useHq.getState().state, p.pkg) })));
  };

  return (
    <>
      <PageHeader
        title="קליטת חבילות"
        description="חבילות פיילוט שהגיעו מהשטח. כל חבילה נבדקת (סכמה וחתימת תוכן), ההבדלים מוצגים לפני המיזוג, ושירות מזוהה לפי רשות ומזהה."
        actions={
          <>
            <Button icon={<Inbox size={18} />} onClick={receive}>קליטת חבילות</Button>
            <Button variant="secondary" icon={<Database size={18} />} onClick={() => void loadDemo().then(() => toast("success", "נטענו שתי חבילות הדגמה"))}>
              חבילות הדגמה
            </Button>
            {state.packages.length ? (
              <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={() => setConfirmReset(true)}>איפוס</Button>
            ) : null}
          </>
        }
      />

      {errors.length ? (
        <Alert tone="error" title="קבצים שלא נקלטו" live>
          <ul>{errors.map((e) => <li key={e.fileName}>{e.fileName}: {e.error}</li>)}</ul>
        </Alert>
      ) : null}

      {state.packages.length ? (
        <TableWrap label="חבילות שנקלטו">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">רשות</th>
                <th scope="col">שכונות</th>
                <th scope="col">שירותים</th>
                <th scope="col">יוצאה</th>
                <th scope="col">גרסת בסיס</th>
                <th scope="col">חתימה</th>
              </tr>
            </thead>
            <tbody>
              {state.packages.map((p) => (
                <tr key={p.contentHash}>
                  <th scope="row">{p.authority}</th>
                  <td className="num">{p.neighborhoodIds.length}</td>
                  <td className="num">{state.services.filter((s) => s.authority === p.authority).length}</td>
                  <td>{new Date(p.exportedAt).toLocaleString("he-IL")}</td>
                  <td>
                    {p.seedVersion === seed.meta.version ? (
                      <Badge tone="success">{p.seedVersion}</Badge>
                    ) : (
                      <Badge tone="warning" title={`הגרסה הפעילה במטה: ${seed.meta.version}`}>{p.seedVersion} (שונה מהמטה)</Badge>
                    )}
                  </td>
                  <td dir="ltr" className="num">{p.contentHash.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState icon={<Inbox size={40} />} title="עוד לא נקלטו חבילות">
          קלטו קבצי pilot_package שהגיעו מהרשויות, או טענו שתי חבילות הדגמה סינתטיות.
        </EmptyState>
      )}

      <Dialog open={Boolean(current)} onClose={() => setQueue([])} title={current ? `חבילה מ${current.pkg.authority}` : ""}
        footer={
          current ? (
            <>
              <Button onClick={approve} disabled={current.diff.alreadyLoaded || current.diff.collisions.length > 0}>מיזוג</Button>
              <Button variant="secondary" onClick={next}>דילוג</Button>
            </>
          ) : null
        }
      >
        {current ? <DiffView item={current} activeSeed={seed.meta.version} remaining={queue.length - 1} /> : null}
      </Dialog>

      <ConfirmDialog open={confirmReset} title="איפוס המטה" confirmLabel="איפוס" danger onClose={() => setConfirmReset(false)}
        onConfirm={() => { reset(); setConfirmReset(false); toast("success", "המטה אופס"); }}>
        <p>כל החבילות שנקלטו, ההגדרות ששונו והשינויים שלא פורסמו יימחקו מהדפדפן הזה.</p>
      </ConfirmDialog>
    </>
  );
}

function DiffView({ item, activeSeed, remaining }: { item: Pending; activeSeed: string; remaining: number }) {
  const { diff, pkg } = item;
  return (
    <>
      <p className="muted">
        {item.fileName} | יוצאה {new Date(pkg.exportedAt).toLocaleString("he-IL")} | {pkg.neighborhoods.length} שכונות
        {remaining > 0 ? ` | עוד ${remaining} חבילות בתור` : ""}
      </p>
      {diff.alreadyLoaded ? <Alert tone="info" title="החבילה כבר נקלטה">אותה חתימת תוכן. מיזוג לא ישנה דבר.</Alert> : null}
      {diff.collisions.length ? (
        <Alert tone="error" title="התנגשות מזהים" live>מזהים שכבר שייכים לרשות אחרת: {diff.collisions.join(", ")}. המיזוג חסום.</Alert>
      ) : null}
      {pkg.seedVersion !== activeSeed ? (
        <Alert tone="warning">החבילה נבנתה על גרסת בסיס {pkg.seedVersion}, והגרסה הפעילה במטה היא {activeSeed}. הכללים יחושבו לפי גרסת המטה.</Alert>
      ) : null}
      <div className="row">
        <Badge tone="success">חדשים: {diff.added.length}</Badge>
        <Badge tone="warning">שונו: {diff.changed.length}</Badge>
        <Badge tone="error">הוסרו: {diff.removed.length}</Badge>
        <Badge tone="neutral">ללא שינוי: {diff.unchanged}</Badge>
        <Badge tone="info">ספקים חדשים: {diff.suppliersAdded}, שונו: {diff.suppliersChanged}</Badge>
        <Badge tone="neutral">רשומות פעילות: {diff.activityRows}</Badge>
      </div>
      {diff.changed.length ? (
        <>
          <h3>שירותים ששונו</h3>
          <ul>{diff.changed.map((c) => <li key={c.after.id}>{c.after.name}: {c.fields.join(", ")}</li>)}</ul>
        </>
      ) : null}
      {diff.added.length ? (
        <details>
          <summary>שירותים חדשים ({diff.added.length})</summary>
          <ul>{diff.added.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
        </details>
      ) : null}
      {diff.removed.length ? (
        <>
          <h3>שירותים שיוסרו</h3>
          <ul>{diff.removed.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
        </>
      ) : null}
    </>
  );
}
