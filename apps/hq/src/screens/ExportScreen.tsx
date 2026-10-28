// ייצוא: catalog_export לאינטגרטור לפי export_contract, עם בדיקת סכמה, וקטלוג
// מאושר לכל שכונה עבור הכלי לאזרח.

import { useEffect, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import {
  EXPORT_FORBIDDEN_KEYS,
  FileSyncAdapter,
  buildCatalogExport,
  buildCitizenCatalog,
  createBrowserFileIO,
  findForbiddenKeys,
  validateCatalogExport,
  type CatalogExport,
  type SkippedService,
} from "@sal-ishi/core";
import { Alert, Badge, Button, PageHeader, TableWrap, useToast } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";

export default function ExportScreen() {
  const { state, seed, labels } = useHqAnalysis();
  const toast = useToast();
  const [exp, setExp] = useState<CatalogExport | null>(null);
  const [skipped, setSkipped] = useState<SkippedService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const contract = seed.export_contract;

  useEffect(() => {
    buildCatalogExport(state, seed)
      .then((r) => {
        setExp(r.export);
        setSkipped(r.skipped);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [state, seed]);

  const check = exp
    ? (() => {
        try {
          validateCatalogExport(exp);
          return { ok: true, forbidden: findForbiddenKeys(exp, EXPORT_FORBIDDEN_KEYS) };
        } catch (e) {
          return { ok: false, forbidden: [], message: e instanceof Error ? e.message : String(e) };
        }
      })()
    : null;

  const download = async () => {
    if (!exp) return;
    await new FileSyncAdapter(createBrowserFileIO()).sendIntegratorExport(exp);
    toast("success", `catalog_export ירד: ${exp.services.length} שירותים`);
  };

  const sync = new FileSyncAdapter(createBrowserFileIO());
  const publishNeighborhood = async (id: string) => {
    const { catalog } = buildCitizenCatalog(state, id, seed);
    await sync.publishCitizenCatalog(catalog);
    toast("success", `קטלוג ${catalog.neighborhood.name} ירד: ${catalog.services.length} שירותים מאושרים`);
  };

  return (
    <>
      <PageHeader
        title="ייצוא"
        description={`${contract.name} בגרסה ${contract.version}: החוזה שביטוח לאומי מחזיק, והאינטגרטור מקבל אותו ולא מגדיר אותו. נכנסים רק שירותים בסטטוס ${seed.settings.publish_to_citizen_statuses.join(", ")}.`}
      />

      {error ? <Alert tone="error" title="הייצוא נכשל" live>{error}</Alert> : null}

      <section className="card" aria-labelledby="int-h">
        <div className="card__header">
          <h2 id="int-h">לאינטגרטור</h2>
          <Button icon={<Download size={18} />} disabled={!exp || !check?.ok} onClick={download}>הורדת catalog_export</Button>
        </div>
        {exp && check ? (
          <>
            <div className="row">
              {check.ok ? <Badge tone="success">עובר בדיקת סכמה</Badge> : <Badge tone="error">לא עובר בדיקת סכמה</Badge>}
              {check.forbidden.length ? <Badge tone="error">שדות אסורים: {check.forbidden.length}</Badge> : <Badge tone="success">אין שדות אסורים</Badge>}
              <Badge tone="info">{exp.services.length} שירותים</Badge>
              <Badge tone="neutral">חתימה {exp.contentHash.slice(0, 12)}</Badge>
            </div>
            {"message" in check && check.message ? <Alert tone="error">{check.message}</Alert> : null}
            <p className="muted"><ShieldCheck size={16} aria-hidden="true" /> נבדק אוטומטית שאין בקובץ שדה של תושב, פרטי קשר של ספק, מחיר בשקלים או הערה פנימית.</p>
          </>
        ) : null}
        <div className="grid grid--cards">
          <div>
            <h3>נכלל</h3>
            <ul>{contract.includes.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <h3>לא נכלל</h3>
            <ul>{contract.excludes.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
        {skipped.length ? (
          <Alert tone="warning" title={`${skipped.length} שירותים מאושרים לא נכנסו`}>
            <ul>{skipped.map((s) => <li key={s.serviceId}>{state.services.find((x) => x.id === s.serviceId)?.name ?? s.serviceId}: {s.reason}</li>)}</ul>
          </Alert>
        ) : null}
      </section>

      <section className="card" aria-labelledby="cit-h">
        <h2 id="cit-h">קטלוג לכלי לאזרח</h2>
        <p className="muted">קובץ לכל שכונה עם השירותים המאושרים בלבד. בשלב א' מעלים אותו לאתר הכלי לאזרח, בתיקייה catalog.</p>
        <TableWrap label="קטלוג לפי שכונה">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פיילוט</th>
                <th scope="col">שכונה</th>
                <th scope="col">פרופיל</th>
                <th scope="col">שירותים מאושרים</th>
                <th scope="col"><span className="visually-hidden">הורדה</span></th>
              </tr>
            </thead>
            <tbody>
              {state.neighborhoods.map((n) => {
                const count = exp?.services.filter((s) => s.neighborhoodId === n.id).length ?? 0;
                return (
                  <tr key={n.id}>
                    <td>{n.authority}</td>
                    <th scope="row">{n.name}</th>
                    <td>{labels.community[n.community]}</td>
                    <td className="num">{count}</td>
                    <td>
                      <Button small variant="secondary" disabled={!count} onClick={() => void publishNeighborhood(n.id)} aria-label={`הורדת קטלוג ${n.name}`}>
                        הורדה
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </>
  );
}
