import { cpSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import Components from "unplugin-vue-components/vite";
import { TuDesignResolver } from "../../../packages/vue/src/resolver";
import type { Plugin } from "vite";

const registryDir = fileURLToPath(new URL("../../../packages/vue/registry/vue", import.meta.url));

/** GitHub Pages 项目页部署在仓库子路径下，本地 dev 同样挂在该前缀。 */
const BASE = "/tu-design/";

/**
 * dev 期以中间件伺服 /r/vue/*.json（CLI `npx tu-design add` 的数据源）。
 * build 期由下方 buildEnd 钩子复制进 outDir/r/vue。
 */
function registryPlugin(): Plugin {
  return {
    name: "tu-design-registry",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let url = (req.url ?? "").split("?")[0]!;
        // configureServer 先于 Vite 内部 base 剥离执行，需手动去掉子路径前缀
        if (url.startsWith(BASE)) {
          url = url.slice(BASE.length - 1);
        }
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
  base: BASE,
  outDir: "dist",
  appearance: true,
  lastUpdated: true,
  buildEnd(siteConfig) {
    cpSync(registryDir, resolve(siteConfig.outDir, "r/vue"), { recursive: true });
  },
  vite: {
    plugins: [
      tailwindcss(),
      Components({ resolvers: [TuDesignResolver()], dts: false }),
      registryPlugin(),
    ],
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
      { text: "GitHub", link: "https://github.com/gopowerteam/tu-design" },
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
            { text: "自动导入", link: "/guide/auto-import" },
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
            { text: "Checkbox", link: "/components/checkbox" },
            { text: "Dialog", link: "/components/dialog" },
            { text: "DropdownMenu", link: "/components/dropdown-menu" },
            { text: "Input", link: "/components/input" },
            { text: "Label", link: "/components/label" },
            { text: "Popover", link: "/components/popover" },
            { text: "RadioGroup", link: "/components/radio-group" },
            { text: "Select", link: "/components/select" },
            { text: "Separator", link: "/components/separator" },
            { text: "Skeleton", link: "/components/skeleton" },
            { text: "Slider", link: "/components/slider" },
            { text: "Tabs", link: "/components/tabs" },
            { text: "Textarea", link: "/components/textarea" },
            { text: "Tooltip", link: "/components/tooltip" },
          ],
        },
      ],
    },
  },
});
