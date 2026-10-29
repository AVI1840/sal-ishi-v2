// רשימת ההשלמות לגרסה 0.4: שירותים מגרסה קודמת שחסרים להם שדות של מודל
// התשלום. שום שדה לא מתמלא לבד: ההצעה מוצגת, והמשתמש מחליט אם להחיל אותה.

import { ClipboardCheck, Pencil } from "lucide-react";
import { SERVICE_MODE_LABELS, migrationGaps, type Service, type ServiceMode } from "@sal-ishi/core";
import { Alert, Badge, Button, TableWrap, useToast } from "@sal-ishi/ui";
import { workflowTone } from "../analysis";
import { useField } from "../store";

const isMode = (v: unknown): v is ServiceMode => typeof v === "string" && v in SERVICE_MODE_LABELS;

export function CompletionPanel(props: { onEdit: (s: Service) => void }) {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const upsertService = useField((s) => s.upsertService);
  const toast = useToast();
  const gaps = migrationGaps(data.services, seed);
  if (!gaps.length) return null;

  const byId = new Map(data.services.map((s) => [s.id, s]));
  const missing = gaps.filter((g) => g.gaps.length);
  const apply = (s: Service, patch: Partial<Service>, what: string) => {
    upsertService({ ...s, ...patch });
    toast("success", `${s.name}: ${what}`);
  };

  return (
    <section className="card" aria-labelledby="completion-h">
      <div className="card__header">
        <h2 id="completion-h" className="row" style={{ margin: 0 }}>
          <ClipboardCheck size={22} aria-hidden="true" />
          דורשים השלמה לגרסה 0.4
        </h2>
        <Badge tone={missing.length ? "warning" : "info"}>
          {missing.length ? `${missing.length} שירותים חסרים נתונים` : ""}
          {missing.length && gaps.length > missing.length ? ", " : ""}
          {gaps.length > missing.length ? `${gaps.length - missing.length} הצעות` : ""}
        </Badge>
      </div>
      <Alert tone="info">
        מודל התשלום של החשכ"ל מוסיף שדות לכל שירות. הנתונים הקיימים נשמרו כמו שהם. עד ההשלמה השירות מסומן "חסרים נתונים" ולא נכנס לתקן קליטת המפעילים. במוצרים אין צורך בשעות ובאופן מתן.
      </Alert>
      <details open={gaps.length <= 8}>
        <summary>רשימת השירותים ({gaps.length})</summary>
      <TableWrap label="שירותים שדורשים השלמה">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">שירות</th>
              <th scope="col">סטטוס</th>
              <th scope="col">מה חסר</th>
              <th scope="col">הצעה לאישור</th>
              <th scope="col"><span className="visually-hidden">פעולות</span></th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((g) => {
              const s = byId.get(g.serviceId)!;
              const modeGap = g.gaps.find((x) => x.field === "serviceMode");
              const suggestedMode = isMode(modeGap?.suggestion) ? modeGap.suggestion : null;
              return (
                <tr key={g.serviceId}>
                  <th scope="row">{g.name}</th>
                  <td><Badge tone={workflowTone(g.status)}>{g.status}</Badge></td>
                  <td>{g.gaps.length ? g.gaps.map((x) => x.label).join(", ") : <span className="muted">אין</span>}</td>
                  <td>
                    <div className="stack" style={{ gap: "var(--spacing-2)" }}>
                      {suggestedMode ? (
                        <Button small variant="secondary" onClick={() => apply(s, { serviceMode: suggestedMode }, `אופן מתן ${SERVICE_MODE_LABELS[suggestedMode]}`)}>
                          אופן מתן: {SERVICE_MODE_LABELS[suggestedMode]}
                        </Button>
                      ) : null}
                      {g.suggestGate ? (
                        <Button small variant="secondary" onClick={() => apply(s, { gatedByCompanion: true, gateReason: g.suggestGate! }, "סומן כנפתח באישור מלווה")}>
                          לסמן: נפתח באישור מלווה
                        </Button>
                      ) : null}
                      {g.suggestGate ? <span className="muted">{g.suggestGate}</span> : null}
                      {!suggestedMode && !g.suggestGate ? <span className="muted">אין הצעה, צריך להזין</span> : null}
                    </div>
                  </td>
                  <td>
                    <Button small variant="ghost" icon={<Pencil size={16} />} aria-label={`עריכת ${g.name}`} onClick={() => props.onEdit(s)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
      </details>
    </section>
  );
}
