import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  lang: "zh-CN",
  title: "tu-design",
  description: "tu-design 组件库文档",
  outDir: "dist",
  appearance: true,
  lastUpdated: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("../../../packages/vue/src", import.meta.url)),
        "@tu-design/vue": fileURLToPath(
          new URL("../../../packages/vue/src/index.ts", import.meta.url),
        ),
      },
    },
  },
  themeConfig: {
    search: { provider: "local" },
  },
});
