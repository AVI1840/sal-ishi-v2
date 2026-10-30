/**
 * פרופיל מטופל עשיר - מנוע חיזוק חיים אישי
 * מה האזרח סיפר, תוכנית אישית (אותה המלצה שהאזרח רואה, עם הפירוק המלא),
 * ציר זמן מיומן האירועים, וחוזקות. כלים של המלווה: לא מוצגים לאזרח.
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
import { CITIZENS } from "@/data/mockData";
import { usePilot } from "@/pilot/store";
import { describe as describeEvent } from "@/pilot/companion/Log";
import { withAnswers } from "@/lib/personalMatch";
import { MOTIVATION_LABELS, BARRIER_LABELS, STRENGTH_LABELS, READINESS_LABELS } from "@/data/types";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { personalRecommendations } from "@/lib/personalMatch";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonActions } from "@/components/companion/PersonActions";

// Strength colors for radar
const STRENGTH_COLORS: Record<string, string> = {
  wisdom: "#3b82f6", courage: "#ef4444", justice: "#f59e0b",
  transcendence: "#8b5cf6", temperance: "#22c55e", humanity: "#ec4899",
};

export default function CoordinatorPatientDetail() {
  const { id } = useParams();
  const citizen = CITIZENS.find((c) => c.id === id) || CITIZENS[0];
  const { state, derived } = usePilot();
  const timeline = state.events.filter((e) => e.citizenId === citizen.id).slice().reverse();
  const answers = derived.answers.get(citizen.id);
  const told = withAnswers(citizen, answers);

  // Matched services from the real engine (no legacy SERVICES array)
  // מה שהאזרח סיפר קודם (כמו אצלו), ואחריו שאר ההתאמות של המנוע עם הפירוק המלא.
  const matchedServices = useMemo(() => {
    const all = matchServicesForCitizen(citizen, { topN: 500, minScore: 0 });
    const first = personalRecommendations(citizen, all, 3).map((p) => p.result);
    const rest = all.filter((r) => !first.includes(r));
    return [...first, ...rest].slice(0, 5);
  }, [citizen]);

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

      {/* 0.5 מאוחד: פעולות המלווה בתיק */}
      <PersonActions citizen={citizen} />

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="profile">פרופיל דינמי</TabsTrigger>
          <TabsTrigger value="plan">תוכנית אישית</TabsTrigger>
          <TabsTrigger value="timeline">ציר זמן</TabsTrigger>
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
                <p className="text-xs text-amber-800 font-medium mb-0.5">החלום</p>
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
                <p className="text-sm text-muted-foreground">אין חסמים מזוהים</p>
              )}

              <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">מוכנות לשינוי</h4>
              <div className="flex gap-1" role="img" aria-label={`מוכנות לשינוי: ${READINESS_LABELS[citizen.readiness]}`}>
                {(["precontemplation", "contemplation", "preparation", "action", "maintenance"] as const).map((stage, i) => (
                  <div key={stage} className={cn("flex-1 h-3 rounded-full", citizen.readiness === stage ? "bg-primary" : i < ["precontemplation", "contemplation", "preparation", "action", "maintenance"].indexOf(citizen.readiness) ? "bg-primary/40" : "bg-muted")} />
                ))}
              </div>
              <p className="text-sm text-foreground mt-1.5">שלב נוכחי: <span className="font-semibold">{READINESS_LABELS[citizen.readiness]}</span></p>
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
            {/* מה האזרח סיפר: הבסיס להמלצה. שאלון האזרח והפגישה המשותפת */}
            <div className="lg:col-span-2 space-y-4">
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" aria-hidden="true" /> מה {citizen.name.split(" ")[0]} סיפר/ה
                </h3>
                <dl className="space-y-2 text-sm">
                  {citizen.dream ? (<div><dt className="text-muted-foreground">החלום</dt><dd className="text-foreground font-medium">{citizen.dream}</dd></div>) : null}
                  {citizen.meaningStatement ? (<div><dt className="text-muted-foreground">במילים שלה/ו</dt><dd className="text-foreground">"{citizen.meaningStatement}"</dd></div>) : null}
                  <div><dt className="text-muted-foreground">אוהב/ת לעשות</dt><dd className="text-foreground">{told.preferredActivities.join(", ")}</dd></div>
                  <div><dt className="text-muted-foreground">נוח</dt><dd className="text-foreground">{told.preferredHours}</dd></div>
                </dl>
                <p className="text-xs text-muted-foreground mt-3">
                  {answers ? "עודכן מהשאלון \"לספר מה חשוב לי\" או מהפגישה המשותפת." : "עוד לא מילא/ה את השאלון. אפשר בפגישה המשותפת."}
                </p>
              </div>

              {/* Matched Services - from real matching engine */}
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
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab 3: Timeline ═══ */}
        <TabsContent value="timeline">
          <div className="libi-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> ציר זמן, מיומן האירועים
            </h3>
            {timeline.length > 0 ? (
              <ol className="relative border-r-2 border-primary/20 pr-6 space-y-3">
                {timeline.map((e) => (
                  <li key={e.id} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                    <p className="text-sm text-foreground">{describeEvent(e)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.at).toLocaleDateString("he-IL")} · {e.actor === "citizen" ? "האזרח/ית" : e.actor === "companion" ? "המלווה" : "המערכת"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">עוד אין אירועים בתיק</p>
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
              <p className="text-xs text-muted-foreground mb-4">חוזקות דומיננטיות שזוהו - משמשות להתאמת שירותים ולחיזוק</p>

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
              <p className="text-xs text-muted-foreground mb-3">שירותים מותאמים לפרופיל - מחוזקות, מוטיבציות ומצב תפקודי</p>
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
