# tu-design 文档站迁移 VitePress 设计文档

- 日期：2026-09-29
- 状态：已评审（方案与依赖决策均经用户确认）
- 范围：`apps/docs/` 整体重构；不改动 `packages/vue/*` 产物行为

## 1. 背景与目标

`apps/docs/` 现为 Vite+ 手写 Vue SPA（vue-router + 自绘侧边栏 + shiki 高亮 + registry dev 中间件），仅 8 个组件页，页面形态统一为「Demo + 安装命令 + 源码」。

目标：迁移到 **VitePress**，并升级为完整文档站：

- 首页（hero + 特性 + CTA）、指南（介绍 / 安装 / CLI / 主题）、组件独立 `.md` 页（含 Props 表格与多用法示例）
- 获得默认主题的侧边栏 / 顶部导航 / 本地搜索 / 暗色模式
- **保留 registry 服务能力**：dev 期 `/r/vue/*.json` 中间件 + build 期复制到产物（`npx tu-design add` CLI 的数据源，不可回退）
- 暗色模式与组件库 tokens 天然联动（`.dark` class 体系）

## 2. 已确认的关键决策

| 决策点         | 结论                                                                         | 理由                                                              |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 集成方案       | **方案 A**：VitePress 默认主题 + Tailwind 按需叠加（无 preflight、layer 化） | 工作量最小；iframe 隔离（方案 B）与完全自定义主题（方案 C）被否决 |
| 内容范围       | 升级为完整文档站（非 1:1 平移）                                              | 用户选定                                                          |
| 部署           | 暂不部署，按根路径配置（`base` 默认 `/`），后续要部署再调                    | 用户选定                                                          |
| VitePress 版本 | **`vitepress@2.0.0-alpha.20`（catalog 精确锁版，不带 `^`）**                 | 见 §9 版本链验证                                                  |
| Props 文档     | 手写 markdown 表格                                                           | 8 个组件规模，自动生成属过度设计（YAGNI）                         |
| Registry 服务  | 必须保留，URL 不变 `/r/vue/*.json`                                           | CLI `npx tu-design add` 依赖                                      |

## 3. 目标目录结构

```
apps/docs/
├── .vitepress/
│   ├── config.mts          # 站点元信息、sidebar/nav、vite 扩展、registry 移植
│   └── theme/
│       ├── index.ts        # extends DefaultTheme；注册 DemoPreview；引 custom.css
│       ├── custom.css      # Tailwind 无 preflight layer 导入 + tokens.css + 冲突对策 + shiki 暗色规则
│       ├── DemoPreview.vue # 预览 + 源码折叠 + 复制（async setup + shiki v4 双主题）
│       └── shiki.ts        # 模块级 highlighter 单例
├── demos/                  # 原 src/demos 平移（8 个 Demo.vue 原样保留，按需增补）
├── index.md                # 首页（hero + 特性 + CTA）
├── guide/
│   ├── introduction.md     # 介绍：tu-design 是什么、设计理念
│   ├── installation.md     # 安装：依赖、Tailwind 配置、tokens 引入
│   ├── cli.md              # CLI：npx tu-design add、registry 机制、utils/tokens 依赖链
│   └── theming.md          # 主题：tokens 变量、暗色模式
├── components/
│   └── {avatar,badge,button,card,input,label,separator,skeleton}.md
├── package.json            # 脚本/依赖改造（§7）
└── tsconfig.json           # include/types 调整（§8）
```

**删除**：`index.html`、`vite.config.ts`、`env.d.ts`、`src/`（App.vue、router.ts、pages/ComponentPage.vue、style.css）。

## 4. 信息架构

- **nav**：指南 / 组件 / GitHub 链接（占位，后续补）
- **sidebar** 两组：
  - 指南：介绍 → 安装 → CLI → 主题
  - 组件：avatar / badge / button / card / input / label / separator / skeleton
- **站点配置**：`lang: 'zh-CN'`、`appearance: true`、`lastUpdated: false`（迁移期修正：vp run 环境的 PATH 前置 pnpm bin 目录含名为 `git` 的空目录，vitepress 的 git 时间戳缓存会 EISDIR；待用户清理环境异物后可恢复 true）、`outDir: 'dist'`、`themeConfig.search.provider: 'local'`
- 本地搜索为 minisearch（alpha.20 为 ^7），默认分词对 CJK 不友好；预留 `miniSearch.options` 自定义 tokenizer（如 `Intl.Segmenter`）作为调优点，不阻塞首版

### 组件页形态（以 button.md 为例）

