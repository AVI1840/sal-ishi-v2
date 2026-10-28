import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// נבנה לתוך dist/field של האתר הקיים, כך שהכתובת של הכלי לאזרח לא משתנה.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // בלי PostCSS של השורש (Tailwind של הכלי לאזרח). המשטח בנוי על CSS של מערכת העיצוב.
  css: { postcss: { plugins: [] } },
  server: { port: 5174, strictPort: true },
  build: {
    outDir: path.resolve(__dirname, "../../dist/field"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom", "zustand"],
          "vendor-xlsx": ["xlsx"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
