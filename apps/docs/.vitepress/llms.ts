import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

/** GitHub Pages 站点根地址，llms.txt 内链接一律为带 .html 的绝对地址。 */
export const SITE_URL = "https://gopowerteam.github.io/tu-design/";

// vitepress 打包 config 时会把 import.meta.url 重写为原始 config 路径
// （apps/docs/.vitepress/config.mts），因此 apps/docs 用 "../" 解析、仓库根用 "../../../"。
const docsDir = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const demosDir = join(docsDir, "demos");
const registryIndexPath = fileURLToPath(
  new URL("../../../packages/vue/registry/vue/registry.json", import.meta.url),
);

const DEMO_PREVIEW_RE = /<DemoPreview\s+file="([^"]+)"\s*\/>/g;
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const SECTION_SEPARATOR = "\n\n---\n\n";

/** registry 中 type 为 registry:ui 但属于内部共享实现、无独立文档页的项。 */
const INTERNAL_ITEMS = new Set([
  "date-shared",
  "icon-shared",
  "overlay-shared",
  "slot",
  "tree-shared",
]);

/** llms.txt 固定收录的指南页（顺序即输出顺序）。 */
const GUIDE_PAGES = [
  { page: "introduction", title: "介绍", description: "tu-design 是什么、核心特性与设计理念" },
  { page: "installation", title: "安装", description: "安装 @tu-design/vue 与样式接入步骤" },
  { page: "cli", title: "CLI", description: "@tu-design/cli 命令行（init/add/diff/mcp）用法" },
  { page: "theming", title: "主题", description: "Tailwind v4 + oklch CSS 变量主题定制" },
  {
    page: "auto-import",
    title: "自动导入",
    description: "unplugin-vue-components + TuDesignResolver 按需导入",
  },
] as const;

interface RegistryIndex {
  items: Array<{ name: string; title: string; type: string; description: string }>;
}

/**
 * 从 registry.json 取对外组件清单：只收录 registry:ui 且排除内部共享项。
 * @returns 对外组件列表（name/title/description），按 registry 顺序排列
 */
export function listComponents(): Array<{ name: string; title: string; description: string }> {
  const registry = JSON.parse(readFileSync(registryIndexPath, "utf-8")) as RegistryIndex;
  return registry.items
    .filter((item) => item.type === "registry:ui" && !INTERNAL_ITEMS.has(item.name))
    .map(({ name, title, description }) => ({ name, title, description }));
}

/**
 * 把 <DemoPreview file="…" /> 展开为 demos 源码的 vue 围栏代码块；文件缺失时保留原标签并告警。
 * @param md - 含 DemoPreview 标签的 Markdown 文本
 * @param onWarn - 示例源文件缺失时的告警回调（可选）
 * @returns 展开示例源码后的 Markdown 文本
 */
export function expandDemoPreviews(md: string, onWarn?: (msg: string) => void): string {
  return md.replace(DEMO_PREVIEW_RE, (tag, file: string) => {
    const demoFile = join(demosDir, file);
    if (!demoFile.startsWith(`${demosDir}/`) || !existsSync(demoFile)) {
      onWarn?.(`[llms] DemoPreview 源文件缺失：${file}`);
      return tag;
    }
    const title = basename(file).replace(/\.vue$/, "");
    const source = readFileSync(demoFile, "utf-8").trimEnd();
    return `**示例：${title}**\n\n\`\`\`vue\n${source}\n\`\`\``;
  });
}

/**
 * 去掉文档开头的 YAML frontmatter。
 * @param md - 原始 Markdown 文本
 * @returns 剥离 frontmatter 后的正文
 */
export function stripFrontmatter(md: string): string {
  return md.replace(FRONTMATTER_RE, "");
}

/**
 * 生成 llmstxt.org 格式的 llms.txt（索引版）。
 * @returns 站点标题 + 简介 + Guide/Components 链接索引的全文文本
 */
export function buildLlmsTxt(): string {
  const lines = [
    "# tu-design",
    "",
    "> shadcn 风格的 Vue 3 组件库：Tailwind v4 + oklch CSS 变量主题 + Ark UI 无头原语，组件以源码形式分发，安装组件用 `npx @tu-design/cli add <name>`。",
    "",
    "## Guide",
    "",
    ...GUIDE_PAGES.map(
      (page) => `- [${page.title}](${SITE_URL}guide/${page.page}.html): ${page.description}`,
    ),
    "",
    "## Components",
    "",
    ...listComponents().map(
      (item) => `- [${item.title}](${SITE_URL}components/${item.name}.html): ${item.description}`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}

/**
 * 读取 docs 下的单页 Markdown 源文（路径约束在 docsDir 对应目录内，防越界访问）。
 * @param dir - 文档目录（guide 或 components）
 * @param name - 页面名（不含扩展名）
 * @returns 文件全文；越界或不存在时返回 null
 */
function readDocPage(dir: "guide" | "components", name: string): string | null {
  const file = join(docsDir, dir, `${name}.md`);
  if (!file.startsWith(`${docsDir}/${dir}/`) || !existsSync(file)) {
    return null;
  }
  return readFileSync(file, "utf-8");
}

/**
 * 页首保留已有的一级标题；缺失时用 fallback 生成。
 * @param md - 页面 Markdown 正文
 * @param fallbackTitle - 正文无一级标题时使用的页面标题
 * @returns 保证以一级标题开头的 Markdown 文本
 */
function withH1(md: string, fallbackTitle: string): string {
  const body = md.trim();
  return body.startsWith("# ") ? body : `# ${fallbackTitle}\n\n${body}`;
}

/**
 * 生成 llms-full.txt：指南五页 + 全部组件文档全文（frontmatter 剥离、DemoPreview 展开）。
 * @param onWarn - 指南/组件文档或示例源文件缺失时的告警回调（可选）
 * @returns 全部章节按分隔符拼接的完整文本
 */
export function buildLlmsFullTxt(onWarn?: (msg: string) => void): string {
  const sections: string[] = [];

  for (const page of GUIDE_PAGES) {
    const raw = readDocPage("guide", page.page);
    if (raw === null) {
      onWarn?.(`[llms] 指南文档缺失：guide/${page.page}.md`);
      continue;
    }
    sections.push(withH1(expandDemoPreviews(stripFrontmatter(raw), onWarn), page.title));
  }

  for (const item of listComponents()) {
    const raw = readDocPage("components", item.name);
    if (raw === null) {
      onWarn?.(`[llms] 组件文档缺失：components/${item.name}.md`);
      continue;
    }
    sections.push(withH1(expandDemoPreviews(stripFrontmatter(raw), onWarn), item.title));
  }

  return `${sections.join(SECTION_SEPARATOR)}\n`;
}
