import { lazy, Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MessageCircle } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { RouteFallback } from "@/components/system/RouteFallback";
import { ScrollToTop } from "@/components/system/ScrollToTop";
import DemoNav from "@/components/layout/DemoNav";
import AppShell from "@/components/layout/AppShell";
import MobileShell from "@/components/layout/MobileShell";
import { GuidedDemo } from "@/components/GuidedDemo";

// Pages
import DemoHome from "@/pages/DemoHome";
import CitizenHome from "@/pages/citizen/CitizenHome";
import CitizenServices from "@/pages/citizen/CitizenServices";
import CitizenServiceDetail from "@/pages/citizen/CitizenServiceDetail";
import ServicesCatalog from "@/pages/citizen/ServicesCatalog";
import CitizenChat from "@/pages/citizen/CitizenChat";
import CitizenProfile from "@/pages/citizen/CitizenProfile";
import CoordinatorDashboard from "@/pages/coordinator/CoordinatorDashboard";
import CoordinatorPatients from "@/pages/coordinator/CoordinatorPatients";
import CoordinatorPatientDetail from "@/pages/coordinator/CoordinatorPatientDetail";
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
import NotFound from "@/pages/NotFound";

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

export default function App() {
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
              {/* Demo Home — Module Switcher */}
              <Route path="/" element={<DemoHome />} />

              {/* Citizen App (Mobile) */}
              <Route path="/citizen" element={<MobileShell />}>
                <Route index element={<CitizenHome />} />
                <Route path="services" element={<CitizenServices />} />
                <Route path="services/:id" element={<CitizenServiceDetail />} />
                <Route path="chat" element={<CitizenChat />} />
                <Route path="profile" element={<CitizenProfile />} />
              </Route>

              {/* Coordinator Dashboard (Desktop) */}
              <Route path="/coordinator" element={<AppShell variant="coordinator" />}>
                <Route index element={<CoordinatorDashboard />} />
                <Route path="patients" element={<CoordinatorPatients />} />
                <Route path="patients/:id" element={<CoordinatorPatientDetail />} />
                <Route path="algorithm" element={<CoordinatorAlgorithm />} />
                <Route path="intake" element={<CoordinatorIntake />} />
                <Route path="deterioration" element={<CoordinatorDeterioration />} />
                <Route path="ai" element={<CoordinatorAI />} />
                <Route path="actions" element={<CoordinatorActions />} />
                <Route path="bookings" element={<CoordinatorBookings />} />
                <Route path="services-map" element={<CoordinatorServices />} />
                <Route path="catalog" element={<ServicesCatalog />} />
                <Route path="agents" element={<CoordinatorAgents />} />
              </Route>

              {/* Executive Dashboard */}
              <Route path="/executive" element={<AppShell variant="executive" />}>
                <Route index element={<ExecutiveOverview />} />
                <Route path="catalog" element={<ServicesCatalog />} />
              </Route>

              {/* Provider Portal */}
              <Route path="/providers" element={<AppShell variant="provider" />}>
                <Route index element={<ProviderDashboard />} />
              </Route>

              {/* National / Inter-ministerial Prototype */}
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

              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>

            {/* GuidedDemo MUST be inside HashRouter — uses Link */}
            <GuidedDemo />
          </HashRouter>

          {/* AWS Badge - discreet footer */}
          <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center py-1.5 bg-white/80 backdrop-blur border-t border-gray-100 pointer-events-none">
            <span className="text-[10px] text-gray-400">
              Powered by <span className="font-semibold text-[#FF9900]">Amazon Bedrock</span> · Transcribe · Personalize
            </span>
          </div>

          {/* Feedback FAB */}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white text-sm font-medium transition-transform hover:scale-105 active:scale-95"
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
