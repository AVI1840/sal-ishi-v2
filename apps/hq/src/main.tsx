import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@sal-ishi/ui/theme.css";
import "./hq.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
