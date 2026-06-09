/**
 * פרופיל מטופל עשיר — מנוע חיזוק חיים אישי
 * Timeline טיפולי + מעגל חוזקות + תוכנית אישית + Nudges + Risk
 */
import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowRight, Phone, Heart, Activity, Target, AlertTriangle, Sparkles,
  Clock, MessageCircle, CheckCircle2, Calendar, User,
  Brain, Shield, Scale, Leaf,            // VIA strength icons
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SubsidyBadge } from "@/components/shared/SubsidyBadge";
import { CITIZENS, TIMELINE_EVENTS, NUDGES, AI_RECOMMENDATIONS } from "@/data/mockData";
import { MOTIVATION_LABELS, BARRIER_LABELS, STRENGTH_LABELS, READINESS_LABELS } from "@/data/types";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Strength colors for radar
const STRENGTH_COLORS: Record<string, string> = {
  wisdom: "#3b82f6", courage: "#ef4444", justice: "#f59e0b",
  transcendence: "#8b5cf6", temperance: "#22c55e", humanity: "#ec4899",
};

export default function CoordinatorPatientDetail() {
  const { id } = useParams();
  const citizen = CITIZENS.find((c) => c.id === id) || CITIZENS[0];
  const timeline = TIMELINE_EVENTS.filter((e) => e.citizenId === citizen.id);
  const nudges = NUDGES.filter((n) => n.citizenId === citizen.id);
  const recommendations = AI_RECOMMENDATIONS.filter((r) => r.citizenId === citizen.id);

  // Level-2 wallet model — 32 יחידות / 775₪ (consistent with CitizenProfile + CitizenHome)
  const walletTotal = 32;
  const walletUsed = Math.round(walletTotal * Math.min(0.92, citizen.engagementScore / 100 + 0.1));
  const walletBalance = Math.max(0, walletTotal - walletUsed);

  // Matched services from the real engine (no legacy SERVICES array)
  const matchedServices = useMemo(
    () => matchServicesForCitizen(citizen, { topN: 5 }),
    [citizen]
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link to="/coordinator/patients" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors" aria-label="חזרה">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">פרופיל אישי</h1>
      </div>

      {/* Profile Header Card */}
      <div className="libi-card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={citizen.name} size={64} tone="primary" />
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-xl font-bold text-foreground">{citizen.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {citizen.gender === "female" ? "בת" : "בן"} {citizen.age} • {citizen.neighborhood}, {citizen.city}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Chip tone={citizen.riskLevel === "critical" ? "destructive" : citizen.riskLevel === "high" ? "warning" : "success"}>
                {citizen.riskLevel === "critical" ? "סיכון קריטי" : citizen.riskLevel === "high" ? "סיכון גבוה" : citizen.riskLevel === "medium" ? "סיכון בינוני" : "תקין"}
              </Chip>
              <Chip tone="info">{READINESS_LABELS[citizen.readiness]}</Chip>
              <Chip tone="muted">מעורבות: {citizen.engagementScore}%</Chip>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" /> שיחה
            </button>
            <button className="h-10 px-4 border border-border text-foreground rounded-xl text-xs font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> הערה
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">מעורבות</div>
            <div className={cn("text-xl font-bold mt-0.5", citizen.engagementScore < 30 ? "text-destructive" : citizen.engagementScore < 60 ? "text-warning-foreground" : "text-success")}>{citizen.engagementScore}%</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">התמדה</div>
            <div className={cn("text-xl font-bold mt-0.5", citizen.persistenceRate < 30 ? "text-destructive" : citizen.persistenceRate < 60 ? "text-warning-foreground" : "text-success")}>{citizen.persistenceRate}%</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">בדידות</div>
            <div className={cn("text-xl font-bold mt-0.5", citizen.loneliness >= 4 ? "text-destructive" : citizen.loneliness >= 3 ? "text-warning-foreground" : "text-success")}>{citizen.loneliness}/5</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">פעילות אחרונה</div>
            <div className="text-xl font-bold mt-0.5 text-foreground">{citizen.lastActivityDays === 0 ? "היום" : `${citizen.lastActivityDays} ימים`}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="profile">פרופיל דינמי</TabsTrigger>
          <TabsTrigger value="plan">תוכנית אישית</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="strengths">חוזקות</TabsTrigger>
        </TabsList>

        {/* ═══ Tab 1: פרופיל דינמי ═══ */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* מוטיבציות */}
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" /> מה מניע את {citizen.name.split(" ")[0]}
              </h3>
              <div className="flex flex-wrap gap-2">
                {citizen.motivations.map((m) => (
                  <span key={m} className="px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 text-sm font-medium border border-pink-100">
                    {MOTIVATION_LABELS[m]}
                  </span>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-0.5">החלום</p>
                <p className="text-sm text-amber-900 italic">"{citizen.dream}"</p>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-0.5">משמעות</p>
                <p className="text-sm text-blue-900 italic">"{citizen.meaningStatement}"</p>
              </div>
            </div>

            {/* חסמים */}
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> חסמים מזוהים
              </h3>
              {citizen.barriers.length > 0 ? (
                <div className="space-y-2">
                  {citizen.barriers.map((b) => (
                    <div key={b} className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm text-orange-800">{BARRIER_LABELS[b]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">אין חסמים מזוהים 🌿</p>
              )}

              <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">מוכנות לשינוי</h4>
              <div className="flex gap-1">
                {(["precontemplation", "contemplation", "preparation", "action", "maintenance"] as const).map((stage, i) => (
                  <div key={stage} className={cn("flex-1 h-3 rounded-full", citizen.readiness === stage ? "bg-primary" : i < ["precontemplation", "contemplation", "preparation", "action", "maintenance"].indexOf(citizen.readiness) ? "bg-primary/40" : "bg-muted")} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">לא מודע</span>
                <span className="text-[10px] text-muted-foreground">מתמיד/ה</span>
              </div>
            </div>

            {/* מצב תפקודי */}
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> מצב תפקודי-חברתי
              </h3>
              <div className="space-y-3">
                {[
                  { label: "בריאות נתפסת", value: citizen.perceivedHealth, max: 5 },
                  { label: "רמת פעילות", value: citizen.activityLevel, max: 5 },
                  { label: "שייכות חברתית", value: citizen.socialBelonging, max: 5 },
                  { label: "עצמאות", value: citizen.independence, max: 5 },
                  { label: "תחושת מסוגלות", value: citizen.selfEfficacy, max: 5 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.value}/{item.max}</span>
                    </div>
                    <ProgressBar value={item.value} max={item.max} tone={item.value <= 2 ? "destructive" : item.value <= 3 ? "warning" : "success"} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* העדפות */}
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" /> העדפות
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">פעילויות אהובות</p>
                  <div className="flex flex-wrap gap-1.5">
                    {citizen.preferredActivities.map((a) => <Chip key={a} tone="primary">{a}</Chip>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">תחומי עניין</p>
                  <div className="flex flex-wrap gap-1.5">
                    {citizen.interests.map((i) => <Chip key={i} tone="info">{i}</Chip>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">שעות:</span> <span className="font-medium">{citizen.preferredHours}</span></div>
                  <div><span className="text-muted-foreground">מסגרת:</span> <span className="font-medium">{citizen.preferredFormat === "small_group" ? "קבוצה קטנה" : citizen.preferredFormat === "large_group" ? "קבוצה גדולה" : citizen.preferredFormat === "alone" ? "אישי" : "גמיש"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab 2: תוכנית אישית ═══ */}
        <TabsContent value="plan">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* AI Recommendations */}
            <div className="lg:col-span-2 space-y-4">
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> המלצות AI מותאמות
                </h3>
                {recommendations.length > 0 ? recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-border bg-muted/20 mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Chip tone={rec.urgency === "high" ? "destructive" : rec.urgency === "medium" ? "warning" : "info"}>
                        {rec.urgency === "high" ? "דחוף" : rec.urgency === "medium" ? "חשוב" : "מומלץ"}
                      </Chip>
                      <span className="text-xs text-muted-foreground">ביטחון: {rec.confidence}%</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.whyRecommended}</p>
                    <div className="mt-3 p-2.5 bg-info-soft rounded-lg">
                      <p className="text-xs text-info font-medium">ערך: {rec.valueForCitizen}</p>
                    </div>
                    {rec.expectedBarriers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.expectedBarriers.map((b) => <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">{b}</span>)}
                      </div>
                    )}
                    <button className="mt-3 text-xs text-primary font-medium hover:underline">{rec.nextAction} →</button>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">אין המלצות פעילות כרגע</p>
                )}
              </div>

              {/* Matched Services — from real matching engine */}
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> שירותים מותאמים לפרופיל
                </h3>
                <div className="space-y-2">
                  {matchedServices.slice(0, 4).map((result) => {
                    const { image, gradient } = getServiceImageInfo(result.service);
                    return (
                      <div key={result.service.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          {image
                            ? <img src={image} alt={result.service.categoryLabel} className="w-full h-full object-cover" loading="lazy" />
                            : <div className={cn("w-full h-full", gradient)} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-foreground line-clamp-1">{result.service.name}</div>
                            <SubsidyBadge cost={result.service.cost} />
                          </div>
                          {result.explanations[0] && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{result.explanations[0]}</div>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <div className="text-sm font-bold text-primary">{result.totalScore}</div>
                          <div className="text-[10px] text-muted-foreground">התאמה</div>
                          <button className="mt-1 text-xs text-primary font-medium hover:underline block">הצע →</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Wallet — level 2 model */}
              <div className="libi-card p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">ארנק יחידות</h4>
                <div className="flex items-end gap-2 mb-2">
                  <div className="text-2xl font-bold text-primary">{walletBalance}</div>
                  <div className="text-xs text-muted-foreground pb-0.5">מתוך {walletTotal}</div>
                  <div className="mr-auto text-xs font-semibold text-emerald-700">775₪</div>
                </div>
                <ProgressBar value={walletUsed} max={walletTotal} tone="primary" />
                <p className="text-[10px] text-muted-foreground mt-1.5">רמה 2 · {walletUsed} יחידות נוצלו</p>
              </div>

              {/* Nudges */}
              <div className="libi-card p-5">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-info" /> חיזוקים שנשלחו
                </h4>
                {nudges.length > 0 ? nudges.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 mb-2 last:mb-0">
                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {n.sentAt} · {n.opened ? "נפתח" : "לא נפתח"}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">לא נשלחו חיזוקים עדיין</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab 3: Timeline ═══ */}
        <TabsContent value="timeline">
          <div className="libi-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Timeline טיפולי
            </h3>
            {timeline.length > 0 ? (
              <div className="relative border-r-2 border-primary/20 pr-6 space-y-4">
                {timeline.map((event) => {
                  const iconMap: Record<string, typeof Phone> = {
                    intake: User, call: Phone, visit: Activity, note: MessageCircle,
                    service_start: CheckCircle2, service_end: Calendar, nudge_sent: Sparkles,
                    milestone: Target, risk_alert: AlertTriangle, mood_change: Heart, ai_recommendation: Sparkles,
                  };
                  const Icon = iconMap[event.type] || Clock;
                  const toneMap: Record<string, string> = {
                    risk_alert: "bg-destructive text-destructive-foreground",
                    milestone: "bg-success text-success-foreground",
                    mood_change: "bg-warning text-warning-foreground",
                    service_start: "bg-info text-white",
                  };
                  const iconTone = toneMap[event.type] || "bg-accent text-primary";

                  return (
                    <div key={event.id} className="relative">
                      <div className={cn("absolute -right-[19px] top-0 w-8 h-8 rounded-full flex items-center justify-center", iconTone)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                          <span className="text-[11px] text-muted-foreground">{event.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        {event.by && <p className="text-[10px] text-muted-foreground mt-1">ע״י {event.by}</p>}
                        {event.mood && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">מצב רוח:</span>
                            {[1, 2, 3, 4, 5].map((v) => (
                              <span key={v} className={cn("w-4 h-4 rounded-full text-[10px] flex items-center justify-center", v <= event.mood! ? (event.mood! <= 2 ? "bg-destructive/20 text-destructive" : event.mood! <= 3 ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success") : "bg-muted")}>
                                {v <= event.mood! ? "●" : "○"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">אין אירועים ב-Timeline עדיין</p>
            )}
          </div>
        </TabsContent>

        {/* ═══ Tab 4: חוזקות ═══ */}
        <TabsContent value="strengths">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" /> מעגל חוזקות (VIA)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">חוזקות דומיננטיות שזוהו — משמשות להתאמת שירותים ולחיזוק</p>

              {/* VIA strengths with lucide icons */}
              <div className="grid grid-cols-2 gap-3">
                {(["wisdom", "courage", "justice", "transcendence", "temperance", "humanity"] as const).map((s) => {
                  const isActive = citizen.strengths.includes(s);
                  const STRENGTH_ICON = {
                    wisdom: Brain, courage: Shield, justice: Scale,
                    transcendence: Sparkles, temperance: Leaf, humanity: Heart,
                  }[s];
                  return (
                    <div key={s} className={cn("p-4 rounded-xl border text-center transition-all", isActive ? "border-primary/30 bg-primary-soft/30 shadow-sm" : "border-border/50 bg-muted/20 opacity-40")}>
                      <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2"
                           style={{ backgroundColor: `${STRENGTH_COLORS[s]}15` }}>
                        <STRENGTH_ICON className="w-5 h-5" style={{ color: STRENGTH_COLORS[s] }} />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{STRENGTH_LABELS[s]}</div>
                      {isActive && <div className="text-[10px] text-primary mt-1 font-medium">דומיננטית</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Services aligned with top matches (engine-sourced, no legacy SERVICES) */}
            <div className="libi-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-4">שירותים מובילים</h3>
              <p className="text-xs text-muted-foreground mb-3">שירותים מותאמים לפרופיל — מחוזקות, מוטיבציות ומצב תפקודי</p>
              <div className="space-y-2">
                {matchedServices.map((result) => {
                  const { image, gradient } = getServiceImageInfo(result.service);
                  return (
                    <div key={result.service.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        {image
                          ? <img src={image} alt={result.service.categoryLabel} className="w-full h-full object-cover" loading="lazy" />
                          : <div className={cn("w-full h-full", gradient)} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground line-clamp-1">{result.service.name}</div>
                        {result.explanations[0] && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{result.explanations[0]}</div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-primary shrink-0">{result.totalScore}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
