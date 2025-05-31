import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"), // Include content script
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "content"
            ? "content.js"
            : "assets/[name].js";
        },
      },
    },
  },
});
