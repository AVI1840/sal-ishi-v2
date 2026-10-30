import { lazy, Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { CITIZEN_CHAT_ENABLED, SHOW_DEMO_LAYERS } from "@/lib/edition";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MessageCircle } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { RouteFallback } from "@/components/system/RouteFallback";
import { ScrollToTop } from "@/components/system/ScrollToTop";
import { resolveConflicts } from "@/lib/demoController";
import DemoNav from "@/components/layout/DemoNav";
import AppShell from "@/components/layout/AppShell";
import MobileShell from "@/components/layout/MobileShell";
import { GuidedDemo } from "@/components/GuidedDemo";
import { AutoDemoOverlay } from "@/components/AutoDemoOverlay";

// Pages
import DemoHome from "@/pages/DemoHome";
import CitizenHome from "@/pages/citizen/CitizenHome";
import CitizenServices from "@/pages/citizen/CitizenServices";
import CitizenServiceDetail from "@/pages/citizen/CitizenServiceDetail";
import CitizenActivities from "@/pages/citizen/CitizenActivities";
import CitizenNeeds from "@/pages/citizen/CitizenNeeds";
import CitizenChat from "@/pages/citizen/CitizenChat";
import CitizenProfile from "@/pages/citizen/CitizenProfile";
import CoordinatorDashboard from "@/pages/coordinator/CoordinatorDashboard";
import CoordinatorPatients from "@/pages/coordinator/CoordinatorPatients";
import CoordinatorPatientDetail from "@/pages/coordinator/CoordinatorPatientDetail";
import CoordinatorPilotScreen, { CompanionRedirect } from "@/pages/coordinator/CoordinatorPilotScreen";
import CoordinatorCommunity from "@/pages/coordinator/CoordinatorCommunity";
import CoordinatorAlgorithm from "@/pages/coordinator/CoordinatorAlgorithm";
import CoordinatorIntake from "@/pages/coordinator/CoordinatorIntake";
import CoordinatorDeterioration from "@/pages/coordinator/CoordinatorDeterioration";
import CoordinatorAI from "@/pages/coordinator/CoordinatorAI";
import CoordinatorActions from "@/pages/coordinator/CoordinatorActions";
import CoordinatorBookings from "@/pages/coordinator/CoordinatorBookings";
import CoordinatorServices from "@/pages/coordinator/CoordinatorServices";
import CoordinatorAgents from "@/pages/coordinator/CoordinatorAgents";
import ExecutiveOverview from "@/pages/executive/ExecutiveOverview";
import ProviderDashboard from "@/pages/providers/ProviderDashboard";
import AtlasFrame from "@/pages/shared/AtlasFrame";
import BasketLibrary from "@/pages/executive/BasketLibrary";
import NotFound from "@/pages/NotFound";
import ExecutiveAgents from "@/pages/executive/ExecutiveAgents";
import ExecutiveSuppliers from "@/pages/executive/ExecutiveSuppliers";
import ScopePage from "@/pages/ScopePage";

// National / Inter-ministerial Prototype (lazy-loaded)
const PolicyIntelligence = lazy(() => import("@/pages/prototype/PolicyIntelligence"));
const Architecture = lazy(() => import("@/pages/prototype/Architecture"));
const EarlyWarning = lazy(() => import("@/pages/prototype/EarlyWarning"));
const AIIntake = lazy(() => import("@/pages/prototype/AIIntake"));
const Matching = lazy(() => import("@/pages/prototype/Matching"));
const Outcomes = lazy(() => import("@/pages/prototype/Outcomes"));
const Assistant = lazy(() => import("@/pages/prototype/Assistant"));
const Partners = lazy(() => import("@/pages/prototype/Partners"));
const Proposal = lazy(() => import("@/pages/prototype/Proposal"));
const Hackathon = lazy(() => import("@/pages/prototype/Hackathon"));
const AutoDemo = lazy(() => import("@/pages/prototype/AutoDemo"));

const queryClient = new QueryClient();

// Resolve any conflicting demo state on app boot
resolveConflicts();