````md
# Button

带变体与尺寸的按钮，支持 as 标签切换。 ← 取自 registry.meta.json

## 演示

<DemoPreview file="button/ButtonDemo.vue" />

## 安装

（markdown 原生 ```bash 代码块，走 VitePress 内置高亮）

## Props / Slots

（手写表格）

## 用法

### 变体

<DemoPreview file="button/ButtonVariants.vue" />
````

新增组件 = 新增 `.md` + demo 文件 + config sidebar 一行。

## 5. DemoPreview 组件

- **Props**：`file: string`，相对 `demos/` 路径，如 `"button/ButtonDemo.vue"`
- **数据**：双 glob
  - `import.meta.glob("../../demos/**/*.vue")`（lazy）→ `defineAsyncComponent` 渲染预览
  - 同 glob + `{ query: "?raw", import: "default", eager: true }` → 源码
- **高亮**：`theme/shiki.ts` 导出模块级单例 `getHighlighter()`（`createHighlighter({ themes: ['github-light','github-dark'], langs: ['vue','ts','bash'] })`）；shiki v4 `codeToHtml(code, { lang, themes })` 双主题
- **交互**：预览区 + 底部工具条（展开/收起源码、复制；`navigator.clipboard` 仅在事件回调中调用）
- **SSR/SSG**：async setup 顶层 `await` 高亮——VitePress 内容渲染处于 Suspense 内，静态 HTML 含高亮结果，水合一致
- **fail fast**：`file` 对应源码不存在时构建期 throw，不静默渲染空预览
- **逃生口**：浏览器强依赖示例用 VitePress 内置 `<ClientOnly>` 包裹
- **暗色规则**（custom.css）：

```css
html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

## 6. Tailwind 集成与样式冲突对策

`theme/custom.css`：

```css
/* Tailwind 4 官方「无 preflight」layer 化导入，不重置 VitePress 主题 */
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);

/* 组件库 tokens（.dark 变量 + @theme inline），路径 apps/packages/vue */
@import "../../../../packages/vue/src/styles/tokens.css";
```

- tokens.css 的 `@custom-variant dark (&:where(.dark, .dark *))` 与 VitePress 在 `<html>` 上切换 `.dark` 天然对齐
- **已知风险**：CSS 层叠中 unlayered 样式优先于 layered；VitePress 默认主题 `.vp-doc` 的元素样式（`p` 外边距、`ul` 列表样式、`a` 颜色/下划线等）是 unlayered，会渗透进 demo 区（如 `Button variant="link"` 渲染的 `<a>`）
- **对策**：custom.css 尾部追加 `.tu-demo` 作用域重置段（覆盖 `.vp-doc` 对 `p/ul/ol/a/code/table` 的预设：margin / list-style / text-decoration / 颜色继承）。`theme/index.ts` 中 `import "./custom.css"` 位于默认主题导入之后，产物源顺序靠后，同特异性下胜出
- 预览容器使用 VitePress CSS 变量（`--vp-c-bg`、`--vp-c-divider` 等）保证明暗观感一致
- Vite 插件：`vite.plugins: [tailwindcss(), registryPlugin()]`

## 7. Registry 服务移植

`config.mts` 内拆分两半（不搬原 `closeBundle`，其相对路径在新结构下会写错位置）：

- **dev**：vite 插件 `configureServer` 中间件，逻辑原样保留（`/r/vue/*.json` URL 校验、路径穿越防护、404、content-type）
- **build**：VitePress `buildEnd(siteConfig)` 钩子：`cpSync(registryDir, resolve(siteConfig.outDir, "r/vue"), { recursive: true })`
- alias 保留两项：`"@"` → `../../../packages/vue/src`（组件源码内部 `import "@/lib/utils"` 的真实依赖）、`"@tu-design/vue"` → `../../../packages/vue/src/index.ts`（config.mts 位于 `.vitepress/` 下，相对深度均多一层）（spec §7）
- 验收：dev 下 `curl localhost:5173/r/vue/button.json` 返回 JSON；build 后 `dist/r/vue/` 含 11 个 JSON（8 组件 + tokens + utils + registry.json）

## 8. 依赖、脚本与工程配置

### 8.1 pnpm-workspace.yaml catalog

```yaml
vitepress: "2.0.0-alpha.20" # 精确锁版，不带 ^
shiki: ^4.4.3 # ^3 → ^4.4.3：唯一消费者 docs，与 vitepress 内置对齐
```

