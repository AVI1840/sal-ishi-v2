/**
 * האטלס בתוך הכלי: אטלס השטח אצל המלווה, ואטלס המטה במטה. אותו קטלוג ואותם
 * נתונים (בהדגמה: ירושלים), בלי לצאת מהכלי. האטלס נטען כמו שהוא, ובתוך מסגרת
 * הוא מסתיר את הקישור "לסל האישי" (הכלי כבר מסביב).
 */
import { ExternalLink } from "lucide-react";
import { useTitle } from "@/pilot/components/Frame";

export default function AtlasFrame({ which }: { which: "field" | "hq" }) {
  const title = which === "field" ? "אטלס השכונה" : "אטלס המטה";
  const lead =
    which === "field"
      ? "הקטלוג של הרשות: שכונות, ספקים, מבחן כיסוי מול הרצפה, ומה הולך בשטח. מה שרונית רושמת כ\"ביקשו ואין\" מגיע לכאן כפער."
      : "התמונה הארצית, פערים וחלופות, מחירי ייחוס, ספרייה וכללים, ייצוא התקן לספק העל ופנקס הלמידה.";
  useTitle(title);
  const src = which === "field" ? "./field/" : "./hq/";
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{lead}</p>
        </div>
        <a href={src} target="_blank" rel="noreferrer" className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-lg border border-border text-sm font-semibold">
          במסך מלא <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
      <iframe title={title} src={src} className="w-full h-[calc(100vh-11rem)] min-h-[560px] rounded-xl border border-border bg-white" />
    </div>
  );
}
