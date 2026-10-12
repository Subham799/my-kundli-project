import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy all /api/* requests to Flask backend during dev
      "/api": {
        target:       "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
