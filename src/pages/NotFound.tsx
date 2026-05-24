import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold text-foreground">הדף לא נמצא</h1>
        <p className="text-sm text-muted-foreground">הדף שחיפשת לא קיים או הועבר</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-12 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
