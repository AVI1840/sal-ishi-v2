// בניית הדוכן לקובץ HTML יחיד שעובד בלי רשת: npm run build:booth
// התמונות נשארות בתיקיית images לצד הקובץ (כל התיקייה dist-booth-offline מועתקת למכשיר).
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

// בלי גופנים חיצוניים: הדוכן עלול להיות בלי רשת, והגופן נופל ל-Heebo/Rubik אם מותקנים, אחרת Arial.
const noExternalFonts = (): Plugin => ({
  name: "booth-no-external-fonts",
  transformIndexHtml: (html) => html.replace(/<link[^>]+(fonts\.googleapis|fonts\.gstatic)[^>]*>/g, ""),
});

// Heebo ארוז רק בבניית הדוכן: מוסיפים את קובץ הגופן לכניסה של האפליקציה כאן, ולא בקוד המשותף.
const boothFonts = (): Plugin => ({
  name: "booth-fonts",
  enforce: "pre",
  transform(code, id) {
    return id.split("\\").join("/").endsWith("/src/main.tsx") ? { code: 'import "./booth/booth-fonts.css";\n' + code, map: null } : null;
  },
});

export default defineConfig({
  base: "./",
  plugins: [react(), noExternalFonts(), boothFonts(), viteSingleFile()],
  define: { "import.meta.env.VITE_EDITION": JSON.stringify("booth"), __BUILD_COMMIT__: JSON.stringify("booth"), __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { outDir: "dist-booth-offline", emptyOutDir: true, chunkSizeWarningLimit: 5000 },
});
