import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
      alias: {
        "@": path.resolve(__dirname, "../dashboard/src"),
        "@app": path.resolve(__dirname, "./src"),
        "@iprn/api-client": path.resolve(__dirname, "../packages/api-client/src"),
        "@iprn/types": path.resolve(__dirname, "../packages/types/src"),
      },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
