import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@tu-design/vue": fileURLToPath(new URL("../../packages/vue/src/index.ts", import.meta.url)),
    },
  },
});
