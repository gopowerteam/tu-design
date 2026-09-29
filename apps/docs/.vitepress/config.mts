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
  // lastUpdated 关闭：vp run 环境会把 vite-plus 的 pnpm bin 目录前置到 PATH，
  // 其中存在名为 `git` 的空目录，导致 vitepress 按 PATH 解析 git 时报 EISDIR。
  // 详见 ledger Task 6 Ruling 与 spec §4。
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
    nav: [
      { text: "指南", link: "/guide/introduction", activeMatch: "/guide/" },
      { text: "组件", link: "/components/button", activeMatch: "/components/" },
      { text: "GitHub", link: "https://github.com/zhuchentong/tu-design" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "介绍", link: "/guide/introduction" },
            { text: "安装", link: "/guide/installation" },
            { text: "CLI", link: "/guide/cli" },
            { text: "主题", link: "/guide/theming" },
          ],
        },
      ],
      "/components/": [
        {
          text: "组件",
          items: [
            { text: "Avatar", link: "/components/avatar" },
            { text: "Badge", link: "/components/badge" },
            { text: "Button", link: "/components/button" },
            { text: "Card", link: "/components/card" },
            { text: "Input", link: "/components/input" },
            { text: "Label", link: "/components/label" },
            { text: "Separator", link: "/components/separator" },
            { text: "Skeleton", link: "/components/skeleton" },
          ],
        },
      ],
    },
  },
});
