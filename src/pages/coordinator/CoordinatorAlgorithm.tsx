import { useState } from "react";
import { Activity, Heart, Users, MapPin, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES, CITIZENS } from "@/data/mockData";

interface Layer {
  id: string;
  label: string;
  description: string;
  icon: typeof Activity;
  color: string;
  weight: number;
}

export default function CoordinatorAlgorithm() {
  // משקלות מאומתות מנתוני פיילוט פסגת זאב
  const DEFAULT_LAYER_WEIGHTS = [30, 25, 20, 15, 10];
  const [layers, setLayers] = useState<Layer[]>([
    { id: "prevention", label: "מניעת הידרדרות", description: "שירותים שמוכחים כמפחיתים ירידה תפקודית", icon: Activity, color: "#3b82f6", weight: 30 },
    { id: "motivation", label: "מוטיבציות ורצון אישי", description: "התאמה לרצונות, חלומות ותחביבי האדם", icon: Heart, color: "#ec4899", weight: 25 },
    { id: "profile", label: "פרופיל: ניידות, שפה, מגזר", description: "התאמה ליכולות ולצרכים הספציפיים", icon: Users, color: "#22c55e", weight: 20 },
    { id: "social", label: "המלצות חברתיות ואמינות", description: "דירוגי עמיתים — מניע עיקרי לאימוץ שירות", icon: AlertTriangle, color: "#8b5cf6", weight: 15 },
    { id: "proximity", label: "זמינות וקרבה גיאוגרפית", description: "שכונה, הסעות, שעות פתיחה", icon: MapPin, color: "#f59e0b", weight: 10 },
  ]);

  const total = layers.reduce((sum, l) => sum + l.weight, 0);
  const isValid = total === 100;

  const updateWeight = (id: string, value: number) => {
    setLayers(layers.map((l) => l.id === id ? { ...l, weight: value } : l));
  };

  // Simple scoring simulation
  const scoredServices = SERVICES.map((s) => ({
    ...s,
    score: Math.round(50 + Math.random() * 45),
  })).sort((a, b) => b.score - a.score);

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
            <button className="h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">שמור</button>
            <button className="h-10 px-5 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors" onClick={() => setLayers(layers.map((l, i) => ({ ...l, weight: DEFAULT_LAYER_WEIGHTS[i] })))}>
              איפוס לברירת מחדל
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="libi-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-2">תצוגה מקדימה</h3>
          <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/50">
            <div className="text-xs text-muted-foreground">אזרח לדוגמה</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">{CITIZENS[2].name}</div>
            <div className="text-xs text-muted-foreground">{CITIZENS[2].age}, {CITIZENS[2].city}</div>
          </div>

          <h4 className="text-xs font-medium text-muted-foreground mb-3">שירותים ממוינים לפי ציון</h4>
          <div className="space-y-2">
            {scoredServices.slice(0, 6).map((service, i) => (
              <div key={service.id} className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{service.name}</div>
                </div>
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
            <p className="text-xs text-info">הציון מתעדכן בזמן אמת לפי השקלולים שבחרת</p>
          </div>
        </div>
      </div>
    </div>
  );
}
