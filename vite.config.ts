import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["lucide-react"],
  },
  build: {
    sourcemap: false, // Disable source maps for the build
  },
  server: {
    sourcemapIgnoreList: (sourcePath) => /node_modules/.test(sourcePath), // Ignore source map warnings for node_modules
  },
});
