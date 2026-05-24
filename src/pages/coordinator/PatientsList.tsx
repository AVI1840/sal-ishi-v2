import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";

type RiskFilter = "all" | "critical" | "high" | "medium" | "low";

export default function PatientsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RiskFilter>("all");

  const filtered = CITIZENS.filter((c) => {
    if (filter !== "all" && c.riskLevel !== filter) return false;
    if (search && !c.name.includes(search)) return false;
    return true;
  });

  const riskChip: Record<string, string> = {
    critical: "bg-destructive-soft text-destructive",
    high: "bg-warning-soft text-warning-foreground",
    medium: "bg-info-soft text-info",
    low: "bg-success-soft text-success",
  };
  const riskLabel: Record<string, string> = {
    critical: "קריטי",
    high: "גבוה",
    medium: "בינוני",
    low: "נמוך",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">אזרחים</h1>
        <p className="text-sm text-muted-foreground mt-1">{CITIZENS.length} אזרחים בליווי</p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            dir="rtl"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" ? "הכל" : riskLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="sal-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">שם</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">גיל</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">מעורבות</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">בדידות</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">ארנק</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">סטטוס</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const walletTotal = 120;
              const walletBalance = Math.round(c.engagementScore * 1.2);
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.age}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold tabular-nums", c.engagementScore <= 20 ? "text-destructive" : c.engagementScore <= 50 ? "text-orange-500" : "text-green-600")}>
                      {c.engagementScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">{c.loneliness}/5</td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">{walletBalance}/{walletTotal}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", riskChip[c.riskLevel])}>
                      {riskLabel[c.riskLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/coordinator/patients/${c.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      פרופיל <ChevronLeft className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
