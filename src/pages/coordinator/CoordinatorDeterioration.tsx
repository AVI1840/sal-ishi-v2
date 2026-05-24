/**
 * דשבורד הידרדרות — Risk Detection
 * זיהוי ירידה במעורבות, withdrawal חברתי, ביטולים
 */
import { AlertTriangle, TrendingDown, Users, Clock, Phone, Home, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { CITIZENS, RISK_ALERTS } from "@/data/mockData";
import { Link } from "react-router-dom";

const RISK_SIGNAL_LABELS: Record<string, string> = {
  activity_drop: "ירידה בפעילות",
  absence: "היעדר השתתפות",
  loneliness_increase: "החמרת בדידות",
  mood_decline: "ירידת מצב רוח",
  social_withdrawal: "נסיגה חברתית",
  low_persistence: "חוסר התמדה",
  cancellations: "ביטולי שירותים",
  deterioration_risk: "סיכון להידרדרות",
};

export default function CoordinatorDeterioration() {
  const criticalCitizens = CITIZENS.filter((c) => c.riskLevel === "critical");
  const highRiskCitizens = CITIZENS.filter((c) => c.riskLevel === "high");
  const unresolvedAlerts = RISK_ALERTS.filter((a) => !a.resolved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-destructive" /> דשבורד הידרדרות
        </h1>
        <p className="text-sm text-muted-foreground mt-1">זיהוי מוקדם של ירידה במעורבות וסיכון להידרדרות</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="libi-stat-card border-r-4 border-r-destructive">
          <div className="text-2xl font-bold text-destructive">{criticalCitizens.length}</div>
          <div className="text-sm text-foreground mt-0.5">סיכון קריטי</div>
          <div className="text-xs text-muted-foreground mt-1">דורשים התערבות מיידית</div>
        </div>
        <div className="libi-stat-card border-r-4 border-r-warning">
          <div className="text-2xl font-bold text-warning-foreground">{highRiskCitizens.length}</div>
          <div className="text-sm text-foreground mt-0.5">סיכון גבוה</div>
          <div className="text-xs text-muted-foreground mt-1">דורשים מעקב</div>
        </div>
        <div className="libi-stat-card border-r-4 border-r-info">
          <div className="text-2xl font-bold text-info">{unresolvedAlerts.length}</div>
          <div className="text-sm text-foreground mt-0.5">התראות פתוחות</div>
          <div className="text-xs text-muted-foreground mt-1">ממתינות לטיפול</div>
        </div>
        <div className="libi-stat-card border-r-4 border-r-muted-foreground">
          <div className="text-2xl font-bold text-foreground">{CITIZENS.filter((c) => c.lastActivityDays > 7).length}</div>
          <div className="text-sm text-foreground mt-0.5">לא פעילים 7+ ימים</div>
          <div className="text-xs text-muted-foreground mt-1">צריכים nudge</div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="libi-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" /> התראות פעילות
        </h3>
        <div className="space-y-3">
          {unresolvedAlerts.map((alert) => (
            <div key={alert.id} className={cn("p-4 rounded-xl border", alert.severity === "critical" ? "border-destructive/30 bg-destructive-soft/20" : "border-warning/30 bg-warning-soft/20")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", alert.severity === "critical" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground")}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-foreground">{alert.citizenName}</h4>
                      <Chip tone={alert.severity === "critical" ? "destructive" : "warning"}>
                        {RISK_SIGNAL_LABELS[alert.signal]}
                      </Chip>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-info mt-2 font-medium">💡 {alert.suggestedAction}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.detectedAt}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link to={`/coordinator/patients/${alert.citizenId}`} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors" aria-label="צפה">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <button className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="שיחה">
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-success-foreground transition-colors" aria-label="טופל">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* At-Risk Citizens Table */}
      <div className="libi-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-warning-foreground" /> אזרחים בסיכון — מיון לפי חומרה
        </h3>
        <div className="space-y-2">
          {[...criticalCitizens, ...highRiskCitizens].map((citizen) => (
            <Link
              key={citizen.id}
              to={`/coordinator/patients/${citizen.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <Avatar name={citizen.name} size={40} tone={citizen.riskLevel === "critical" ? "warm" : "default"} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{citizen.name}</div>
                <div className="text-xs text-muted-foreground">{citizen.age} • {citizen.neighborhood}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center shrink-0">
                <div>
                  <div className="text-[10px] text-muted-foreground">מעורבות</div>
                  <div className={cn("text-sm font-bold", citizen.engagementScore < 30 ? "text-destructive" : "text-warning-foreground")}>{citizen.engagementScore}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">בדידות</div>
                  <div className={cn("text-sm font-bold", citizen.loneliness >= 4 ? "text-destructive" : "text-warning-foreground")}>{citizen.loneliness}/5</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">ימים</div>
                  <div className={cn("text-sm font-bold", citizen.lastActivityDays > 7 ? "text-destructive" : "text-foreground")}>{citizen.lastActivityDays}</div>
                </div>
              </div>
              <Chip tone={citizen.riskLevel === "critical" ? "destructive" : "warning"}>
                {citizen.riskLevel === "critical" ? "קריטי" : "גבוה"}
              </Chip>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
