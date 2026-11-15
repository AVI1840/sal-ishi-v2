import { useMemo, useState } from "react";
import { catalogState } from "@/data/catalogSource";
import { Activity, Heart, Users, MapPin, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { servicesFor } from "@/pilot/services";

interface Layer {
  id: string;
  label: string;
  description: string;
  icon: typeof Activity;
  color: string;
  weight: number;
}

export default function CoordinatorAlgorithm() {
  // ברירת המחדל מההגדרות (seed 0.4, תוספת 3): מניעה 30, רצון 30, התאמה ליכולות 25, זמינות 15, המלצות 0.
  const w = catalogState.seed.settings.matching_weights as Record<string, number>;
  const pct = (k: string) => Math.round((w[k] ?? 0) * 100);
  const DEFAULT_LAYER_WEIGHTS = [pct("prevention"), pct("motivation"), pct("profileFit"), pct("socialProof"), pct("proximity")];
  const [layers, setLayers] = useState<Layer[]>([
    { id: "prevention", label: "מניעת הידרדרות", description: "שירותים שמוכחים כמפחיתים ירידה תפקודית", icon: Activity, color: "#3b82f6", weight: pct("prevention") },
    { id: "motivation", label: "מוטיבציות ורצון אישי", description: "התאמה לרצונות, חלומות ותחביבי האדם", icon: Heart, color: "#ec4899", weight: pct("motivation") },
    { id: "profile", label: "פרופיל: ניידות, שפה, מגזר", description: "התאמה ליכולות ולצרכים הספציפיים", icon: Users, color: "#22c55e", weight: pct("profileFit") },
    { id: "social", label: "המלצות וניסיון", description: "מגיע מספק העל. 0 עד שיהיו נתוני ניסיון", icon: AlertTriangle, color: "#8b5cf6", weight: pct("socialProof") },
    { id: "proximity", label: "זמינות וקרבה גיאוגרפית", description: "שכונה, הסעות, שעות פתיחה", icon: MapPin, color: "#f59e0b", weight: pct("proximity") },
  ]);

  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  const isValid = total === 100;

  const updateWeight = (id: string, value: number) => {
    setLayers(layers.map((l) => l.id === id ? { ...l, weight: value } : l));
  };

  // תצוגה מקדימה אמיתית: מנוע ההתאמה עצמו, על הקטלוג של השכונה, עם המשקלות שבסליידרים.
  // ההשוואה היא מול המשקלות שהוכרעו בהגדרות (30/30/25/15/0).
  const [personaIdx, setPersonaIdx] = useState(0);
  const persona = CITIZENS[personaIdx];
  const weightsOf = (ls: { id: string; weight: number }[]) => {
    const get = (id: string) => (ls.find((l) => l.id === id)?.weight ?? 0) / 100;
    return { prevention: get("prevention"), motivation: get("motivation"), profileFit: get("profile"), socialProof: get("social"), proximity: get("proximity") };
  };
  const ids = useMemo(() => new Set(servicesFor(persona.neighborhood).map((x) => x.id)), [persona.neighborhood]);
  const rankWith = (weights: ReturnType<typeof weightsOf>) => matchServicesForCitizen(persona, { topN: 500, minScore: 0, weights }).filter((r) => ids.has(r.service.id));
  const baseline = useMemo(() => {
    const def = { prevention: w.prevention ?? 0, motivation: w.motivation ?? 0, profileFit: w.profileFit ?? 0, socialProof: w.socialProof ?? 0, proximity: w.proximity ?? 0 };
    return new Map(rankWith(def).map((r, i) => [r.service.id, i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, ids]);
  const scoredServices = rankWith(weightsOf(layers)).slice(0, 8).map((r, i) => ({ id: r.service.id, name: r.service.name, score: Math.round(r.totalScore), move: (baseline.get(r.service.id) ?? i) - i }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> אלגוריתם התאמה
        </h1>
        <p className="text-sm text-muted-foreground mt-1">כוונון משקלות ההתאמה בין שירותים לאזרחים</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-2 libi-card p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">5 שכבות התאמה</h3>
            <div className={cn("px-3 py-1 rounded-full text-xs font-semibold", isValid ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive")}>
              {isValid ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> סך הכל 100%</span> : `סך הכל ${total}%`}
            </div>
          </div>

          {layers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${layer.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{layer.label}</div>
                    <div className="text-xs text-muted-foreground">{layer.description}</div>
                  </div>
                  <div className="text-lg font-bold text-foreground tabular-nums w-12 text-left">{layer.weight}%</div>
                </div>
                <input
                  type="range"
                  aria-label={`משקל: ${layer.label}`}
                  min={0}
                  max={50}
                  value={layer.weight}
                  onChange={(e) => updateWeight(layer.id, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: layer.color }}
                />
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${layer.weight * 2}%`, backgroundColor: layer.color }} />
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-4 border-t border-border">
            <button className="h-10 px-5 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors" onClick={() => setLayers(layers.map((l, i) => ({ ...l, weight: DEFAULT_LAYER_WEIGHTS[i] })))}>
              איפוס לברירת מחדל
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="libi-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-2">תצוגה מקדימה</h3>
          <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/50">
            <label className="text-xs text-muted-foreground" htmlFor="persona">אזרח לדוגמה (הדמויות של ההדגמה)</label>
            <select id="persona" value={personaIdx} onChange={(e) => setPersonaIdx(Number(e.target.value))} className="mt-1 w-full min-h-[40px] rounded-lg border border-border bg-white px-2 text-sm">
              {CITIZENS.slice(0, 3).map((c, i) => (
                <option key={c.id} value={i}>{c.name}, {c.age}, {c.neighborhood}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground mt-1">החלום: {persona.dream}</div>
          </div>

          <h4 className="text-xs font-medium text-muted-foreground mb-3">8 הראשונים בקטלוג של {persona.neighborhood}, מהמנוע</h4>
          <div className="space-y-2">
            {scoredServices.slice(0, 6).map((service, i) => (
              <div key={service.id} className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{service.name}</div>
                </div>
                {service.move !== 0 ? (
                  <span className={cn("text-[11px] font-bold tabular-nums", service.move > 0 ? "text-success" : "text-destructive")} aria-label={service.move > 0 ? `עלה ${service.move} מקומות` : `ירד ${-service.move} מקומות`}>
                    {service.move > 0 ? `+${service.move}` : service.move}
                  </span>
                ) : null}
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${service.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground tabular-nums w-8">{service.score}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-info-soft rounded-lg border border-info/20">
            <p className="text-xs text-info">אותו מנוע שהאזרח והמלווה רואים. הסימון +/- הוא השינוי במקום מול המשקלות שהוכרעו. השינוי כאן להדגמה בלבד: המשקלות נקבעים בהגדרות, באטלס המטה.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
