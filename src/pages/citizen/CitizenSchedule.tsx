import { Link } from "react-router-dom";
import { Home, MessageCircle, Star, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEK_SCHEDULE = [
  { day: "יום א׳", date: "18.05", items: [{ time: "14:00", name: "ביקור בית — מתנדבת", status: "pending" }] },
  { day: "יום ב׳", date: "19.05", items: [] },
  { day: "יום ג׳", date: "20.05", items: [{ time: "10:00", name: "התעמלות קבוצתית", status: "confirmed" }, { time: "15:00", name: "שיחה עם מלווה", status: "confirmed" }] },
  { day: "יום ד׳", date: "21.05", items: [] },
  { day: "יום ה׳", date: "22.05", items: [{ time: "11:30", name: "חוג ציור", status: "confirmed" }] },
  { day: "יום ו׳", date: "23.05", items: [{ time: "09:00", name: "יוגה עדינה", status: "confirmed" }] },
];

export default function CitizenSchedule() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28" dir="rtl">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1B3A5C]" />
          <h1 className="text-xl font-bold text-[#1B3A5C]">לוח הזמנים שלי</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">השבוע — 18-23 במאי 2026</p>
      </header>

      <main className="px-5 pt-4 space-y-3">
        {WEEK_SCHEDULE.map((day) => (
          <div key={day.day} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{day.day}</span>
              <span className="text-xs text-gray-400">{day.date}</span>
            </div>
            {day.items.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {day.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="text-sm font-bold text-[#1B3A5C] w-12 shrink-0">{item.time}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{item.name}</div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-full",
                      item.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    )}>
                      {item.status === "confirmed" ? "✓" : "⏳"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-gray-300">אין פעילויות מתוכננות</p>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
          {[
            { icon: Home, label: "בית", to: "/citizen", active: false },
            { icon: Star, label: "שירותים", to: "/citizen/services", active: false },
            { icon: MessageCircle, label: "שיחה", to: "/citizen", active: false },
            { icon: User, label: "פרופיל", to: "/citizen/profile", active: false },
          ].map((item) => (
            <Link key={item.label} to={item.to} className={cn("flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-all", item.active ? "bg-[#1B3A5C] text-white shadow-md" : "text-gray-400")} style={{ minHeight: 48, minWidth: 48 }}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
