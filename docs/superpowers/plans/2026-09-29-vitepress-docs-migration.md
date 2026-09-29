# tu-design 文档站 VitePress 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/docs/` 从 Vite+ 手写 SPA 迁移为 VitePress 完整文档站（首页 + 指南 + 8 组件页），保留 registry 服务。

**Architecture:** VitePress 默认主题 + 自定义 theme 扩展（Tailwind 无 preflight layer 导入 + tokens.css + DemoPreview 全局组件）；registry 服务拆为 dev 中间件 + `buildEnd` 复制；shiki v4 模块级单例双主题高亮。

**Tech Stack:** vitepress@2.0.0-alpha.20、Tailwind CSS 4（@tailwindcss/vite）、shiki ^4.4.3、Vue 3.5、pnpm catalog + vite-plus 工具链。

**Spec:** `docs/superpowers/specs/2026-09-29-vitepress-docs-migration-design.md`（计划依据 spec，执行者需同时阅读）

## Global Constraints

- `vitepress: "2.0.0-alpha.20"` catalog **精确锁版，不带 `^`**（spec §8.1）
- `shiki: ^4.4.3`（catalog 由 ^3 升级，spec §8.1）
- `pnpm-workspace.yaml` 的 `overrides` **保持不动**（`vite@*: "catalog:"` → vite-plus-core = rolldown-vite 8.3.1 ∈ alpha.20 要求 `^8.2.1`，spec §9）
- registry URL 不变：`/r/vue/*.json`；build 产物 `dist/r/vue/` 含 **11 个 JSON**（8 组件 + tokens + utils + registry.json）（spec §7）
- `outDir: 'dist'`；`lang: 'zh-CN'`；`appearance: true`；`lastUpdated: true`；`themeConfig.search.provider: 'local'`（spec §4）
- vite alias **仅保留** `"@tu-design/vue"` → `packages/vue/src/index.ts`（spec §7）
- 删除：`apps/docs/index.html`、`vite.config.ts`、`env.d.ts`、`src/`（spec §3）
- 提交信息：中文约定式 + emoji（仓库规范）
- commit 仅在计划步骤明示时执行（用户批准计划即授权其中 commit 步骤）

## Review Focus

1. **registry 恶意路径**：`curl /r/vue/..%2f..%2ftokens.css`、`/r/vue/a.txt`、`/r/vue/../../package.json` → 全部 404，仅 `^[A-Za-z0-9._-]+\.json$` 且位于 registryDir 内的文件可访问（Task 2 步骤 5）
2. **DemoPreview 不存在的 file**：`<DemoPreview file="nope/Foo.vue" />` → dev 请求与 build 均 throw（fail fast），不得静默空预览（Task 3 步骤 6）
3. **暗色切换一致性**：切 `.dark` 后 demo 组件（tokens 变量）与 shiki 代码块（`--shiki-dark` 变量）同步换肤，预览容器观感跟随 `--vp-c-*`（Task 3 步骤 7 手动核对）
4. **`.vp-doc` 样式渗透**：`Button variant="link"`（渲染 `<a>`）、列表、段落落在 demo 容器内不被默认主题元素样式污染（Task 1 步骤 7 起持续观察，Task 5 组件页复核）
5. **registry JSON schema 不变**：`dist/r/vue/button.json` 结构与 `packages/vue/registry/vue/button.json` 一致（`cpSync` 原样复制，不加工）（Task 2 步骤 4）

---

### Task 1: 依赖切换与 VitePress 工程骨架

**Files:**

- Modify: `pnpm-workspace.yaml`（catalog 两处）
- Modify: `apps/docs/package.json`
- Modify: `apps/docs/tsconfig.json`
- Modify: `.gitignore`
- Create: `apps/docs/.vitepress/config.mts`（最小版）
- Create: `apps/docs/.vitepress/theme/index.ts`
- Create: `apps/docs/.vitepress/theme/custom.css`（完整版）
- Move: `apps/docs/src/demos` → `apps/docs/demos`（git mv）
- Delete: `apps/docs/index.html`、`apps/docs/vite.config.ts`、`apps/docs/env.d.ts`、`apps/docs/src/`（其余文件）
- Create: `apps/docs/index.md`（临时占位，Task 4 重写）

