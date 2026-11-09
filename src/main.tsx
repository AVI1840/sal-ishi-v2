import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initCatalog } from "./data/catalogSource";
import { loadAppSettings } from "./pilot/settings";
import { registerServiceWorker } from "./pilot/offline";
import "./index.css";

// השירותים נטענים מהקטלוג המאושר לפני הציור הראשון, כדי שכל המסכים יראו אותו מקור.
// ההגדרות (הדגמה או פיילוט) נקראות מ-app-settings.json באותו זמן.
registerServiceWorker();
void Promise.all([initCatalog(), loadAppSettings()]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
