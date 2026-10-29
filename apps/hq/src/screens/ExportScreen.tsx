// ייצוא: תקן קליטת מפעילים (operator_onboarding_standard) לספק העל לפי export_contract, עם בדיקת סכמה, וקטלוג
// מאושר לכל שכונה עבור הכלי לאזרח.

import { useEffect, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import {
  EXPORT_FORBIDDEN_KEYS,
  FileSyncAdapter,
  buildOnboardingStandard,
  buildCitizenCatalog,
  buildCitizenCatalogIndex,
  createBrowserFileIO,
  findForbiddenKeys,
  validateOnboardingStandard,
  type OnboardingStandard,
  type SkippedService,
} from "@sal-ishi/core";
import { Alert, Badge, Button, PageHeader, TableWrap, useToast } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";

export default function ExportScreen() {
  const { state, seed, labels } = useHqAnalysis();
  const toast = useToast();
  const [exp, setExp] = useState<OnboardingStandard | null>(null);
  const [skipped, setSkipped] = useState<SkippedService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const contract = seed.export_contract;

  useEffect(() => {
    buildOnboardingStandard(state, seed)
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
          validateOnboardingStandard(exp);
          return { ok: true, forbidden: findForbiddenKeys(exp, EXPORT_FORBIDDEN_KEYS) };
        } catch (e) {
          return { ok: false, forbidden: [], message: e instanceof Error ? e.message : String(e) };
        }
      })()
    : null;

  const download = async () => {
    if (!exp) return;
    await new FileSyncAdapter(createBrowserFileIO()).sendIntegratorExport(exp);
    toast("success", `תקן קליטת המפעילים ירד: ${exp.services.length} שירותים`);
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
          <Button icon={<Download size={18} />} disabled={!exp || !check?.ok} onClick={download}>הורדת תקן קליטת מפעילים</Button>
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
        <div className="card__header">
          <h2 id="cit-h">קטלוג לכלי המרכזי (אזרח ומלווה)</h2>
          <div className="row">
            <Button small variant="secondary" onClick={() => void sync.publishCitizenCatalogIndex(buildCitizenCatalogIndex(state.neighborhoods, seed)).then(() => toast("success", "index.json ירד"))}>
              הורדת אינדקס
            </Button>
            <Button small variant="secondary" onClick={() => {
              const blob = new Blob([JSON.stringify(seed, null, 1)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "seed.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              toast("success", "seed.json ירד (משקלות ההתאמה וכללי הבחירה)");
            }}>
              הורדת seed.json
            </Button>
          </div>
        </div>
        <p className="muted">
          קובץ לכל שכונה עם השירותים המאושרים, כולל רשותיים, אזוריים והערוץ הארצי, רמת ביקוש ודירוג ספק. בשלב א' מעלים לאתר הכלי המרכזי:
          catalog/index.json, catalog/seed.json, ו-catalog/&lt;רשות&gt;/&lt;שכונה&gt;.json. הכלי קורא אותם בעלייה, ובלעדיהם מציג קטלוג הדגמה.
        </p>
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
                const count = exp?.services.filter((s) => s.neighborhoodId === n.id || s.reach === "national" || ((s.reach === "authority" || s.reach === "regional") && s.authority === n.authority)).length ?? 0;
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