/** ההדגמה המקורית (גרסת ההאקתון בלבד). נטענת בנפרד, כדי שגרסת התצוגה והפיילוט לא יורידו אותה. */
export default function LegacyApp() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster position="bottom-left" richColors />
          <HashRouter>
            <ScrollToTop />
            <DemoNav />
            <div className="pt-10"> {/* offset for DemoNav */}
            <Routes>
              {/* Demo Home - Module Switcher */}
              <Route path="/" element={<DemoHome />} />
              <Route path="/scope" element={<ScopePage />} />

              {/* Citizen App (Mobile) */}
              <Route path="/citizen" element={<MobileShell />}>
                <Route index element={<CitizenHome />} />
                <Route path="services" element={<CitizenServices />} />
                <Route path="services/:id" element={<CitizenServiceDetail />} />
                <Route path="activities" element={<CitizenActivities />} />
                <Route path="needs" element={<CitizenNeeds />} />
                <Route path="chat" element={CITIZEN_CHAT_ENABLED ? <CitizenChat /> : <Navigate to="/citizen" replace />} />
                <Route path="profile" element={<CitizenProfile />} />
              </Route>

              {/* Coordinator Dashboard (Desktop) */}
              <Route path="/coordinator" element={<AppShell variant="coordinator" />}>
                <Route index element={<CoordinatorDashboard />} />
                <Route path="patients" element={<CoordinatorPatients />} />
                <Route path="patients/:id" element={<CoordinatorPatientDetail />} />
                <Route path="patients/:id/session" element={<CoordinatorPilotScreen screen="session" />} />
                <Route path="patients/:id/review" element={<CoordinatorPilotScreen screen="review" />} />
                <Route path="intake" element={<CoordinatorIntake />} />
                <Route path="deterioration" element={<CoordinatorDeterioration />} />
                <Route path="ai" element={SHOW_DEMO_LAYERS ? <CoordinatorAI /> : <Navigate to="/coordinator" replace />} />
                <Route path="actions" element={<CoordinatorActions />} />
                <Route path="bookings" element={<CoordinatorBookings />} />
                <Route path="services-map" element={<CoordinatorServices />} />
                <Route path="community" element={<CoordinatorCommunity />} />
                <Route path="atlas" element={<AtlasFrame which="field" />} />
                {/* עמודי ה-AI וה"אייג'נטים" רק בגרסת ההאקתון (תשובות כתובות מראש) */}
                <Route path="agents" element={<Navigate to="/coordinator" replace />} />
              </Route>

              {/* קישורים פנימיים של מסכי 0.5 */}
              <Route path="/companion/person/:id" element={<CompanionRedirect to="" />} />
              <Route path="/companion/session/:id" element={<CompanionRedirect to="/session" />} />
              <Route path="/companion/review/:id" element={<CompanionRedirect to="/review" />} />

              {/* Executive Dashboard */}
              <Route path="/executive" element={<AppShell variant="executive" />}>
                <Route index element={<ExecutiveOverview />} />
                <Route path="catalog" element={<BasketLibrary />} />
                <Route path="suppliers" element={<ExecutiveSuppliers />} />
                <Route path="algorithm" element={<CoordinatorAlgorithm />} />
                <Route path="atlas" element={<AtlasFrame which="hq" />} />
                <Route path="agents" element={SHOW_DEMO_LAYERS ? <CoordinatorAgents /> : <ExecutiveAgents />} />
              </Route>

              {/* Provider Portal */}
              <Route path="/providers" element={<AppShell variant="provider" />}>
                <Route index element={<ProviderDashboard />} />
              </Route>

              {/* National / Inter-ministerial Prototype: רק בגרסת ההאקתון */}
              {SHOW_DEMO_LAYERS && (<>
              <Route path="/national" element={<Suspense fallback={<RouteFallback />}><PolicyIntelligence /></Suspense>} />
              <Route path="/national/architecture" element={<Suspense fallback={<RouteFallback />}><Architecture /></Suspense>} />
              <Route path="/national/early-warning" element={<Suspense fallback={<RouteFallback />}><EarlyWarning /></Suspense>} />
              <Route path="/national/intake" element={<Suspense fallback={<RouteFallback />}><AIIntake /></Suspense>} />
              <Route path="/national/matching" element={<Suspense fallback={<RouteFallback />}><Matching /></Suspense>} />
              <Route path="/national/outcomes" element={<Suspense fallback={<RouteFallback />}><Outcomes /></Suspense>} />
              <Route path="/national/assistant" element={<Suspense fallback={<RouteFallback />}><Assistant /></Suspense>} />
              <Route path="/national/partners" element={<Suspense fallback={<RouteFallback />}><Partners /></Suspense>} />
              <Route path="/national/proposal" element={<Suspense fallback={<RouteFallback />}><Proposal /></Suspense>} />
              <Route path="/hackathon" element={<Suspense fallback={<RouteFallback />}><Hackathon /></Suspense>} />
              <Route path="/demo" element={<Suspense fallback={<RouteFallback />}><AutoDemo /></Suspense>} />
              </>)}

              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>

            {/* GuidedDemo MUST be inside HashRouter - uses Link */}
            {SHOW_DEMO_LAYERS && <GuidedDemo />}
            {SHOW_DEMO_LAYERS && <AutoDemoOverlay />}
          </HashRouter>

          {/* AWS Badge - discreet footer: רק בגרסת ההאקתון, כי השירותים האלה לא פועלים בגרסה הזו */}
          {SHOW_DEMO_LAYERS && (
          <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center py-1.5 bg-white/80 backdrop-blur border-t border-gray-100 pointer-events-none">
            <span className="text-[10px] text-gray-400">
              Powered by <span className="font-semibold text-[#FF9900]">Amazon Bedrock</span> · Transcribe · Personalize
            </span>
          </div>
          )}

          {/* Feedback FAB */}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="fixed bottom-24 left-4 z-50 flex items-center gap-2 px-4 min-h-[48px] rounded-full shadow-lg text-white text-sm font-medium transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: "#1B3A5C" }}
            aria-label="משוב פיילוט"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">משוב פיילוט</span>
          </button>
          <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
