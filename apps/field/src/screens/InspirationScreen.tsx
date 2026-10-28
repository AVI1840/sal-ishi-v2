// השראה: ספריית סוגי השירות עם נתוני ירושלים המצטברים. סינון לפי קטגוריה,
// פורמט, ניסיון בירושלים והתאמה קהילתית, והוספה ישירה לקטלוג.

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { formatCount, type Community, type Service } from "@sal-ishi/core";
import { Alert, Badge, Button, EmptyState, PageHeader, SelectField, TextField } from "@sal-ishi/ui";
import { ServiceForm } from "../components/ServiceForm";
import { useAnalysis } from "../analysis";
import { useField } from "../store";

export default function InspirationScreen() {
  const seed = useField((s) => s.seed);
  const data = useField((s) => s.data);
  const { idx, labels } = useAnalysis();
  const [category, setCategory] = useState("");
  const [format, setFormat] = useState("");
  const [tried, setTried] = useState("");
  const [community, setCommunity] = useState<Community | "">("");
  const [query, setQuery] = useState("");
  const [prefill, setPrefill] = useState<Partial<Service> | null>(null);

  const formats = [...new Set(seed.service_types.map((t) => t.format))].sort();
  const profile = seed.community_profiles.find((p) => p.id === community);
  const requirements = (profile?.service_requirements as string[] | undefined) ?? [];

  const types = useMemo(() => {
    const q = query.trim();
    return seed.service_types.filter((t) => {
      if (category && t.category !== category) return false;
      if (format && t.format !== format) return false;
      if (tried === "yes" && t.jerusalem.tried !== "כן") return false;
      if (tried === "no" && t.jerusalem.tried === "כן") return false;
      if (q && !`${t.name} ${t.note ?? ""}`.includes(q)) return false;
      return true;
    });
  }, [seed, category, format, tried, query]);

  // כמה שירותים כבר יש בקטלוג מכל סוג, ובפרופיל הקהילתי שנבחר.
  const inCatalog = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of data.services) {
      if (community && !s.communityFit.includes(community)) continue;
      m.set(s.serviceTypeId, (m.get(s.serviceTypeId) ?? 0) + 1);
    }
    return m;
  }, [data.services, community]);

  return (
    <>
      <PageHeader
        title="השראה"
        description={`ספריית ${seed.service_types.length} סוגי שירות, עם מה שנוסה בפיילוט ירושלים (נתונים מצטברים בלבד). בחרו סוג והוסיפו אותו לקטלוג של שכונה.`}
      />

      <section className="card" aria-labelledby="filters-h">
        <h2 id="filters-h" className="visually-hidden">סינון</h2>
        <div className="grid grid--form">
          <TextField label="חיפוש" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <SelectField label="קטגוריה" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="כל הקטגוריות"
            options={seed.categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))} />
          <SelectField label="פורמט" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="כל הפורמטים"
            options={formats.map((f) => ({ value: f, label: f }))} />
          <SelectField label="נוסה בירושלים" value={tried} onChange={(e) => setTried(e.target.value)} placeholder="הכל"
            options={[{ value: "yes", label: "נוסה" }, { value: "no", label: "לא נוסה" }]} />
          <SelectField label="התאמה קהילתית" value={community} onChange={(e) => setCommunity(e.target.value as Community | "")} placeholder="כל הפרופילים"
            options={seed.community_profiles.map((p) => ({ value: p.id, label: p.name }))} />
        </div>
        {requirements.length ? (
          <Alert tone="info" title={`דרישות לשירות בפרופיל ${profile?.name}`}>
            <ul>{requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          </Alert>
        ) : null}
      </section>

      <p role="status" aria-live="polite" className="muted">{types.length} סוגי שירות</p>

      {types.length ? (
        <ul className="grid grid--cards plain-list">
          {types.map((t) => {
            const cat = idx.categories.get(t.category);
            const outside = cat?.layer === "בחוץ" || (t.note ?? "").startsWith("בחוץ");
            const count = inCatalog.get(t.id) ?? 0;
            return (
              <li key={t.id} className="card type-card">
                <div className="card__header">
                  <h3>{t.name}</h3>
                  <span className="muted">{t.id}</span>
                </div>
                <p className="muted">{t.category} {cat?.name} | {t.format} | יחידה: {t.unit} | {t.scope}</p>
                <div className="row">
                  {outside ? <Badge tone="error">מחוץ לסל</Badge> : null}
                  {cat?.layer === "איכות חיים" || cat?.layer === "בתנאים" ? <Badge tone="info">איכות חיים</Badge> : null}
                  {t.jerusalem.tried === "כן" ? (
                    <Badge tone="success">נוסה בירושלים</Badge>
                  ) : t.jerusalem.tried === "לא" ? (
                    <Badge tone="neutral">לא נוסה</Badge>
                  ) : (
                    <Badge tone="warning">{t.jerusalem.tried}</Badge>
                  )}
                  {count ? <Badge tone="info">בקטלוג שלי: {count}{community ? ` (${labels.community[community]})` : ""}</Badge> : null}
                </div>
                {t.jerusalem.tried === "כן" ? (
                  <dl className="facts">
                    <div><dt>שירותים בירושלים</dt><dd>{formatCount(t.jerusalem.services, seed.settings)}</dd></div>
                    <div><dt>משתתפים</dt><dd>{formatCount(t.jerusalem.participants, seed.settings)}</dd></div>
                  </dl>
                ) : null}
                {t.note ? <p>{t.note}</p> : null}
                <Button
                  variant="secondary"
                  small
                  icon={<Plus size={16} />}
                  disabled={outside || !data.neighborhoods.length}
                  aria-label={`הוספת ${t.name} לקטלוג`}
                  onClick={() => setPrefill({ serviceTypeId: t.id, ...(community ? { communityFit: [community] } : {}) })}
                >
                  הוספה לקטלוג
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="אין סוגי שירות שמתאימים לסינון">נסו להסיר חלק מהמסננים.</EmptyState>
      )}

      <ServiceForm open={Boolean(prefill)} prefill={prefill ?? undefined} onClose={() => setPrefill(null)} />
    </>
  );
}
