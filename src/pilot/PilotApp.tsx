import { useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { FeedbackModal } from "@/components/FeedbackModal";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { OPEN_FEEDBACK } from "./components/Frame";
import { seedDemo } from "./demoSeed";
import "./pilot.css";
import Personas from "./Personas";
import Scope from "./Scope";
import CitizenShell from "./citizen/CitizenShell";
import CitizenHome from "./citizen/Home";
import CitizenFind from "./citizen/Find";
import CitizenService from "./citizen/Service";
import CitizenBook from "./citizen/Book";
import CitizenActivities from "./citizen/Activities";
import CitizenCancel from "./citizen/Cancel";
import CitizenHelp from "./citizen/Help";
import CitizenNeeds from "./citizen/Needs";
import CompanionShell from "./companion/CompanionShell";
import CompanionToday from "./companion/Today";
import CompanionRequests from "./companion/Requests";
import CompanionCaseload from "./companion/Caseload";
import CompanionPerson from "./companion/Person";
import CompanionLog from "./companion/Log";
import CompanionSession from "./companion/Session";
import CompanionReview from "./companion/Review";

/** האפליקציה של 0.5: אזרח, מלווה, ובחירת דמות. המטה והשטח הם אפליקציות נפרדות באותו אתר. */
export default function PilotApp() {
  const [feedback, setFeedback] = useState(false);
  useState(() => seedDemo());
  useEffect(() => {
    const open = () => setFeedback(true);
    window.addEventListener(OPEN_FEEDBACK, open);
    return () => window.removeEventListener(OPEN_FEEDBACK, open);
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Personas />} />
          <Route path="/scope" element={<Scope />} />
          <Route path="/citizen" element={<CitizenShell />}>
            <Route index element={<CitizenHome />} />
            <Route path="find" element={<CitizenFind />} />
            <Route path="service/:id" element={<CitizenService />} />
            <Route path="book/:id" element={<CitizenBook />} />
            <Route path="activities" element={<CitizenActivities />} />
            <Route path="cancel/:bookingId" element={<CitizenCancel />} />
            <Route path="help" element={<CitizenHelp />} />
            <Route path="needs" element={<CitizenNeeds />} />
            {/* כתובות של 0.4 */}
            <Route path="services" element={<Navigate to="/citizen/find" replace />} />
            <Route path="services/:id" element={<Navigate to="/citizen/find" replace />} />
            <Route path="profile" element={<Navigate to="/citizen" replace />} />
          </Route>
          <Route path="/companion" element={<CompanionShell />}>
            <Route index element={<CompanionToday />} />
            <Route path="requests" element={<CompanionRequests />} />
            <Route path="caseload" element={<CompanionCaseload />} />
            <Route path="person/:id" element={<CompanionPerson />} />
            <Route path="log" element={<CompanionLog />} />
            <Route path="session/:id" element={<CompanionSession />} />
            <Route path="review/:id" element={<CompanionReview />} />
          </Route>
          <Route path="/coordinator/*" element={<Navigate to="/companion" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
    </ErrorBoundary>
  );
}
