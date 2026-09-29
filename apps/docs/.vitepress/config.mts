import { cpSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

const registryDir = fileURLToPath(new URL("../../../packages/vue/registry/vue", import.meta.url));

/**
 * dev 期以中间件伺服 /r/vue/*.json（CLI `npx tu-design add` 的数据源）。
 * build 期由下方 buildEnd 钩子复制进 outDir/r/vue。
 */
function registryPlugin(): Plugin {
  return {
    name: "tu-design-registry",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0]!;
        if (!url.startsWith("/r/vue/")) {
          next();
          return;
        }
        const name = decodeURIComponent(url.slice("/r/vue/".length));
        if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        const file = join(registryDir, name);
        if (!file.startsWith(`${registryDir}/`) || !existsSync(file)) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(readFileSync(file));
      });
    },
  };
}

export default defineConfig({
  lang: "zh-CN",
  title: "tu-design",
  description: "tu-design 组件库文档",
  outDir: "dist",
  appearance: true,
  lastUpdated: true,
  buildEnd(siteConfig) {
    cpSync(registryDir, resolve(siteConfig.outDir, "r/vue"), { recursive: true });
  },
  vite: {
    plugins: [tailwindcss(), registryPlugin()],
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
