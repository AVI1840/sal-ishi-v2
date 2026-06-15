import { useState } from "react";
import { Calendar, Activity, Wallet, Star, CheckCircle2, Clock, X, Users, Download, TrendingUp, Plus, Edit2 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Chip } from "@/components/shared/Chip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Mock Data ─────────────────────────────────────────────────

const REVENUE_DATA = [
  { month: "ינואר", revenue: 14200 },
  { month: "פברואר", revenue: 15800 },
  { month: "מרץ", revenue: 16400 },
  { month: "אפריל", revenue: 17100 },
  { month: "מאי", revenue: 18500 },
  { month: "יוני", revenue: 19200 },
];

type BookingStatus = "ממתין" | "מאושר" | "הושלם" | "בוטל";

interface Booking {
  id: string;
  citizen: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
}

const BOOKINGS: Booking[] = [
  { id: "b1", citizen: "שרה רוזנברג", service: "התעמלות קבוצתית", date: "15.05.26", time: "10:00", status: "מאושר" },
  { id: "b2", citizen: "יוסף כהן", service: "חוג ציור", date: "16.05.26", time: "14:00", status: "ממתין" },
  { id: "b3", citizen: "מרים אלון", service: "מקהלה קהילתית", date: "16.05.26", time: "11:00", status: "מאושר" },
  { id: "b4", citizen: "אהוה פרידמן", service: "התעמלות קבוצתית", date: "17.05.26", time: "10:00", status: "ממתין" },
  { id: "b5", citizen: "נעמי שפירא", service: "יוגה עדינה", date: "18.05.26", time: "09:00", status: "מאושר" },
  { id: "b6", citizen: "דוד לוי", service: "חוג ציור", date: "14.05.26", time: "14:00", status: "הושלם" },
  { id: "b7", citizen: "חנה כהן", service: "מקהלה קהילתית", date: "13.05.26", time: "11:00", status: "הושלם" },
  { id: "b8", citizen: "אברהם מזרחי", service: "יוגה עדינה", date: "12.05.26", time: "09:00", status: "בוטל" },
  { id: "b9", citizen: "רבקה פרץ", service: "התעמלות קבוצתית", date: "19.05.26", time: "10:00", status: "ממתין" },
  { id: "b10", citizen: "משה דהן", service: "חוג ציור", date: "20.05.26", time: "14:00", status: "ממתין" },
];

interface ProviderService {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  bookings: number;
  rating: number;
}

const SERVICES_LIST: ProviderService[] = [
  { id: "ps1", name: "התעמלות קבוצתית", category: "בריאות", price: 0, active: true, bookings: 24, rating: 4.8 },
  { id: "ps2", name: "חוג ציור", category: "יצירה", price: 0, active: true, bookings: 12, rating: 4.9 },
  { id: "ps3", name: "מקהלה קהילתית", category: "שייכות", price: 0, active: true, bookings: 18, rating: 4.9 },
  { id: "ps4", name: "יוגה עדינה", category: "בריאות", price: 0, active: true, bookings: 8, rating: 4.7 },
  { id: "ps5", name: "סדנת בישול", category: "בריאות", price: 0, active: false, bookings: 0, rating: 4.6 },
  { id: "ps6", name: "הדרכת סמארטפון", category: "דיגיטל", price: 10, active: false, bookings: 0, rating: 4.5 },
];

interface Invoice {
  id: string;
  month: string;
  amount: number;
  status: "שולם" | "ממתין";
  date: string;
}

const INVOICES: Invoice[] = [
  { id: "inv1", month: "מאי 2026", amount: 18500, status: "ממתין", date: "01.06.26" },
  { id: "inv2", month: "אפריל 2026", amount: 17100, status: "שולם", date: "01.05.26" },
  { id: "inv3", month: "מרץ 2026", amount: 16400, status: "שולם", date: "01.04.26" },
  { id: "inv4", month: "פברואר 2026", amount: 15800, status: "שולם", date: "01.03.26" },
  { id: "inv5", month: "ינואר 2026", amount: 14200, status: "שולם", date: "01.02.26" },
];

interface Review {
  id: string;
  citizen: string;
  rating: number;
  text: string;
  date: string;
  responded: boolean;
}

