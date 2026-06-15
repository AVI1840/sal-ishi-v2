/**
 * AutoDemo — trigger page
 * When user navigates to /demo, this activates the global overlay and redirects to home.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startAutoDemo } from "@/lib/demoController";

export default function AutoDemo() {
  const navigate = useNavigate();

  useEffect(() => {
    startAutoDemo();
    // Navigate to home — the overlay is global so it stays visible
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
