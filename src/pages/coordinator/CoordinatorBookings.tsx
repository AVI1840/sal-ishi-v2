/**
 * Bookings — ניהול הזמנות
 * Tabs: מתוכנן / בתהליך / הושלם / בוטל
 */
import { useState } from "react";
import { Calendar, CheckCircle2, Clock, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/shared/Chip";
import { Avatar } from "@/components/shared/Avatar";

type BookingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

interface Booking {
  id: string;
  citizenName: string;
  serviceName: string;
  serviceEmoji: string;
  date: string;
  time: string;
  status: BookingStatus;
  units: number;
  provider: string;
}

const BOOKINGS: Booking[] = [
  { id: "b1", citizenName: "שרה רוזנברג", serviceName: "מקהלה קהילתית", serviceEmoji: "🎵", date: "15.05.26", time: "10:00", status: "scheduled", units: 0, provider: "מתנ״ס פסגת זאב" },
  { id: "b2", citizenName: "יוסף כהן", serviceName: "קבוצת הליכה", serviceEmoji: "🚶", date: "15.05.26", time: "08:00", status: "scheduled", units: 0, provider: "פארק שכונתי" },
  { id: "b3", citizenName: "אהוה פרידמן", serviceName: "חוג ציור", serviceEmoji: "🎨", date: "16.05.26", time: "14:00", status: "scheduled", units: 0, provider: "מתנ״ס פסגת זאב" },
  { id: "b4", citizenName: "משה דהן", serviceName: "התעמלות מותאמת", serviceEmoji: "💪", date: "14.05.26", time: "09:00", status: "in_progress", units: 0, provider: "מרכז ספורט" },
  { id: "b5", citizenName: "שרה רוזנברג", serviceName: "מקהלה קהילתית", serviceEmoji: "🎵", date: "08.05.26", time: "10:00", status: "completed", units: 0, provider: "מתנ״ס פסגת זאב" },
  { id: "b6", citizenName: "שרה רוזנברג", serviceName: "מקהלה קהילתית", serviceEmoji: "🎵", date: "01.05.26", time: "10:00", status: "completed", units: 0, provider: "מתנ״ס פסגת זאב" },
  { id: "b7", citizenName: "יוסף כהן", serviceName: "סדנת בישול", serviceEmoji: "🍳", date: "10.05.26", time: "11:00", status: "completed", units: 0, provider: "מטבח קהילתי" },
  { id: "b8", citizenName: "אהרון מזרחי", serviceName: "אימון מוח", serviceEmoji: "🧠", date: "12.05.26", time: "10:00", status: "cancelled", units: 0, provider: "מרכז יום" },
  { id: "b9", citizenName: "רבקה לוי", serviceName: "ביקור בית", serviceEmoji: "🏠", date: "10.05.26", time: "14:00", status: "cancelled", units: 0, provider: "מתנדבים" },
  { id: "b10", citizenName: "רבקה לוי", serviceName: "מועדון חברתי", serviceEmoji: "🤝", date: "07.05.26", time: "10:00", status: "cancelled", units: 0, provider: "מועדון קהילתי" },
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: "מתוכנן",
  in_progress: "בתהליך",
  completed: "הושלם",
  cancelled: "בוטל",
};

const STATUS_ICONS: Record<BookingStatus, typeof Calendar> = {
  scheduled: Calendar,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: X,
};

export default function CoordinatorBookings() {
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");

  const filtered = activeTab === "all" ? BOOKINGS : BOOKINGS.filter((b) => b.status === activeTab);
  const counts = {
    all: BOOKINGS.length,
    scheduled: BOOKINGS.filter((b) => b.status === "scheduled").length,
    in_progress: BOOKINGS.filter((b) => b.status === "in_progress").length,
    completed: BOOKINGS.filter((b) => b.status === "completed").length,
    cancelled: BOOKINGS.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" /> הזמנות
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{BOOKINGS.length} הזמנות • {counts.scheduled} מתוכננות</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {([["all", "הכל"], ["scheduled", "מתוכנן"], ["in_progress", "בתהליך"], ["completed", "הושלם"], ["cancelled", "בוטל"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn("px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors", activeTab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="libi-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">אזרח</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">שירות</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">תאריך</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">שעה</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ספק</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const StatusIcon = STATUS_ICONS[booking.status];
                return (
                  <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={booking.citizenName} size={28} />
                        <span className="font-medium text-foreground">{booking.citizenName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{booking.serviceEmoji}</span>
                        <span className="text-foreground">{booking.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{booking.date}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{booking.time}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{booking.provider}</td>
                    <td className="px-4 py-3">
                      <Chip tone={booking.status === "completed" ? "success" : booking.status === "cancelled" ? "destructive" : booking.status === "in_progress" ? "info" : "warning"}>
                        <StatusIcon className="w-3 h-3" /> {STATUS_LABELS[booking.status]}
                      </Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
