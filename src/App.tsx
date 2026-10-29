import { lazy, Suspense } from "react";
import { SHOW_DEMO_LAYERS } from "@/lib/edition";
import { RouteFallback } from "@/components/system/RouteFallback";
import PilotApp from "@/pilot/PilotApp";

const LegacyApp = lazy(() => import("./LegacyApp"));

// מגרסה 0.5: הדגמה ופיילוט רצים על חוויית האזרח והמלווה. המסכים הישנים רק בגרסת ההאקתון.
export default function App() {
  return SHOW_DEMO_LAYERS ? (
    <Suspense fallback={<RouteFallback />}>
      <LegacyApp />
    </Suspense>
  ) : (
    <PilotApp />
  );
}
