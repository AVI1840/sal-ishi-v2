import { Search, Users, UserPlus, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { CITIZENS } from "@/data/mockData";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type RiskFilter = "all" | "critical" | "high" | "medium" | "low";

const RISK_FILTERS: { key: RiskFilter; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "critical", label: "סיכון קריטי" },
  { key: "high", label: "סיכון גבוה" },
  { key: "medium", label: "בינוני" },
  { key: "low", label: "תקין" },
];

const NEIGHBORHOODS = [...new Set(CITIZENS.map((c) => c.neighborhood))].sort();
const PAGE_SIZE = 20;

export default function CoordinatorPatients() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return CITIZENS.filter((c) => {
      if (search && !c.name.includes(search)) return false;
      if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false;
      if (neighborhoodFilter !== "all" && c.neighborhood !== neighborhoodFilter) return false;
      return true;
    });
  }, [search, riskFilter, neighborhoodFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleAddCitizen = () => {
    toast("ייבוא מרשימה / הוספה ידנית", {
      description: "בחר אופן הוספת אזרח חדש למערכת",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> אזרחים
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{CITIZENS.length} אזרחים בליווי</p>
        </div>
        <button
          onClick={handleAddCitizen}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          הוסף אזרח +
        </button>
      </div>

      {/* Search + Neighborhood Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="חיפוש לפי שם..."
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="rtl"
          />
        </div>
        <div className="relative">
          <select
            value={neighborhoodFilter}
            onChange={(e) => { setNeighborhoodFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="h-11 pl-8 pr-4 rounded-xl border border-border bg-card text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="rtl"
          >
            <option value="all">כל השכונות</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Risk Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {RISK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setRiskFilter(f.key); setVisibleCount(PAGE_SIZE); }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              riskFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {f.label}
          </button>
        ))}
        {filtered.length !== CITIZENS.length && (
          <span className="flex items-center text-xs text-muted-foreground mr-2">
            ({filtered.length} תוצאות)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="libi-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">שם</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">גיל</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">שכונה</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">מעורבות</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">בדידות</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">התמדה</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">סיכון</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">פעילות אחרונה</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((citizen) => (
                <tr key={citizen.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/coordinator/patients/${citizen.id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar name={citizen.name} size={32} />
                      <span className="font-medium text-foreground">{citizen.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{citizen.age}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{citizen.neighborhood}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={citizen.engagementScore}
                        max={100}
                        tone={citizen.engagementScore < 30 ? "destructive" : citizen.engagementScore < 60 ? "warning" : "success"}
                        size="sm"
                        className="w-16"
                      />
                      <span className={cn(
                        "text-xs font-bold tabular-nums",
                        citizen.engagementScore < 30 ? "text-destructive" : citizen.engagementScore < 60 ? "text-warning-foreground" : "text-success"
                      )}>
                        {citizen.engagementScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-sm font-medium",
                      citizen.loneliness >= 4 ? "text-destructive" : citizen.loneliness >= 3 ? "text-warning-foreground" : "text-muted-foreground"
                    )}>
                      {citizen.loneliness}/5
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm tabular-nums text-muted-foreground">{citizen.persistenceRate}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={
                      citizen.riskLevel === "critical" ? "destructive" :
                      citizen.riskLevel === "high" ? "warning" :
                      citizen.riskLevel === "medium" ? "info" : "success"
                    }>
                      {citizen.riskLevel === "critical" ? "קריטי" : citizen.riskLevel === "high" ? "גבוה" : citizen.riskLevel === "medium" ? "בינוני" : "תקין"}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {citizen.lastActivityDays === 0 ? "היום" : `לפני ${citizen.lastActivityDays} ימים`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show More */}
        {hasMore && (
          <div className="p-4 border-t border-border flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="h-10 px-6 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              הצג עוד ({filtered.length - visibleCount} נוספים)
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            לא נמצאו אזרחים התואמים את החיפוש
          </div>
        )}
      </div>
    </div>
  );
}
