// הגדרת Vite משותפת למשטחי השטח והמטה.
// רגיל: נבנה לתוך dist/<app> של האתר הקיים, כך שהכתובת של הכלי לאזרח לא משתנה.
// offline (vite build --mode offline): קובץ HTML יחיד שעובד בלי אינטרנט,
// לשליחה במייל לשותפים שהרשת שלהם חוסמת אתרים חיצוניים.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export function atlasConfig(app: "field" | "hq", port: number) {
  return defineConfig(({ mode }) => {
    const offline = mode === "offline";
    return {
      base: "./",
      plugins: [react(), ...(offline ? [viteSingleFile()] : [])],
      // בלי PostCSS של השורש (Tailwind של הכלי לאזרח). המשטחים בנויים על CSS של מערכת העיצוב.
      css: { postcss: { plugins: [] } },
      server: { port, strictPort: true },
      build: {
        outDir: path.resolve(__dirname, offline ? `../dist/offline/${app}` : `../dist/${app}`),
        emptyOutDir: true,
        chunkSizeWarningLimit: offline ? 5000 : 600,
        rollupOptions: offline
          ? {}
          : {
              output: {
                manualChunks: {
                  "vendor-react": ["react", "react-dom", "react-router-dom", "zustand"],
                  "vendor-xlsx": ["xlsx"],
                  "vendor-charts": ["recharts"],
                },
              },
            },
      },
    };
  });
}
