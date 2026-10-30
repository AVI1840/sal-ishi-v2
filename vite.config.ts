import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// חותמת בנייה: איזה commit רץ בכתובת החיה. נכתבת ל-version.json ומוצגת בתחתית דף הבית,
// ונבדקת על ידי scripts/check-live.mjs אחרי פריסה.
// קודם git של התיקייה שנבנית: בפריסה כל אתר נבנה מ-worktree של הענף שלו, ו-GITHUB_SHA
// שם הוא ה-commit של main (שם רצה הפריסה), לא של /merge/.
const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? "local";
  }
})();
const appVersion = (JSON.parse(readFileSync(path.resolve(__dirname, "public/app-settings.json"), "utf8")) as { version: string }).version;
const builtAt = new Date().toISOString();

const versionFile = (): Plugin => ({
  name: "version-file",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: appVersion, commit, builtAt }, null, 2) + "\n" });
  },
});

export default defineConfig({
  base: "./",
  plugins: [react(), versionFile()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(builtAt),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI libs
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-progress",
            "@radix-ui/react-slot",
          ],
          // Charts: בלי chunk ידני, כדי שייטענו רק עם המסכים הישנים שמשתמשים בהם
          // Data
          "data-mock": [
            "/src/data/mockData.ts",
            "/src/data/clients.ts",
            "/src/data/national.ts",
          ],
        },
      },
    },
  },
});
