/**
 * CRM Actions — פעולות מומלצות עם escalation timers
 * Priority grouping, suggested services, action buttons
 */
import { useState } from "react";
import { Clock, Phone, Home, CheckCircle2, AlertTriangle, Sparkles, ChevronLeft, Heart, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { Link } from "react-router-dom";
import { CITIZENS, SERVICES } from "@/data/mockData";
import { MOTIVATION_LABELS } from "@/data/types";
import { toast } from "sonner";

interface Action {
  id: string;
  citizenId: string;
  citizenName: string;
  priority: "high" | "medium" | "low";
  type: string;
  title: string;
  description: string;
  suggestion: string;
  suggestedServices: string[];
  hoursOpen: number;
  escalated: boolean;
  status: "pending" | "in_progress" | "completed";
}

const ACTIONS: Action[] = [
  { id: "a1", citizenId: "c4", citizenName: "רבקה לוי", priority: "high", type: "נסיגה חברתית", title: "רבקה לא בפעילות 21 יום", description: "ביטלה 3 הזמנות. בדידות 5/5. מעורבות 8%. חסמים: בושה, קושי חברתי.", suggestion: "ביקור בית עדין — ללא לחץ. הציעי שיחה קצרה על בישול (המוטיבציה שלה).", suggestedServices: ["s7", "s4"], hoursOpen: 48, escalated: true, status: "pending" },
  { id: "a2", citizenId: "c2", citizenName: "אהרון מזרחי", priority: "high", type: "ירידה קוגניטיבית", title: "אהרון — 14 יום ללא פעילות", description: "ירידה קוגניטיבית אפשרית. מעורבות 18%. לא מגיב לשיחות.", suggestion: "שיחת טלפון + תיאום הערכה תפקודית. שקלי ביקור בית עם בן משפחה.", suggestedServices: ["s10", "s7"], hoursOpen: 72, escalated: true, status: "pending" },
  { id: "a3", citizenId: "c1", citizenName: "שרה רוזנברג", priority: "high", type: "ירידת מעורבות", title: "שרה — ירידה במצב רוח", description: "לא הגיעה למקהלה. אמרה שמרגישה 'לא רלוונטית'. 7 ימים ללא פעילות.", suggestion: "שיחה אישית + הזכרי לה את ההצלחה (3 מפגשים ברצף!). הציעי ליווי למקהלה.", suggestedServices: ["s1", "s9"], hoursOpen: 24, escalated: false, status: "pending" },
  { id: "a4", citizenId: "c6", citizenName: "משה דהן", priority: "medium", type: "ירידת התמדה", title: "משה — ביטל 2 פעילויות ברצף", description: "התמדה ירדה מ-75% ל-60%. ביטל הליכה וקבוצת תפילה.", suggestion: "בירור סיבה — אולי בעיית ניידות? הצע התאמת לוח זמנים.", suggestedServices: ["s5", "s2"], hoursOpen: 36, escalated: false, status: "in_progress" },
  { id: "a5", citizenId: "c3", citizenName: "יוסף כהן", priority: "low", type: "חיזוק", title: "יוסף — ציון דרך: 4 פעילויות השבוע!", description: "מעורבות 78%, התמדה 85%. מתפקד מצוין.", suggestion: "שלחי nudge חיזוק + שקלי להציע לו תפקיד מנטור לאזרחים חדשים.", suggestedServices: [], hoursOpen: 0, escalated: false, status: "pending" },
];

export default function CoordinatorActions() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [actions, setActions] = useState(ACTIONS);

  const filtered = filter === "all" ? actions : actions.filter((a) => a.priority === filter);
  const pendingHigh = actions.filter((a) => a.priority === "high" && a.status === "pending").length;

  const markDone = (id: string) => {
    setActions(actions.map((a) => a.id === id ? { ...a, status: "completed" as const } : a));
    toast.success("פעולה סומנה כהושלמה ✓");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> פעולות מומלצות
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{actions.filter((a) => a.status === "pending").length} פעולות ממתינות • {pendingHigh} דחופות</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {([["all", "הכל"], ["high", "דחוף"], ["medium", "חשוב"], ["low", "מומלץ"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={cn("px-4 py-2 rounded-full text-xs font-semibold transition-colors", filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
            {label} {key !== "all" && `(${actions.filter((a) => a.priority === key).length})`}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filtered.map((action) => {
          const citizen = CITIZENS.find((c) => c.id === action.citizenId);
          const services = action.suggestedServices.map((sid) => SERVICES.find((s) => s.id === sid)).filter(Boolean);
          const borderColor = action.priority === "high" ? "border-r-destructive" : action.priority === "medium" ? "border-r-warning" : "border-r-success";

          return (
            <div key={action.id} className={cn("libi-card p-5 border-r-4", borderColor, action.status === "completed" && "opacity-50")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {citizen && <Avatar name={citizen.name} size={40} tone={action.priority === "high" ? "warm" : "default"} />}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Chip tone={action.priority === "high" ? "destructive" : action.priority === "medium" ? "warning" : "success"}>
                        {action.priority === "high" ? "דחוף" : action.priority === "medium" ? "חשוב" : "מומלץ"}
                      </Chip>
                      <Chip tone="muted">{action.type}</Chip>
                      {action.escalated && <Chip tone="destructive">⚡ הוסלם</Chip>}
                      {action.hoursOpen > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {action.hoursOpen} שעות פתוח
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-bold text-foreground">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>

                    {/* Suggestion */}
                    <div className="mt-3 p-3 bg-info-soft rounded-lg border border-info/10">
                      <p className="text-xs text-info font-medium">{action.suggestion}</p>
                    </div>

                    {/* Suggested Services */}
                    {services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {services.map((s) => s && (
                          <span key={s.id} className="text-[11px] px-2.5 py-1 rounded-lg bg-primary-soft text-primary font-medium flex items-center gap-1">
                            {s.emoji} {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link to={`/coordinator/patients/${action.citizenId}`} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors" aria-label="פרופיל">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <button className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="שיחה">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-info/10 text-info flex items-center justify-center hover:bg-info hover:text-white transition-colors" aria-label="ביקור">
                    <Home className="w-4 h-4" />
                  </button>
                  <button onClick={() => markDone(action.id)} className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-success-foreground transition-colors" aria-label="בוצע">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
