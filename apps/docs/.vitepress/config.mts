import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import Components from "unplugin-vue-components/vite";
import { TuDesignResolver } from "../../../packages/vue/src/resolver";
import type { Plugin } from "vite";
import { buildLlmsFullTxt, buildLlmsTxt, listComponents } from "./llms";

const registryDir = fileURLToPath(new URL("../../../packages/vue/registry/vue", import.meta.url));
// vitepress 打包 config 时会把 import.meta.url 重写为原始 config 路径，"../" 即 apps/docs
const docsDir = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");

/** GitHub Pages 项目页部署在仓库子路径下，本地 dev 同样挂在该前缀。 */
const BASE = "/tu-design/";

/** configureServer 先于 Vite 内部 base 剥离执行，各中间件需手动去掉子路径前缀。 */
function stripBasePrefix(url: string): string {
  return url.startsWith(BASE) ? url.slice(BASE.length - 1) : url;
}

/**
 * dev 期以中间件伺服 /r/vue/*.json（CLI `npx @tu-design/cli add` 的数据源）。
 * build 期由下方 buildEnd 钩子复制进 outDir/r/vue。
 */
function registryPlugin(): Plugin {
  return {
    name: "tu-design-registry",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = stripBasePrefix((req.url ?? "").split("?")[0]!);
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

/** 原始 Markdown 文档端点：/guide/<name>.md、/components/<name>.md。 */
const DOC_PAGE_RE = /^\/(guide|components)\/([A-Za-z0-9._-]+)\.md$/;

/**
 * dev 期伺服 LLM 文档入口：/llms.txt、/llms-full.txt 动态生成，
 * /guide/*.md、/components/*.md 返回仓库源 Markdown。
 * build 期由 buildEnd 写入静态产物。
 */
function llmsPlugin(): Plugin {
  return {
    name: "tu-design-llms",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = stripBasePrefix((req.url ?? "").split("?")[0]!);
        if (url === "/llms.txt" || url === "/llms-full.txt") {
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(url === "/llms.txt" ? buildLlmsTxt() : buildLlmsFullTxt());
          return;
        }
        const match = DOC_PAGE_RE.exec(url);
        if (!match) {
          next();
          return;
        }
        const [, dir, name] = match;
        const file = join(docsDir, dir!, `${name}.md`);
        if (!file.startsWith(`${docsDir}/${dir}/`) || !existsSync(file)) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        res.setHeader("content-type", "text/markdown; charset=utf-8");
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

    const warnings: string[] = [];
    const onWarn = (msg: string) => warnings.push(msg);
    const llmsTxt = buildLlmsTxt();
    const llmsFullTxt = buildLlmsFullTxt(onWarn);
    writeFileSync(resolve(siteConfig.outDir, "llms.txt"), llmsTxt, "utf-8");
    writeFileSync(resolve(siteConfig.outDir, "llms-full.txt"), llmsFullTxt, "utf-8");
    // 原始 Markdown 端点：供 LLM / CLI 直接抓取源文档
    cpSync(join(docsDir, "guide"), resolve(siteConfig.outDir, "guide"), { recursive: true });
    cpSync(join(docsDir, "components"), resolve(siteConfig.outDir, "components"), {
      recursive: true,
    });

    for (const message of warnings) {
      console.error(message);
    }
    console.log(
      `[llms] llms.txt：${listComponents().length} 个组件；llms-full.txt：${(llmsFullTxt.length / 1024).toFixed(1)} KiB；告警 ${warnings.length} 条`,
    );
  },
  vite: {
    plugins: [
      tailwindcss(),
      Components({ resolvers: [TuDesignResolver()], dts: false }),
      registryPlugin(),
      llmsPlugin(),
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
            { text: "微前端与沙箱", link: "/guide/micro-frontend" },
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
            {
              text: "时间轴 <span class='sidebar-en'>Timeline</span>",
              link: "/components/timeline",
            },
          ],
        },
        {
          text: "反馈组件",
          items: [
            { text: "警告提示 <span class='sidebar-en'>Alert</span>", link: "/components/alert" },
            { text: "空状态 <span class='sidebar-en'>Empty</span>", link: "/components/empty" },
            {
              text: "进度条 <span class='sidebar-en'>Progress</span>",
              link: "/components/progress",
            },
            { text: "加载 <span class='sidebar-en'>Spin</span>", link: "/components/spin" },
            { text: "消息提示 <span class='sidebar-en'>Toast</span>", link: "/components/toast" },
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
              text: "抽屉 <span class='sidebar-en'>Drawer</span>",
              link: "/components/drawer",
            },
            {
              text: "确认弹窗 <span class='sidebar-en'>AlertDialog</span>",
              link: "/components/alert-dialog",
            },
            {
              text: "气泡确认 <span class='sidebar-en'>Popconfirm</span>",
              link: "/components/popconfirm",
            },
            {
              text: "右键菜单 <span class='sidebar-en'>ContextMenu</span>",
              link: "/components/context-menu",
            },
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
            {
              text: "表格渲染器 <span class='sidebar-en'>TableRender</span>",
              link: "/components/table-render",
            },
          ],
        },
      ],
    },
  },
});
