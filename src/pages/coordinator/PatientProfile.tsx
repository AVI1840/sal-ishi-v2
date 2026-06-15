import { useParams, Link } from "react-router-dom";
import { ArrowRight, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CITIZENS, SERVICES } from "@/data/mockData";
import { BARRIER_LABELS } from "@/data/types";

function FunctionalDonut({ value, label, max = 5 }: { value: number; label: string; max?: number }) {
  const percent = (value / max) * 100;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = value <= 2 ? "hsl(0 78% 55%)" : value <= 3 ? "hsl(38 92% 50%)" : "hsl(152 60% 38%)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(215 18% 92%)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 28 28)" />
        <text x="28" y="32" textAnchor="middle" className="text-xs font-bold" fill={color}>{value}</text>
      </svg>
      <span className="text-[11px] text-muted-foreground text-center">{label}</span>
    </div>
  );
}

export default function PatientProfile() {
  const { id } = useParams();
  const citizen = CITIZENS.find((c) => c.id === id) || CITIZENS[0];
  const walletTotal = 120;
  const walletBalance = Math.round(citizen.engagementScore * 1.2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link to="/coordinator/patients" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">פרופיל מטופל</h1>
        </div>
      </div>

      {/* Profile header */}
      <div className="sal-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
              {citizen.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{citizen.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">בת {citizen.age} • {citizen.city}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {citizen.barriers.map((barrier) => (
                  <Badge key={barrier} variant="destructive" className="text-[10px]">{BARRIER_LABELS[barrier]}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> הערה
            </button>
            <button className="h-9 px-3 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> שיחה
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="functional" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="functional">פרופיל תפקודי</TabsTrigger>
          <TabsTrigger value="assessment">הערכה אישית</TabsTrigger>
          <TabsTrigger value="organizational">ארגוני</TabsTrigger>
          <TabsTrigger value="preferences">העדפות</TabsTrigger>
        </TabsList>

        <TabsContent value="functional">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Functional scores */}
            <div className="lg:col-span-2 sal-card">
              <h3 className="text-sm font-bold text-foreground mb-4">מדדים תפקודיים</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                <FunctionalDonut value={citizen.perceivedHealth} label="בריאות נתפסת" />
                <FunctionalDonut value={citizen.independence} label="עצמאות" />
                <FunctionalDonut value={citizen.selfEfficacy} label="מסוגלות" />
                <FunctionalDonut value={citizen.socialBelonging} label="שייכות" />
                <FunctionalDonut value={citizen.activityLevel} label="פעילות" />
                <FunctionalDonut value={citizen.loneliness} label="בדידות" />
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">חסמים</h4>
                <div className="flex flex-wrap gap-2">
                  {citizen.barriers.map((barrier) => (
                    <span key={barrier} className="px-2.5 py-1 bg-muted text-xs font-medium text-foreground rounded-md">{BARRIER_LABELS[barrier]}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">תחומי עניין</h4>
                <div className="flex flex-wrap gap-2">
                  {citizen.interests.map((interest) => (
                    <span key={interest} className="px-2.5 py-1 bg-primary-soft text-xs font-medium text-primary rounded-md">{interest}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="sal-card">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">רמת סיכון</h4>
                <div className="space-y-2">
                  {citizen.barriers.map((barrier) => (
                    <div key={barrier} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm text-foreground">{BARRIER_LABELS[barrier]}</span>
                    </div>
                  ))}
                  {citizen.barriers.length === 0 && (
                    <p className="text-sm text-muted-foreground">אין חסמים פעילים 🌿</p>
                  )}
                </div>
              </div>
              <div className="sal-card">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">ארנק</h4>
                <div className="text-2xl font-bold text-primary">{walletBalance}/{walletTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">יחידות</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assessment">
          <div className="sal-card space-y-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">החלום של {citizen.name.split(" ")[0]}</h4>
              <p className="text-sm text-foreground italic">"{citizen.dream}"</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">שירותים מומלצים</h4>
              <div className="space-y-2">
                {SERVICES.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.subsidyTier === "full" ? "חינם" : `${s.cost} יחידות`}</div>
                    </div>
                    <span className="text-[10px] font-medium text-green-600 bg-success-soft px-2 py-0.5 rounded-full">התאמה גבוהה</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizational">
          <div className="sal-card">
            <p className="text-sm text-muted-foreground">מידע ארגוני — מלווה אחראית, היסטוריית טיפול, גורמים מעורבים</p>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="sal-card">
            <h4 className="text-sm font-bold text-foreground mb-3">תחביבים והעדפות</h4>
            <div className="flex flex-wrap gap-2">
              {citizen.interests.map((interest) => (
                <span key={interest} className="px-3 py-1.5 bg-primary-soft text-primary text-sm font-medium rounded-full">{interest}</span>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
