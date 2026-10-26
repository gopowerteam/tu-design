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
      { text: "组件", link: "/components/", activeMatch: "/components/" },
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
        { text: "总览", link: "/components/" },
        {
          text: "基础组件",
          items: [
            { text: "头像 <span class='sidebar-en'>Avatar</span>", link: "/components/avatar" },
            {
              text: "头像组 <span class='sidebar-en'>AvatarGroup</span>",
              link: "/components/avatar-group",
            },
            { text: "徽章 <span class='sidebar-en'>Badge</span>", link: "/components/badge" },
            { text: "按钮 <span class='sidebar-en'>Button</span>", link: "/components/button" },
            { text: "日历 <span class='sidebar-en'>Calendar</span>", link: "/components/calendar" },
            { text: "卡片 <span class='sidebar-en'>Card</span>", link: "/components/card" },
            {
              text: "分隔线 <span class='sidebar-en'>Separator</span>",
              link: "/components/separator",
            },
            {
              text: "骨架屏 <span class='sidebar-en'>Skeleton</span>",
              link: "/components/skeleton",
            },
          ],
        },
        {
          text: "表单组件",
          items: [
            { text: "表单 <span class='sidebar-en'>Form</span>", link: "/components/form" },
            {
              text: "级联选择 <span class='sidebar-en'>Cascader</span>",
              link: "/components/cascader",
            },
            {
              text: "多选框 <span class='sidebar-en'>Checkbox</span>",
              link: "/components/checkbox",
            },
            {
              text: "金额输入 <span class='sidebar-en'>CurrencyInput</span>",
              link: "/components/currency-input",
            },
            {
              text: "日期选择 <span class='sidebar-en'>DatePicker</span>",
              link: "/components/date-picker",
            },
            {
              text: "日期范围选择 <span class='sidebar-en'>DateRangePicker</span>",
              link: "/components/date-range-picker",
            },
            {
              text: "月份选择 <span class='sidebar-en'>MonthPicker</span>",
              link: "/components/month-picker",
            },
            {
              text: "周选择 <span class='sidebar-en'>WeekPicker</span>",
              link: "/components/week-picker",
            },
            {
              text: "年份选择 <span class='sidebar-en'>YearPicker</span>",
              link: "/components/year-picker",
            },
            { text: "输入框 <span class='sidebar-en'>Input</span>", link: "/components/input" },
            { text: "标签 <span class='sidebar-en'>Label</span>", link: "/components/label" },
            {
              text: "数字输入 <span class='sidebar-en'>NumberInput</span>",
              link: "/components/number-input",
            },
            {
              text: "密码输入 <span class='sidebar-en'>PasswordInput</span>",
              link: "/components/password-input",
            },
            {
              text: "验证码输入 <span class='sidebar-en'>PinInput</span>",
              link: "/components/pin-input",
            },
            {
              text: "单选组 <span class='sidebar-en'>RadioGroup</span>",
              link: "/components/radio-group",
            },
            { text: "选择器 <span class='sidebar-en'>Select</span>", link: "/components/select" },
            { text: "滑块 <span class='sidebar-en'>Slider</span>", link: "/components/slider" },
            { text: "开关 <span class='sidebar-en'>Switch</span>", link: "/components/switch" },
            {
              text: "文本域 <span class='sidebar-en'>Textarea</span>",
              link: "/components/textarea",
            },
            {
              text: "树选择 <span class='sidebar-en'>TreeSelect</span>",
              link: "/components/tree-select",
            },
          ],
        },
        {
          text: "交互组件",
          items: [
            { text: "对话框 <span class='sidebar-en'>Dialog</span>", link: "/components/dialog" },
            {
              text: "下拉菜单 <span class='sidebar-en'>DropdownMenu</span>",
              link: "/components/dropdown-menu",
            },
            { text: "气泡 <span class='sidebar-en'>Popover</span>", link: "/components/popover" },
            { text: "标签页 <span class='sidebar-en'>Tabs</span>", link: "/components/tabs" },
            {
              text: "文字提示 <span class='sidebar-en'>Tooltip</span>",
              link: "/components/tooltip",
            },
          ],
        },
        {
          text: "高阶组件",
          items: [
            {
              text: "表单渲染器 <span class='sidebar-en'>FormRender</span>",
              link: "/components/form-render",
            },
          ],
        },
      ],
    },
  },
});
