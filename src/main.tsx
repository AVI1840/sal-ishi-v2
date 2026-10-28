import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initCatalog } from "./data/catalogSource";
import "./index.css";

// השירותים נטענים מהקטלוג המאושר לפני הציור הראשון, כדי שכל המסכים יראו אותו מקור.
void initCatalog().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