**Interfaces:**

- Consumes: spec §3/§6/§8
- Produces: `vitepress dev` 可启动；`theme/custom.css` 提供 Tailwind utilities + tokens（后续所有任务依赖）；`theme/index.ts` 为后续 enhanceApp 注册入口

- [ ] **Step 1: 修改 catalog 与 package.json**

`pnpm-workspace.yaml` catalog：`vitepress: "2.0.0-alpha.20"`（精确）、`shiki: ^4.4.3`（替换 ^3.0.0）。`apps/docs/package.json` scripts 改为 `dev: "vitepress dev"`、`build: "vitepress build"`、`preview: "vitepress preview"`；devDependencies 仅保留 `@tailwindcss/vite`、`shiki`、`tailwindcss`、`vitepress`（均 `catalog:`），移除 `vue-router`、`@vitejs/plugin-vue`、`vite-plus`；dependencies 保留 `@tu-design/vue`、`vue`。

- [ ] **Step 2: 迁移 demos、删除旧入口**

```bash
git mv apps/docs/src/demos apps/docs/demos
git rm apps/docs/index.html apps/docs/vite.config.ts apps/docs/env.d.ts apps/docs/src/App.vue apps/docs/src/router.ts apps/docs/src/pages/ComponentPage.vue apps/docs/src/style.css apps/docs/src/main.ts
```

- [ ] **Step 3: 写 config.mts 最小版、theme/index.ts、custom.css**

`config.mts`：`defineConfig({ lang: 'zh-CN', title: 'tu-design', description: 'tu-design 组件库文档', outDir: 'dist', appearance: true, lastUpdated: true, vite: { plugins: [tailwindcss()], resolve: { alias: { '@tu-design/vue': fileURLToPath(new URL('../../packages/vue/src/index.ts', import.meta.url)) } } }, themeConfig: { search: { provider: 'local' } } })`（registry 插件 Task 2 再加）。

`theme/index.ts`：`import DefaultTheme from "vitepress/theme"; import "./custom.css"; export default { extends: DefaultTheme };`（enhanceApp Task 3 再加）。

`custom.css` 按 spec §6 原文：`@layer theme, base, components, utilities;` + 两条 layer 化 tailwind 导入 + `@import "../../../packages/vue/src/styles/tokens.css";` + 尾部 `.tu-demo` 重置段（`.vp-doc .tu-demo` 作用域恢复 `p` margin、`ul/ol` list-style 与 padding、`a` 颜色继承与去下划线、`code`/`table` 预设），预览容器变量 `var(--vp-c-bg)`/`var(--vp-c-divider)` 留待 Task 3 使用。

- [ ] **Step 4: 更新 tsconfig.json 与 .gitignore**

tsconfig：`"types": ["vitepress/client"]`，`include: [".vitepress/**/*.ts", ".vitepress/**/*.mts", ".vitepress/**/*.vue", "demos/**/*.vue"]`。.gitignore 追加 `apps/docs/.vitepress/cache`。

- [ ] **Step 5: 安装并验证 dev 可启动**

Run: `vp install && (cd apps/docs && timeout 25 pnpm dev & sleep 15 && curl -sf http://localhost:5173 | grep -q "tu-design" && kill %1)`
Expected: install 无阻断错误（vite alias 相关仅警告）；curl 返回 0
再写临时 `apps/docs/index.md`（一行 `# tu-design`）供本轮验证。

- [ ] **Step 6: 验证 tokens 与 utilities 生效**

临时 index.md 临时加入 `<div class="tu-demo"><Button variant="outline">Outline</Button></div>` 风格验证段（从 demos 引入 ButtonDemo 需 Task 3 组件化，本轮仅核对 custom.css 编译无错、`.dark` 切换后 tokens 变量变化）。
Run: dev 页面控制台无 CSS 报错，切换暗色背景变量翻转。
Expected: 通过后移除临时验证段。

- [ ] **Step 7: Commit**