- `overrides` **不动**：`vite@*: "catalog:"` → vite-plus-core@1.0.0（内嵌 vite 8.3.1 / rolldown 1.2.11）∈ alpha.20 要求 `^8.2.1`，全仓库维持单一 vite 线
- `vue-router`：docs 移除后若无全仓库消费者则一并清理（实施时 grep 确认）

### 8.2 apps/docs/package.json

| 项              | 现值       | 新值                                                                                            |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| scripts.dev     | `vp dev`   | `vitepress dev`                                                                                 |
| scripts.build   | `vp build` | `vitepress build`                                                                               |
| scripts.preview | —          | `vitepress preview`（新增）                                                                     |
| devDeps 移除    | —          | `vue-router`、`@vitejs/plugin-vue`、`vite-plus`                                                 |
| devDeps 新增    | —          | `vitepress: catalog:`                                                                           |
| 保留            | —          | `@tu-design/vue`（workspace）、`vue`、`shiki`、`tailwindcss`、`@tailwindcss/vite`（均 catalog） |

根 `ready: vp run -r build` 递归执行 docs 的 `vitepress build`，工作流不变。

### 8.3 tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "types": ["vitepress/client"],
  },
  "include": [".vitepress/**/*.ts", ".vitepress/**/*.mts", ".vitepress/**/*.vue", "demos/**/*.vue"],
}
```

删除 `env.d.ts`（其 `*.vue` shim 由 `vitepress/client` 内置覆盖；`*.css` 声明实施时验证，有缺口则保留一行 shim）。

### 8.4 .gitignore

追加 `apps/docs/.vitepress/cache`（`apps/docs/dist` 已被现有通配 `dist` 覆盖）。

## 9. 版本链验证记录（决策依据）

| 环节                          | 值                                                              | 验证方式                                         |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| vitepress 2.0.0-alpha.20 要求 | `vite: ^8.2.1`，`vue: ^3.5.41`，shiki `^4.4.3`，minisearch `^7` | registry 实查                                    |
| 本仓库 override 提供方        | vite-plus-core@1.0.0 → 内嵌 **vite 8.3.1**（rolldown 1.2.11）   | import 其 `dist/vite/node/index.js` 读 `version` |
| 匹配                          | 8.3.1 ∈ ^8.2.1 ✓；vue = catalog ✓                               | —                                                |
| @tailwindcss/vite@4.3.3       | peer `vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8` ✓                      | 已装包 manifest                                  |
| Node                          | vite 8 需 ≥20.19/22.12；仓库强制 ≥22.18 ✓                       | package.json                                     |
| 暗色对齐                      | tokens.css `.dark {}` ↔ VitePress `<html>.dark` ✓               | 源码核对                                         |

## 10. 验证步骤

1. `vp install`——预期 pnpm 对 vite alias 仅提示不阻断
2. `vitepress dev` 手动验证：首页/指南/组件页渲染、侧边栏/搜索、**暗色切换时 demo 与代码块同步换肤**、demo 交互（Button 变体、Avatar 回退）；`curl localhost:5173/r/vue/button.json`
3. `vitepress build` 后：`dist/index.html` 存在；`dist/r/vue/` 11 个 JSON 齐全；抽查静态 HTML 中 demo 高亮已预渲染
4. `vp check` + 根 `vp run ready` 全链路
5. `.tu-demo` 冲突对策逐项验证（link 按钮、列表、段落间距在文档主题下的表现）

## 11. 风险与 Fallback

| 风险                        | 等级 | 对策                                                                                                                                       |
| --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| alpha 期间 breaking 变更    | 中   | catalog 精确锁版；**Fallback**：切回 `vitepress@1.6.4` + overrides 增 `"vitepress>vite": "^5.4.14"`（仅 catalog/overrides 两处改动，可逆） |
| `.vp-doc` 样式渗透 demo 区  | 中   | `.tu-demo` 重置段（§6）；实现期逐组件验证                                                                                                  |
| 本地搜索中文体验            | 低   | 预留 tokenizer 配置点；必要时后续接 docsearch                                                                                              |
| demo SSR 不兼容（未来示例） | 低   | `<ClientOnly>` 逃生口                                                                                                                      |
| demo 与源码漂移             | 低   | DemoPreview 单一数据源：同一 glob 文件既渲染又展示源码                                                                                     |

## 12. 明确不做（YAGNI）

- Props 自动生成（从源码提取类型生成表格）
- iframe 演示隔离 / 完全自定义主题
- 部署与 base/CDN 配置（后续独立任务）
- 多语言（仅 zh-CN）
