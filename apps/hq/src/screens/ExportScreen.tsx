// ייצוא: תקן קליטת מפעילים (operator_onboarding_standard 1.1) לספק העל לפי
// export_contract, עם בדיקת סכמה ו-JSON Schema להורדה, וקטלוג מאושר לכל שכונה
// עבור הכלי לאזרח.

import { useEffect, useState } from "react";
import { Download, FileJson, ShieldCheck } from "lucide-react";
// ה-JSON Schema נגזר מהסכמה בקוד (packages/core/scripts), ובדיקה בליבה מוודאת שהוא מעודכן.
import onboardingSchemaText from "../../../../schema/operator_onboarding_standard_1.2.schema.json?raw";
import {
  EXPORT_FORBIDDEN_KEYS,
  FileSyncAdapter,
  HOSPITALIZATION_TEXT,
  SERVICE_MODE_LABELS,
  isPublishable,
  servesNeighborhood,
  buildOnboardingStandard,
  buildCitizenCatalog,
  buildCitizenCatalogIndex,
  createBrowserFileIO,
  findForbiddenKeys,
  validateOnboardingStandard,
  type OnboardingStandard,
  type SkippedService,
} from "@sal-ishi/core";
import { Alert, Badge, Button, PageHeader, TableWrap, downloadBytes, useToast } from "@sal-ishi/ui";

const QOL_LABEL: Record<string, string> = { fixed_amount: "סכום קבוע מהנקודות", percent: "אחוז השתתפות" };
const REF_LABEL: Record<string, string> = { monitor: "מעקב", binding: "מחייב בהיקף שנבחר", preactivated_low_competition: "מחייב בתחרות נמוכה" };
const BASIS_LABEL: Record<string, string> = { tier: "דרגת השתתפות", qol_fixed: "איכות חיים, סכום קבוע", qol_percent: "איכות חיים, אחוז", reference_binding: "מחיר ייחוס מחייב" };
const pts = (n: number | null) => (n === null ? "טרם נקבע" : n.toLocaleString("he-IL", { maximumFractionDigits: 2 }));
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
        description={`תקן קליטת המפעילים, גרסה ${contract.version}: התקן שביטוח לאומי מחזיק. ספק העל מקבל אותו ולא מגדיר אותו, ומפעיל לפיו נקודות, ביטולים ונוכחות. נכנסים רק שירותים בסטטוס ${seed.settings.publish_to_citizen_statuses.join(", ")} שיש להם את כל שדות מודל התשלום.`}
      />

      {error ? <Alert tone="error" title="הייצוא נכשל" live>{error}</Alert> : null}

      <section className="card" aria-labelledby="int-h">
        <div className="card__header">
          <h2 id="int-h">לספק העל: תקן קליטת מפעילים</h2>
          <div className="row">
            <Button icon={<Download size={18} />} disabled={!exp || !check?.ok} onClick={download}>הורדת תקן קליטת מפעילים</Button>
            <Button
              variant="secondary"
              icon={<FileJson size={18} />}
              onClick={() => {
                downloadBytes("operator_onboarding_standard_1.2.schema.json", new TextEncoder().encode(onboardingSchemaText), "application/schema+json");
                toast("success", "ה-JSON Schema ירד");
              }}
            >
              הורדת JSON Schema
            </Button>
          </div>
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
            <p className="muted"><ShieldCheck size={16} aria-hidden="true" /> נבדק אוטומטית שאין בקובץ שדה של תושב, פרטי קשר של ספק, מחיר בשקלים או הערה פנימית. אותה בדיקה רצה מול ה-JSON Schema בבדיקות הליבה.</p>
            <dl className="terms__list" aria-label="הכללים שהייצוא חושב לפיהם">
              <div className="terms__row"><dt>איכות חיים</dt><dd>{QOL_LABEL[exp.rules.qolMode] ?? exp.rules.qolMode}</dd></div>
              <div className="terms__row"><dt>מחיר ייחוס</dt><dd>{REF_LABEL[exp.rules.referencePriceMode] ?? exp.rules.referencePriceMode}</dd></div>
              <div className="terms__row"><dt>נקודה</dt><dd>{1 / exp.rules.pointsPerShekel} ש"ח</dd></div>
              <div className="terms__row"><dt>תקרת מוצרים</dt><dd>{exp.rules.productsQuarterlyCapPoints} נקודות ברבעון</dd></div>
              <div className="terms__row"><dt>משתתף פעיל</dt><dd>לפחות {exp.rules.activeParticipantMinSessionsMonth} מפגשים בחודש</dd></div>
            </dl>
            <details>
              <summary>השירותים בייצוא ({exp.services.length})</summary>
              <TableWrap label="שירותים בתקן קליטת המפעילים">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">שירות</th>
                      <th scope="col">פיילוט</th>
                      <th scope="col">אופן מתן</th>
                      <th scope="col">שעות ליחידה</th>
                      <th scope="col">נקודות לשעה</th>
                      <th scope="col">ביטול</th>
                      <th scope="col">אי-הגעה</th>
                      <th scope="col">אשפוז</th>
                      <th scope="col">מהארנק / על הקשיש</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exp.services.map((s) => (
                      <tr key={s.serviceId}>
                        <th scope="row">{s.name}{s.gatedByCompanion ? <div><Badge tone="info">באישור מלווה</Badge></div> : null}</th>
                        <td>{s.authority}</td>
                        <td>{s.serviceMode ? SERVICE_MODE_LABELS[s.serviceMode] : "מוצר"}{s.capacityLimited ? <div className="muted">מוגבל מקום</div> : null}</td>
                        <td className="num">{s.hoursPerUnit ?? "-"}</td>
                        <td className="num">{s.pointsPerHour === null ? "-" : pts(s.pointsPerHour)}</td>
                        <td>{s.serviceMode ? (s.cancellationNoticeHours === null ? "טרם נקבע" : `${s.cancellationNoticeHours} שעות`) : "-"}</td>
                        <td>{s.noShowCharged === null ? "-" : s.noShowCharged ? "מחויבת" : "לא מחויבת"}</td>
                        <td>{s.hospitalizationRefund ? (HOSPITALIZATION_TEXT[s.hospitalizationRefund] ?? s.hospitalizationRefund) : "-"}</td>
                        <td>{pts(s.coveredPoints)} / {pts(s.copayPoints)}<div className="muted">{BASIS_LABEL[s.copayBasis]}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </details>
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
          <Alert tone="warning" title={`${skipped.length} שירותים מאושרים לא נכנסו. שירות שדורש השלמה נשלם בשטח ומגיע בחבילה הבאה`}>
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
                // הקטלוג לאזרח כולל גם שירות מאושר שעוד דורש השלמה (עם ערכים חסרים), ולכן נספר מהשירותים ולא מהייצוא.
                const count = state.services.filter((s) => isPublishable(s, seed.settings) && servesNeighborhood(s, n)).length;
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