```bash
git add -A apps/docs pnpm-workspace.yaml .gitignore
git commit -m "🔧 chore(docs): 切换 docs 至 vitepress@2.0.0-alpha.20 工程骨架"
```

### Task 2: Registry 服务移植

**Files:**

- Modify: `apps/docs/.vitepress/config.mts`

**Interfaces:**

- Consumes: Task 1 的 config.mts 骨架
- Produces: dev URL `/r/vue/<name>.json`；build 产物 `dist/r/vue/*.json`（11 个文件，schema 原样）

- [ ] **Step 1: config.mts 增加 registryPlugin（仅 configureServer）**

从旧 `apps/docs/vite.config.ts:11-36` 原样移植中间件逻辑（URL 校验正则、路径穿越防护、404、`content-type: application/json; charset=utf-8`），`registryDir` 指向 `../../packages/vue/registry/vue`；`vite.plugins` 追加 `registryPlugin()`。**不移植 `closeBundle`**（spec §7）。

- [ ] **Step 2: 增加 buildEnd 钩子**

`buildEnd(siteConfig) { cpSync(registryDir, resolve(siteConfig.outDir, "r/vue"), { recursive: true }); }`

- [ ] **Step 3: dev 期验证**

Run: `(cd apps/docs && timeout 20 pnpm dev & sleep 12 && curl -sf http://localhost:5173/r/vue/button.json | head -c 80; kill %1)`
Expected: 输出 button.json 开头 `{"$schema":"https://ui.shadcn.com/schema/registry-item.json"...`

- [ ] **Step 4: build 期验证**

Run: `(cd apps/docs && pnpm build) && ls apps/docs/dist/r/vue | sort`
Expected: 输出 11 个文件：`avatar.json badge.json button.json card.json input.json label.json registry.json separator.json skeleton.json tokens.json utils.json`

- [ ] **Step 5: 恶意路径验证（Review Focus 1）**