const REVIEWS: Review[] = [
  { id: "rv1", citizen: "שרה רוזנברג", rating: 5, text: "שיעור מעולה! מרגישה חזקה יותר כל שבוע", date: "14.05.26", responded: true },
  { id: "rv2", citizen: "יוסף כהן", rating: 5, text: "האווירה נפלאה, המדריכה סבלנית ומקצועית", date: "13.05.26", responded: true },
  { id: "rv3", citizen: "נעמי שפירא", rating: 4, text: "נהניתי מאוד, אבל הייתי רוצה יותר תרגילי גמישות", date: "12.05.26", responded: false },
  { id: "rv4", citizen: "אהוה פרידמן", rating: 5, text: "מקום חם ומזמין. ממליצה לכולם!", date: "10.05.26", responded: true },
  { id: "rv5", citizen: "מרים אלון", rating: 4, text: "המקהלה מדהימה, רק החדר קצת קטן", date: "08.05.26", responded: false },
];

// ─── Component ─────────────────────────────────────────────────

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [services, setServices] = useState<ProviderService[]>(SERVICES_LIST);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | "הכל">("הכל");

  const filteredBookings = bookingStatusFilter === "הכל"
    ? bookings
    : bookings.filter((b) => b.status === bookingStatusFilter);

  const handleApprove = (id: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "מאושר" as BookingStatus } : b));
    toast.success("ההזמנה אושרה בהצלחה");
  };

  const handleReject = (id: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "בוטל" as BookingStatus } : b));
    toast.error("ההזמנה נדחתה");
  };

  const handleToggleService = (id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    toast.success("סטטוס השירות עודכן");
  };

  const handleAddService = () => {
    toast("הוסף שירות חדש", { description: "טופס הוספת שירות ייפתח בקרוב" });
  };

  const handleEditService = (name: string) => {
    toast(`עריכת שירות: ${name}`, { description: "טופס עריכה ייפתח בקרוב" });
  };

  const handleDownloadInvoice = (month: string) => {
    toast.success(`מוריד חשבונית עבור ${month}`);
  };

  const avgRating = (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1);
  const responseRate = Math.round((REVIEWS.filter((r) => r.responded).length / REVIEWS.length) * 100);
  const uniqueCitizens = new Set(bookings.map((b) => b.citizen)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">שלום, מתנ״ס פסגת זאב</h1>
        <p className="text-sm text-muted-foreground mt-1">סיכום פעילות — מאי 2026</p>
      </div>

      <Tabs defaultValue="dashboard" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="dashboard">דשבורד</TabsTrigger>
          <TabsTrigger value="bookings">הזמנות</TabsTrigger>
          <TabsTrigger value="services">שירותים שלי</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="ratings">דירוגים</TabsTrigger>
        </TabsList>

        {/* ═══ Tab: Dashboard ═══ */}
        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard icon={Calendar} label="הזמנות פעילות" value={bookings.filter((b) => b.status === "מאושר" || b.status === "ממתין").length} sub="השבוע" tone="info" />
              <StatCard icon={Activity} label="שירותים פעילים" value={services.filter((s) => s.active).length} sub={`מתוך ${services.length}`} tone="success" />
              <StatCard icon={Wallet} label="הכנסות חודשיות" value="₪18,500" sub="+12% מהחודש הקודם" tone="primary" />
              <StatCard icon={Star} label="דירוג ממוצע" value={avgRating} sub={`${REVIEWS.length} דירוגים`} tone="warning" />
              <StatCard icon={Users} label="אזרחים ייחודיים" value={uniqueCitizens} sub="החודש" tone="info" />
            </div>

            {/* Revenue Chart */}
            <div className="libi-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">הכנסות 6 חודשים אחרונים</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`₪${value.toLocaleString()}`, "הכנסות"]} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="libi-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">הזמנות אחרונות</h3>
                <p className="text-xs text-muted-foreground mt-0.5">5 הזמנות אחרונות</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">אזרח</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">שירות</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">תאריך</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{booking.citizen}</td>
                        <td className="px-4 py-3 text-muted-foreground">{booking.service}</td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{booking.date}</td>
                        <td className="px-4 py-3">
                          <Chip tone={booking.status === "מאושר" ? "success" : booking.status === "ממתין" ? "warning" : booking.status === "הושלם" ? "info" : "destructive"}>
                            {booking.status}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab: Bookings ═══ */}
        <TabsContent value="bookings">
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {(["הכל", "ממתין", "מאושר", "הושלם", "בוטל"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setBookingStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                    bookingStatusFilter === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Bookings Table */}
            <div className="libi-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">אזרח</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">שירות</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">תאריך</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">שעה</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">סטטוס</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{booking.citizen}</td>
                        <td className="px-4 py-3 text-muted-foreground">{booking.service}</td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{booking.date}</td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{booking.time}</td>
                        <td className="px-4 py-3">
                          <Chip tone={
                            booking.status === "מאושר" ? "success" :
                            booking.status === "ממתין" ? "warning" :
                            booking.status === "הושלם" ? "info" : "destructive"
                          }>
                            {booking.status === "מאושר" && <CheckCircle2 className="w-3 h-3" />}
                            {booking.status === "ממתין" && <Clock className="w-3 h-3" />}
                            {booking.status}
                          </Chip>
                        </td>
                        <td className="px-4 py-3">
                          {booking.status === "ממתין" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleApprove(booking.id)}
                                className="w-7 h-7 rounded-lg bg-success-soft text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                                aria-label="אשר"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                className="w-7 h-7 rounded-lg bg-destructive-soft text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                                aria-label="דחה"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredBookings.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  אין הזמנות בסטטוס זה
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab: Services ═══ */}
        <TabsContent value="services">
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleAddService}
                className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שירות חדש
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="libi-card p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{service.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{service.category} • {service.price === 0 ? "חינם" : `₪${service.price}`}</p>
                    </div>
                    <button
                      onClick={() => handleEditService(service.name)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
                      aria-label="ערוך"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service.bookings} הזמנות • {service.rating}</span>
                    <button
                      onClick={() => handleToggleService(service.id)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        service.active ? "bg-success" : "bg-muted"
                      )}
                      aria-label={service.active ? "השבת שירות" : "הפעל שירות"}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        service.active ? "right-0.5" : "left-0.5"
                      )} />
                    </button>
                  </div>
                  <Chip tone={service.active ? "success" : "muted"}>
                    {service.active ? "פעיל" : "מושבת"}
                  </Chip>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab: Payments ═══ */}
        <TabsContent value="payments">
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Wallet} label="סה״כ הכנסות" value="₪82,000" sub="מתחילת השנה" tone="primary" />
              <StatCard icon={Clock} label="ממתין לתשלום" value="₪18,500" sub="מאי 2026" tone="warning" />
              <StatCard icon={CheckCircle2} label="שולם החודש" value="₪17,100" sub="אפריל 2026" tone="success" />
            </div>

            {/* Invoices Table */}
            <div className="libi-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">חשבוניות</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">חודש</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">סכום</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">סטטוס</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">תאריך</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INVOICES.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{invoice.month}</td>
                        <td className="px-4 py-3 tabular-nums">₪{invoice.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Chip tone={invoice.status === "שולם" ? "success" : "warning"}>
                            {invoice.status}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{invoice.date}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDownloadInvoice(invoice.month)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
                            aria-label="הורד חשבונית"
                          >
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab: Ratings ═══ */}
        <TabsContent value="ratings">
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="libi-card p-6">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{avgRating}</div>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn("w-5 h-5", s <= Math.round(Number(avgRating)) ? "text-yellow-400 fill-yellow-400" : "text-muted")}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{REVIEWS.length} דירוגים</p>
                </div>
                <div className="h-16 w-px bg-border hidden sm:block" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{responseRate}%</div>
                  <p className="text-sm text-muted-foreground">שיעור תגובה</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">דירוגים אחרונים</h3>
              {REVIEWS.map((review) => (
                <div key={review.id} className="libi-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">{review.citizen}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                        {review.responded && (
                          <Chip tone="success" className="text-[10px]">הגבת</Chip>
                        )}
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn("w-3.5 h-3.5", s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted")}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
