import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        // 👇 All external modules bundled in!
        format: "iife",
        entryFileNames: "content.js",
      },
    },
  },
});