Run: dev 下依次 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/r/vue/a.txt`、`.../r/vue/..%2f..%2fpackage.json`
Expected: 均 `404`

- [ ] **Step 6: Commit**

```bash
git add apps/docs/.vitepress/config.mts
git commit -m "✨ feat(docs): 移植 registry 服务（dev 中间件 + buildEnd 复制）"
```

### Task 3: DemoPreview 组件与 shiki 双主题

**Files:**

- Create: `apps/docs/.vitepress/theme/shiki.ts`
- Create: `apps/docs/.vitepress/theme/DemoPreview.vue`
- Modify: `apps/docs/.vitepress/theme/index.ts`（enhanceApp 注册全局组件）
- Modify: `apps/docs/.vitepress/theme/custom.css`（追加 shiki 暗色规则，spec §5 原文）

**Interfaces:**

- Consumes: `apps/docs/demos/**`（Task 1 迁移）；custom.css 的 `.tu-demo` 容器类
- Produces: 全局组件 `<DemoPreview file: string />`（`file` 为相对 `demos/` 路径，如 `"button/ButtonDemo.vue"`）；`theme/shiki.ts` 导出 `getHighlighter(): Promise<Highlighter>`（模块级单例，`themes: ['github-light','github-dark']`，`langs: ['vue','ts','bash']`）

- [ ] **Step 1: 实现 shiki.ts 单例**

```ts
import { createHighlighter, type Highlighter } from "shiki";
let promise: Promise<Highlighter> | undefined;
export function getHighlighter() {
  promise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["vue", "ts", "bash"],
  });
  return promise;
}
```

- [ ] **Step 2: 实现 DemoPreview.vue**

签名与关键决策（正文自写）：`defineProps<{ file: string }>()`；双 glob（key 前缀 `../../demos/`）：lazy glob → `defineAsyncComponent(loader)`；`{ query: "?raw", import: "default", eager: true }` glob → 源码字符串。async setup 顶层 `const html = await getHighlighter().then(h => h.codeToHtml(code, { lang: "vue", themes: { light: "github-light", dark: "github-dark" } }))`。**源码缺失时 `throw new Error(\`[DemoPreview] demo 不存在: ${props.file}\`)`**。模板：`.tu-demo` 预览容器（`--vp-c-*`变量）+ 底部工具条（展开/收起源码 reactive 状态 +`navigator.clipboard.writeText(code)`复制，仅事件回调内调用）+`v-html="html"` 代码区。

- [ ] **Step 3: index.ts 注册全局组件**

`enhanceApp({ app }) { app.component("DemoPreview", DemoPreview); }`

- [ ] **Step 4: custom.css 追加暗色规则**

spec §5 的 `html.dark .shiki ...` 五行变量规则原样加入。

- [ ] **Step 5: 集成验证**

临时 index.md 写入 `<DemoPreview file="button/ButtonDemo.vue" />`。
Run: dev 页面 → 预览渲染 Button 组、展开可见高亮源码、复制可用；`pnpm build` 成功且产物 HTML 含 `shiki` 类名与预渲染高亮 span。
Expected: 通过。

- [ ] **Step 6: fail-fast 验证（Review Focus 2）**

将临时页 file 改为 `"nope/Foo.vue"`。
Run: `pnpm build`
Expected: 构建**报错**（含 `[DemoPreview] demo 不存在`）；还原临时页。

- [ ] **Step 7: 暗色一致性验证（Review Focus 3）**

dev 下切换暗色：demo 按钮变体颜色随 tokens 翻转、代码块随 `--shiki-dark` 翻转、容器背景随 `--vp-c-bg` 翻转。
Expected: 三者同步，无割裂。通过后**移除临时 index.md 验证段**（保留一行标题，Task 4 重写）。

- [ ] **Step 8: Commit**

```bash
git add apps/docs/.vitepress/theme
git commit -m "✨ feat(docs): DemoPreview 组件与 shiki v4 双主题高亮"
```

### Task 4: 首页与指南页

**Files:**

- Modify: `apps/docs/index.md`（正式首页，VitePress frontmatter hero/features）
- Create: `apps/docs/guide/introduction.md`、`apps/docs/guide/installation.md`、`apps/docs/guide/cli.md`、`apps/docs/guide/theming.md`
- Modify: `apps/docs/.vitepress/config.mts`（nav + sidebar 指南组）

**Interfaces:**

- Consumes: spec §4 信息架构；`packages/vue/registry/vue/*.json`（CLI 页引用 registry 机制与 utils/tokens 依赖链，spec 建议 B3）
- Produces: 最终 nav（指南 / 组件 / GitHub 占位）与 sidebar 指南组配置（Task 5 追加组件组）

- [ ] **Step 1: config.mts 补 nav 与 sidebar**

`themeConfig.nav`：`{ text: "指南", link: "/guide/introduction", activeMatch: "/guide/" }`、`{ text: "组件", link: "/components/button", activeMatch: "/components/" }`、`{ text: "GitHub", link: "https://github.com/zhuchentong/tu-design" }`；`themeConfig.sidebar`：`"/guide/": [ { text: "指南", items: [introduction, installation, cli, theming] } ]`。

- [ ] **Step 2: 写首页与 4 个指南页**

首页 frontmatter：`hero: { name: "tu-design", text: "Vue 组件注册表", tagline: 基于 shadcn 思路的 Vue 组件库，npx 一键添加 }` + actions（快速开始 → /guide/installation、组件列表 → /components/button）+ features 3-4 条。指南页各含 spec §3 列出的 H2 结构；installation 含 Tailwind/tokens 接入步骤；cli 说明 `npx tu-design add <name>`、registry JSON 来源与 `utils`/`tokens` 依赖链；theming 说明 tokens.css 变量与暗色 `.dark` 机制。

- [ ] **Step 3: 验证**

Run: dev 下访问 `/`、`/guide/introduction`、`/guide/installation`、`/guide/cli`、`/guide/theming`，侧边栏高亮与 nav activeMatch 正确。
Expected: 全部可达。

- [ ] **Step 4: Commit**

```bash
git add apps/docs/index.md apps/docs/guide apps/docs/.vitepress/config.mts
git commit -m "📝 docs(docs): 新增首页与指南（介绍/安装/CLI/主题）"
```

### Task 5: 组件文档页与侧边栏补全

**Files:**

- Create: `apps/docs/components/{avatar,badge,button,card,input,label,separator,skeleton}.md`
- Create: `apps/docs/demos/button/ButtonVariants.vue`（组件页「用法」示例增补样板，其余组件按需）
- Modify: `apps/docs/.vitepress/config.mts`（sidebar 补组件组）

**Interfaces:**

- Consumes: `<DemoPreview file: string />`（Task 3）；`packages/vue/src/components/<name>/registry.meta.json`（页面简介）；现有 `demos/<name>/<Name>Demo.vue`
- Produces: 完整 sidebar（指南 + 组件两组）

- [ ] **Step 1: config.mts sidebar 补组件组**

`"/components/": [ { text: "组件", items: 8 个组件链接（按字母序）} ]`

- [ ] **Step 2: 写 button.md 作为样板**

结构按 spec §4「组件页形态」：H1 + 简介（registry.meta.json）+ `## 演示`（`<DemoPreview file="button/ButtonDemo.vue" />`）+ `## 安装`（` ```bash npx tu-design add button `）+ `## Props`（手写表格：variant 六值 / size 四值 / as / class，依据 `packages/vue/src/components/button/index.ts` 的 cva 定义）+ `## 用法`（`<DemoPreview file="button/ButtonVariants.vue" />`）。

- [ ] **Step 3: 复制结构完成其余 7 页**

各组件 Props 表从 `packages/vue/src/components/<name>/` 源码读取；无新增 demo 的组件「用法」节复用现有 Demo.vue 或省略。

- [ ] **Step 4: 验证（Review Focus 4）**

Run: dev 遍历 8 个组件页；重点核对 button 页 link variant 的 `<a>` 无默认主题下划线/颜色污染、skeleton/card 页列表与段落间距正常；`pnpm build` 通过。
Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add apps/docs/components apps/docs/demos apps/docs/.vitepress/config.mts
git commit -m "📝 docs(docs): 新增 8 组件文档页并补全侧边栏"
```

### Task 6: 全链路验证与收尾

**Files:**

- Modify（条件）: `pnpm-workspace.yaml`（vue-router catalog 清理）
- Test: 无新增代码；纯验证任务

- [ ] **Step 1: vue-router 消费者检查**

Run: `grep -rn "vue-router" --include="package.json" apps packages tools | grep -v node_modules`
Expected: 若仅 catalog 声明无消费者 → 从 catalog 移除并 `vp install`；否则保留。

- [ ] **Step 2: 全链路验证（spec §10）**

Run: `vp check && vp run -r build && ls apps/docs/dist/r/vue | wc -l`
Expected: check 通过；build 通过；`11`。再跑根 `pnpm run ready`（即 `vp check && vp run -r test && vp run -r build`）通过。

- [ ] **Step 3: spec §10 手动清单复核**

暗色同步换肤、demo 交互（Button 变体、Avatar 回退）、搜索可检索中文关键词（`输入`、`按钮`；体验差则记录，tokenizer 调优不阻塞）。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "✅ test(docs): VitePress 迁移全链路验证通过"
```

---

## Self-Review 记录

- **Spec 覆盖**：§3 目录→Task 1/3/4/5；§4 IA→Task 4/5；§5 DemoPreview→Task 3；§6 Tailwind→Task 1；§7 registry→Task 2；§8 工程配置→Task 1/6；§10 验证→各 task + Task 6；§11 风险对策→Global Constraints 与 Review Focus ✓
- **Step 扫描**：无 TBD/含糊步骤；代码块仅限 config.mts 骨架、shiki.ts 全文、DemoPreview 签名与 fail-fast 算法（spec 已钉死的值逐字保留）✓
- **类型一致性**：`getHighlighter`（Task 3 定义/使用）、`<DemoPreview file>`（Task 3 产出 = Task 5 消费）、`/r/vue/*.json`（Task 2 产出 = Task 6 验收）✓
- **Review Focus**：5 项均落到 owning task 的验证步骤 ✓
- **篇幅**：计划 ≈ spec 长度，无 transcript ✓
