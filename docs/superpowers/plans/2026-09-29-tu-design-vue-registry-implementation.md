# tu-design Vue 组件库（shadcn 模式）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在空白 monorepo 中按 spec 实现完整链路：`@tu-design/vue` 组件库（8 组件）→ registry JSON 生成器 → `@tu-design/cli`（init/add）→ `apps/docs` 文档站 → 发布就绪（changesets + pnpm publish）。

**Architecture:** 组件源码 + `registry.meta.json` 元数据是唯一事实源；构建时纯函数生成器产出 shadcn registry-item JSON（catalog: 协议强制翻译为具体版本）；CLI 框架感知，从 URL（docs 同源 `/r/vue`）或 npm 通道（内嵌 `@tu-design/vue` 依赖）拉取 item 写入用户项目；docs 站以 vite alias 源码级引用组件保证热更。

**Tech Stack:** Vue 3.5 + `@ark-ui/vue` 5.39 + Tailwind CSS v4 + cva/clsx/tailwind-merge；vite-plus 工具链（`vp pack`/`vp test`/`vp check`）；CLI 用 commander/prompts/picocolors/package-manager-detector；vitest + @vue/test-utils + happy-dom；changesets。

**Spec:** `docs/superpowers/specs/2026-09-29-tu-design-vue-registry-design.md`（下称 spec；本计划从 spec 出发，执行者需同时持有两者）

## Global Constraints

- Node ≥22.18.0，pnpm 12.6.0（root `devEngines` 已定）。
- 公共依赖版本一律进 `pnpm-workspace.yaml` 的 `catalog`，包内以 `"catalog:"` 引用；spec 未给版本的依赖，`pnpm add` 后把解析出的范围回填 catalog。
- **registry JSON 中禁止出现 `catalog:` / `workspace:` 协议**（硬性规则，生成器必须翻译）。
- 发布包名：`@tu-design/vue`、`@tu-design/cli`；CLI bin 名 `tu-design`；monorepo 内无历史包，全部新建。
- 首版 `0.1.0`，`publishConfig.access: "public"`；**publish 必须走 `pnpm publish`**（catalog:/workspace: 协议仅在 pnpm publish/pack 时被替换）。
- 组件约定：目录小写 kebab（`button`），SFC 文件 PascalCase（`Button.vue`）；变体函数从组件目录 `index.ts` 具名导出；SFC 显式声明 `class` prop 并用 `cn()` 合并（用户 class 经 tailwind-merge 覆盖同组默认值）；纯样式组件不引入 `@ark-ui/vue`。
- 测试：`vp test`（vitest）+ `@vue/test-utils`，DOM 环境 `happy-dom`；生成器与 CLI 核心逻辑为纯函数，IO 层注入后单测。
- 类型：`packages/vue` 的 SFC 质量以 `vue-tsc --noEmit` 兜底（`typecheck` script）。
- 提交信息：中文约定式提交含 emoji，如 `✨ feat(vue): 新增 Button 组件`。
- 每个 Task 结束时 `git add` 相关文件并 commit，保持可回滚粒度。

## Review Focus

1. **registry JSON 协议残留**：`catalog:`/`workspace:` 漏翻译会让用户 `npm install` 直接失败 —— 期望生成产物只含具体 semver。测试：Task 14「生成的 item 不含 catalog:/workspace:」。
2. **用户 class 覆盖默认变体**：`<Button class="bg-red-500">` 应去掉 `bg-primary` 保留 `bg-red-500`（tailwind-merge 冲突解决，用户优先）。测试：Task 7「用户 class 覆盖同组默认 class」。
3. **tokens 合并幂等**：`init` 重复执行不能把 CSS 变量块注入两遍。测试：Task 18「mergeTokensCss 幂等」+「runInit 二次执行文件不变」。
4. **registryDependencies 循环引用**：A→B→A 必须报错而非死循环。测试：Task 23「环报错」。
5. **Windows 路径分隔符**：registry JSON 中 `files[].target` 恒为 POSIX `/`，写盘必须经 `path.join` 转换。测试：Task 22「target 分隔符规范化」。
6. **URL 通道失败兜底**：registry URL 不可达时从本地 node_modules npm 通道兜底，且双失败报错列出组件名。测试：Task 21。

---

# 阶段 P0 —— 骨架与 Spikes

### Task 1: 仓库基线与 catalog 扩充

**Files:**

- Modify: `pnpm-workspace.yaml`（catalog 节）

**Interfaces:**

- Produces: catalog 中可用的版本键：`vue`、`@ark-ui/vue`、`tailwindcss`、`@tailwindcss/vite`、`clsx`、`tailwind-merge`、`class-variance-authority`、`tw-animate-css`、`@vue/test-utils`、`happy-dom`、`commander`、`prompts`、`picocolors`、`package-manager-detector`、`@changesets/cli`、`vue-tsc`、`@vitejs/plugin-vue`、`typescript`（已存在）

- [ ] **Step 1: 首次提交基线**

```bash
git add -A && git commit -m "🎉 chore: 初始化仓库基线"
```

- [ ] **Step 2: 扩充 catalog**

在 `pnpm-workspace.yaml` 的 `catalog:` 下按 spec §4.2 添加（保留既有条目）：

```yaml
catalog:
  # …既有 @types/node / typescript / vite / vite-plus 保留…
  vue: ^3.5.43
  "@ark-ui/vue": ^5.39.2
  tailwindcss: ^4
  "@tailwindcss/vite": ^4
  clsx: ^2.1.1
  tailwind-merge: ^3.7.0
  class-variance-authority: ^0.7.1
  tw-animate-css: ^1.4.0
  "@vue/test-utils": ^2.5.1
  happy-dom: ^20
  commander: ^15
  prompts: ^2
  picocolors: ^1
  package-manager-detector: ^1
  "@changesets/cli": ^3.0.3
  vue-tsc: ^3.3.11
  "@vitejs/plugin-vue": ^6
```

- [ ] **Step 3: 安装验证**

Run: `vp install`
Expected: 成功，`pnpm-lock.yaml` 更新。

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "🔧 chore: 扩充 pnpm catalog 组件库依赖版本"
```

### Task 2: Spike #1 — vite-plus pack 透传 Vue 插件

**Files:**

- Create: `packages/vue/package.json`、`packages/vue/vite.config.ts`、`packages/vue/tsconfig.json`、`packages/vue/src/index.ts`、`packages/vue/src/Spike.vue`（全部为 spike 骨架，Task 5 会正式化）

**Interfaces:**

- Produces: spike 结论 —— `vp pack` + `pack.plugins: [vue({ isProduction: true })]` 能否产出正确 SFC 编译物（决定后续是否启用 tsdown 直配预案）。

- [ ] **Step 1: 写最小包骨架**

`packages/vue/package.json`：

```json
{
  "name": "@tu-design/vue",
  "version": "0.0.0",
  "type": "module",
  "devDependencies": {
    "unplugin-vue": "^8.0.0",
    "vite-plus": "catalog:"
  }
}
```

`packages/vue/vite.config.ts`：

```ts
import { defineConfig } from "vite-plus";
import vue from "unplugin-vue/rolldown";

export default defineConfig({
  pack: {
    plugins: [vue({ isProduction: true })],
    dts: { vue: true },
    exports: true,
  },
});
```

（`dts: { vue: true }` 即 spec §10.1 的 Vue 构建配方：rolldown-plugin-dts + vue-tsc，SFC 类型由此产出。）

`packages/vue/src/Spike.vue`：一个含 `<script setup lang="ts">` + `<template>` 的最小 SFC（一个 div + 一个 prop）。`packages/vue/src/index.ts`：`export { default as Spike } from "./Spike.vue";`

- [ ] **Step 2: 安装并打包**

Run: `vp install && cd packages/vue && vp pack`
Expected: `packages/vue/dist/` 产出 js 与 `.d.ts`（exports: true）。

- [ ] **Step 3: 验证 SFC 编译产物**

Run: `grep -rl "createElementVNode\|createVNode" packages/vue/dist/ | head -3`
Expected: 至少 1 个文件命中，且 dist 中无 `.vue` 原文残留。
**若失败**：记录输出，启用 spec §15 预案（改用 tsdown.config.ts 直配），后续 Task 5/7 的构建命令随之调整，不阻塞。

- [ ] **Step 4: Commit（spike 骨架暂留，标注为 spike）**

```bash
git add packages/vue
git commit -m "🧪 test: spike#1 验证 vp pack 透传 unplugin-vue"
```

### Task 3: Spike #2 — vue-tsc 与 catalog TS 7 兼容性

**Files:**

- Modify: `packages/vue/package.json`（devDeps 加 `"vue-tsc": "catalog:"`）、`packages/vue/tsconfig.json`

**Interfaces:**

- Produces: 结论 —— vue-tsc ^3.3.11 能否在 catalog TypeScript ^7.0.2 下工作；失败则 `packages/vue` 本包 devDeps 直钉 `typescript: ^5.9`（不进 catalog）。

- [ ] **Step 1: 配置 tsconfig 并运行 vue-tsc**

`packages/vue/tsconfig.json`：

```json
{ "extends": "../../tsconfig.json", "include": ["src"] }
```

Run: `vp install && cd packages/vue && vp exec vue-tsc --noEmit`
Expected: 退出码 0，SFC 类型正常解析。

- [ ] **Step 2: 失败预案（仅在 Step 1 失败时执行）**

`packages/vue/package.json` devDeps 直接添加 `"typescript": "^5.9"`，`vp install` 后重跑 Step 1。记录最终采用方案。

- [ ] **Step 3: Commit**

```bash
git add packages/vue
git commit -m "🧪 test: spike#2 验证 vue-tsc 与 TS 7 兼容性"
```

### Task 4: Spike #3 — 最小闭环冒烟（全部临时产物，不入库）

**Files:** 全部位于 `/tmp/opencode/spike3/`，不进仓库。

- [ ] **Step 1: 手写最小 registry JSON**

`/tmp/opencode/spike3/button.json`：`{ "$schema": "https://ui.shadcn.com/schema/registry-item.json", "name": "button", "type": "registry:ui", "files": [{ "path": "Button.vue", "type": "registry:ui", "target": "components/ui/button/Button.vue", "content": "<template><button class=\"bg-primary text-white\">spike</button></template>" }] }`

- [ ] **Step 2: 一次性抽取脚本 + 临时项目**

`/tmp/opencode/spike3/extract.mjs`：读 button.json，将 `files[0].content` 写到临时 vite 项目的 `src/components/ui/button/Button.vue`。临时项目 = 手工最小 vite + vue + tailwind v4（`@tailwindcss/vite` 插件 + `@import "tailwindcss";` 的 css）。

- [ ] **Step 3: 验证渲染产物**

Run: 临时项目内 `npx vite build`，然后 `grep -r "bg-primary" dist/assets/`
Expected: 命中 → 链路「registry JSON → 文件写入 → Tailwind 项目渲染」可行。
**若失败**：分析 target 解析/内容内嵌问题，结论写入执行备注。

- [ ] **Step 4: 清理并记录**

无需 commit。若 spike 暴露 spec 缺陷，先回报再继续。

### Task 5: packages/vue 正式初始化

**Files:**

- Modify: `packages/vue/package.json`（正式化）、`packages/vue/vite.config.ts`、`packages/vue/src/index.ts`
- Create: `packages/vue/src/lib/utils.ts`、`packages/vue/src/lib/utils.test.ts`、`packages/vue/src/styles/tokens.css`
- Delete: `packages/vue/src/Spike.vue`

**Interfaces:**

- Produces: `cn(...inputs: ClassValue[]): string`（从 `@tu-design/vue` 根导出）；`tokens.css`（shadcn v4 完整 token 集，neutral 基准）。

- [ ] **Step 1: 写失败测试**

`packages/vue/src/lib/utils.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("合并并去重同组冲突 class", () => expect(cn("p-2", "p-4")).toBe("p-4"));
  it("保留非冲突 class", () => expect(cn("p-2", "text-sm")).toBe("p-2 text-sm"));
  it("忽略 falsy 输入", () => expect(cn("p-2", false && "p-4")).toBe("p-2"));
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd packages/vue && vp test --run src/lib/utils.test.ts`
Expected: FAIL（`cn` 未定义）。

- [ ] **Step 3: 实现**

`package.json` 正式化：`deps: { "clsx": "catalog:", "tailwind-merge": "catalog:" }`，`peerDependencies: { "vue": ">=3.5" }`，`devDependencies` 加 `"vue": "catalog:"`、`"@vue/test-utils": "catalog:"`、`"happy-dom": "catalog:"`，scripts 增 `"build": "vp pack"`、`"typecheck": "vue-tsc --noEmit"`。
`vite.config.ts` 在 Task 2 基础上加 `test: { environment: "happy-dom" }`。
`utils.ts`：`clsx` + `twMerge` 组合（签名见上）。
`src/index.ts`：`export * from "./lib/utils";`
`tokens.css`：从 shadcn 官方 v4 安装文档复制 neutral 基准 token 集，内容依次为：`@import "tw-animate-css";` → `@custom-variant dark (&:where(.dark, .dark *));` → `:root{}`（`--background/--foreground/--primary/--primary-foreground/--secondary/--secondary-foreground/--muted/--muted-foreground/--accent/--accent-foreground/--destructive/--border/--input/--ring/--radius` 的 oklch 值）→ `.dark{}` 暗色对应值 → `@theme inline` 映射（`--color-*: var(--*)` 与 `--radius-*`）。**不含** `@import "tailwindcss";`（用户 css 提供）。删除 `Spike.vue` 并从 index 移除。

- [ ] **Step 4: 运行确认通过**

Run: `cd packages/vue && vp test --run && vp pack`
Expected: 测试 PASS；dist 正常产出。

- [ ] **Step 5: Commit**

```bash
git add packages/vue
git commit -m "✨ feat(vue): 初始化 @tu-design/vue（cn 工具 + tokens.css）"
```

### Task 6: apps/docs 初始化 + alias 热更验证

**Files:**

- Create: `apps/docs/package.json`、`apps/docs/vite.config.ts`、`apps/docs/index.html`、`apps/docs/tsconfig.json`、`apps/docs/src/main.ts`、`apps/docs/src/App.vue`、`apps/docs/src/style.css`

**Interfaces:**

- Consumes: `cn`（Task 5）。
- Produces: dev alias `@tu-design/vue` → `../vue/src/index.ts`（后续所有 docs 页面经此热更）。

- [ ] **Step 1: 搭建 docs 包**

`package.json`：name `@tu-design/docs`（private），deps：`vue`、`@tu-design/vue: "workspace:*"`、`tailwindcss`、`@tailwindcss/vite`、`@vitejs/plugin-vue`（均 `catalog:`），scripts `"dev": "vite"`（vite-plus 驱动）。
`vite.config.ts`：

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@tu-design/vue": fileURLToPath(new URL("../vue/src/index.ts", import.meta.url)),
    },
  },
});
```

`src/style.css`：`@import "tailwindcss"; @import "../../../packages/vue/src/styles/tokens.css";`（路径自 `src/` 起算，执行者按实际层级修正）。`App.vue` 用 `cn("p-2", "p-4")` 渲染一个 demo 块。

- [ ] **Step 2: 手动验证 alias 与热更**

Run: `cd apps/docs && vp dev`
Expected: 页面渲染且样式生效（tokens 生效）；修改 `packages/vue/src/lib/utils.ts`（如临时加一个空格）→ 浏览器 HMR 更新，无需重启。验证后还原 utils.ts。

- [ ] **Step 3: Commit**

```bash
git add apps/docs
git commit -m "✨ feat(docs): 初始化文档站并接通 @tu-design/vue 源码级热更"
```

---

# 阶段 P1 —— 基础套件（8 组件）

组件公共模式（每个组件任务遵守，不再重复）：

- 目录 `packages/vue/src/components/<name>/`，含 `<Name>.vue`（或多个子组件 SFC）+ `index.ts`。
- 变体函数定义在 `index.ts`（模块级 `cva(...)`），SFC 经 `./index` 引用（仅渲染期使用，ESM 实时绑定无环问题）；`index.ts` 同时 `export { default as <Name> } from "./<Name>.vue"`。
- SFC 显式声明 `class?: string` prop，模板根元素 `:class="cn(<variants>(...), props.class)"`。
- `src/index.ts` 追加 `export * from "./components/<name>";`
- 测试文件与组件同目录（`<Name>.test.ts`），最小断言集在任务中列出。
- `class-variance-authority`（首次需要时）加为 `@tu-design/vue` deps。

### Task 7: Button

**Files:**

- Create: `packages/vue/src/components/button/Button.vue`、`index.ts`、`Button.test.ts`
- Modify: `packages/vue/src/index.ts`、`packages/vue/package.json`（cva）

**Interfaces:**

- Produces: `Button` 组件；`buttonVariants(props?: { variant?: ButtonVariants["variant"]; size?: ButtonVariants["size"] }): string`；`ButtonVariants = VariantProps<typeof buttonVariants>`。variant 集：`default | destructive | outline | secondary | ghost | link`；size 集：`default | sm | lg | icon`。Props：`variant?`、`size?`、`as?: string`（默认 `"button"`）、`class?: string`。

- [ ] **Step 1: 写失败测试**

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Button } from "./index";

it("默认渲染 button 元素并应用 default 变体", () => {
  const w = mount(Button);
  expect(w.element.tagName).toBe("BUTTON");
  expect(w.classes()).toContain("bg-primary");
});
it("as 属性切换渲染标签", () => {
  expect(mount(Button, { props: { as: "a" } }).element.tagName).toBe("A");
});
it("size=lg 应用 h-10", () => {
  expect(mount(Button, { props: { size: "lg" } }).classes()).toContain("h-10");
});
it("用户 class 覆盖同组默认 class", () => {
  const w = mount(Button, { props: { class: "bg-red-500" } });
  expect(w.classes()).toContain("bg-red-500");
  expect(w.classes()).not.toContain("bg-primary");
});
```

- [ ] **Step 2: 运行确认失败** —— `vp test --run src/components/button`，Expected: FAIL。

- [ ] **Step 3: 实现**

`index.ts` 定义 `buttonVariants`：基类含 `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`；variant/size 类值按 shadcn v4 语义 token（`bg-primary text-primary-foreground`、`bg-destructive text-white`、`border border-input bg-background`、`bg-secondary text-secondary-foreground`、ghost `hover:bg-muted`、link `text-primary underline-offset-4 hover:underline`；size：`h-9 px-4 py-2` / `h-8 px-3` / `h-10 px-6` / `size-9`）。`Button.vue` 用 `<component :is="as">` 渲染（签名见 Review Focus 2 的行为要求）。

- [ ] **Step 4: 运行确认通过** —— `vp test --run src/components/button && cd packages/vue && vp run typecheck`，Expected: PASS。

- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Button 组件`

### Task 8: Badge

**Files:** Create `packages/vue/src/components/badge/{Badge.vue,index.ts,Badge.test.ts}`；Modify `src/index.ts`。

**Interfaces:**

- Produces: `Badge`；`badgeVariants(props?: { variant? }): string`；variant 集：`default | secondary | destructive | outline`；元素 `<span>`；Props：`variant?`、`class?`。

- [ ] **Step 1: 写失败测试** —— 代表断言：默认渲染 `span` 含 `bg-primary`；`variant="outline"` 含 `border` 且不含 `bg-primary`；用户 class 覆盖（同 Task 7 模式）。
- [ ] **Step 2: 确认失败** —— `vp test --run src/components/badge`。
- [ ] **Step 3: 实现** —— 类值按 shadcn v4（`bg-primary text-primary-foreground`、`bg-secondary text-secondary-foreground`、`bg-destructive text-white`、`text-foreground border border-input`）。
- [ ] **Step 4: 确认通过 + `vp run typecheck`**。
- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Badge 组件`

### Task 9: Card

**Files:** Create `packages/vue/src/components/card/{Card,CardHeader,CardTitle,CardDescription,CardContent,CardFooter}.vue` + `index.ts` + `Card.test.ts`；Modify `src/index.ts`。

**Interfaces:**

- Produces: `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`（index 全部具名导出）；元素映射 pin：`div / div / h3 / p / div / div`；均只有 `class?` prop；默认类按 shadcn v4（Card：`rounded-xl border bg-card text-card-foreground shadow-sm`；Header：`flex flex-col gap-1.5 p-6`；Title：`font-semibold leading-none`；Description：`text-sm text-muted-foreground`；Content：`p-6 pt-0`；Footer：`flex items-center p-6 pt-0`）。

- [ ] **Step 1: 写失败测试** —— 代表断言：组合挂载后 `CardTitle` 渲染为 `h3` 且含 `font-semibold`；`CardContent` 为 `div`；子组件经默认插槽渲染内容。
- [ ] **Step 2: 确认失败** —— `vp test --run src/components/card`。
- [ ] **Step 3: 实现**（6 个薄 SFC，无 cva）。
- [ ] **Step 4: 确认通过 + `vp run typecheck`**。
- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Card 组件族`

### Task 10: Separator 与 Skeleton

**Files:** Create `packages/vue/src/components/separator/{Separator.vue,index.ts}`、`packages/vue/src/components/skeleton/{Skeleton.vue,index.ts}` + 各自 `.test.ts`；Modify `src/index.ts`。

**Interfaces:**

- Produces: `Separator`（props：`orientation?: "horizontal" | "vertical"` 默认 horizontal、`class?`；根 `div`，输出 `data-orientation`，类：horizontal `h-px w-full` / vertical `w-px h-full`，公共 `bg-border shrink-0`）。`Skeleton`（`div`，`aria-hidden="true"`，公共类 `animate-pulse rounded-md bg-muted`，prop `class?`）。

- [ ] **Step 1: 写失败测试** —— Separator：默认 `data-orientation="horizontal"` 且含 `h-px`；`orientation="vertical"` 含 `w-px`。Skeleton：含 `animate-pulse`，用户 class 合并保留。
- [ ] **Step 2: 确认失败** —— `vp test --run src/components/separator src/components/skeleton`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过 + `vp run typecheck`**。
- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Separator 与 Skeleton 组件`

### Task 11: Input 与 Label

**Files:** Create `packages/vue/src/components/input/{Input.vue,index.ts}`、`packages/vue/src/components/label/{Label.vue,index.ts}` + 各自 `.test.ts`；Modify `src/index.ts`。

**Interfaces:**

- Produces: `Input`（`defineModel<string | number>()` 支持 v-model；根 `<input>`；其余 attrs（type/placeholder/disabled 等）自然透传；固定类按 shadcn v4：`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50`；prop `class?`）。`Label`（原生 `<label>`，`for` 经 attrs 透传，类 `text-sm font-medium leading-none`，prop `class?`）。

- [ ] **Step 1: 写失败测试** —— Input：`setValue("hi")` 后 `emitted("update:modelValue")` 为 `[["hi"]]`；`placeholder="x"` 透传到 attributes；用户 class 合并。Label：渲染 `LABEL`；`for="email"` 透传。
- [ ] **Step 2: 确认失败** —— `vp test --run src/components/input src/components/label`。
- [ ] **Step 3: 实现**（均无 cva；Input 需 `inheritAttrs` 默认行为 + 手动合并 class：声明 `class` prop 后其余 attrs 自动 fallthrough）。
- [ ] **Step 4: 确认通过 + `vp run typecheck`**。
- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Input 与 Label 组件`

### Task 12: Avatar（Ark UI 集成模式）

**Files:** Create `packages/vue/src/components/avatar/{Avatar.vue,index.ts,Avatar.test.ts}`；Modify `src/index.ts`、`packages/vue/package.json`（deps 加 `"@ark-ui/vue": "catalog:"`）。

**Interfaces:**

- Produces: `Avatar`（props：`src?`、`alt?`、`class?`；默认插槽 = fallback 内容；内部用 `@ark-ui/vue/avatar` 的 `Avatar.Root / Avatar.Image / Avatar.Fallback`；Root 类 `inline-flex size-10 overflow-hidden rounded-full`；Image `size-full object-cover`；Fallback `flex size-full items-center justify-center bg-muted`）。此任务确立「交互组件包 Ark 原语」的封装范式，后续交互批次照此。

- [ ] **Step 1: 写失败测试**

```ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { Avatar } from "./index";

it("根元素带 ark data-scope", () => {
  expect(mount(Avatar).html()).toContain('data-scope="avatar"');
});
it("无 src 时渲染 fallback 插槽内容", () => {
  const w = mount(Avatar, { slots: { default: "CT" } });
  expect(w.text()).toContain("CT");
});
it("有 src 时渲染 img", () => {
  expect(
    mount(Avatar, { props: { src: "a.png" } })
      .find("img")
      .exists(),
  ).toBe(true);
});
```

- [ ] **Step 2: 确认失败** —— `vp test --run src/components/avatar`。
- [ ] **Step 3: 实现**（结构见 Interfaces；`v-if="src"` 控制 Image）。
- [ ] **Step 4: 确认通过 + `vp run typecheck`**。
- [ ] **Step 5: Commit** —— `✨ feat(vue): 新增 Avatar 组件（Ark UI 集成）`

### Task 13: docs 组件文档页（8 页）

**Files:**

- Create: `apps/docs/src/router.ts`、`apps/docs/src/pages/ComponentPage.vue`、`apps/docs/src/demos/<name>/<Name>Demo.vue`（×8）
- Modify: `apps/docs/src/main.ts`（挂 router）、`apps/docs/src/App.vue`（侧边导航）、`apps/docs/package.json`（deps 加 `vue-router`、`shiki`，版本回填 catalog）

**Interfaces:**

- Consumes: 8 个组件（经 `@tu-design/vue` alias）；`packages/vue/registry` 尚未生成，源码展示用 `import.meta.glob` raw 导入。

- [ ] **Step 1: 实现 demo 与页面骨架**

`ComponentPage.vue`：props `name`；用 `import.meta.glob("../../../packages/vue/src/components/*/*.{vue,ts}", { query: "?raw", import: "default", eager: true })`（相对路径执行者按实际层级修正）取得该组件目录源码；`shiki` 的 `codeToHtml`（theme `github-dark`）高亮；页尾渲染安装命令块 `npx tu-design add <name>`。`router.ts`：`createWebHistory`，路由 `/:name` 到 ComponentPage + `/` 重定向到 `/button`。8 个 demo 文件各展示该组件基本用法（Avatar demo 含 src 与 fallback 两种）。

- [ ] **Step 2: 手动验证** —— `cd apps/docs && vp dev`：8 页可导航、demo 渲染正确、源码高亮显示、改 `Button.vue` 类名 demo 实时热更。
- [ ] **Step 3: Commit** —— `✨ feat(docs): 新增 8 组件文档页（demo + shiki 高亮 + 安装命令）`

---

# 阶段 P2 —— Registry

### Task 14: registry 生成器核心（纯函数）+ 元数据 + 单测

**Files:**

- Create: `packages/vue/src/registry/types.ts`、`packages/vue/src/registry/generator.ts`、`packages/vue/src/registry/generator.test.ts`
- Create: `packages/vue/src/components/<name>/registry.meta.json`（×8）

**Interfaces:**

- Produces（后续 Task 15 脚本与 Task 21-23 CLI 均依赖这些类型与函数）：

```ts
// types.ts
export type RegistryType = "registry:ui" | "registry:lib" | "registry:style";
export interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}
export interface RegistryItem {
  $schema: string; // "https://ui.shadcn.com/schema/registry-item.json"
  name: string;
  type: RegistryType;
  description?: string;
  registryDependencies?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files: RegistryFile[];
}
export interface RegistryIndex {
  $schema: string;
  name: string;
  items: { name: string; title: string; type: RegistryType; description?: string }[];
}
export interface RegistryMeta {
  description: string;
  registryDependencies?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// generator.ts
export interface RegistryIo {
  readDir(path: string): string[];
  readFile(path: string): string;
}
export function parseCatalog(workspaceYaml: string): Record<string, string>;
export function translateDeps(
  deps: Record<string, string>,
  catalog: Record<string, string>,
): Record<string, string>;
export function generateRegistry(
  io: RegistryIo,
  input: { componentsDir: string; utilsPath: string; tokensPath: string; workspaceYaml: string },
): { items: RegistryItem[]; index: RegistryIndex };
```

生成规则（pin）：`readDir(componentsDir)` 每个含 `registry.meta.json` 的子目录 = 一个 item（`type: "registry:ui"`，`name` = 目录名，`files` = 目录内全部源文件，`path` 为相对 POSIX 路径，`target` = `components/ui/<name>/<file>`）；`utils` item（`registry:lib`，`target: "lib/utils.ts"`，`dependencies: { clsx: "catalog:", "tailwind-merge": "catalog:", "class-variance-authority": "catalog:" }`）；`tokens` item（`registry:style`，`target: "styles/tokens.css"`，content 为 tokens.css 原文）；所有 deps 经 `translateDeps`（`catalog:` → catalog 值，缺键抛错含包名；`workspace:*` 抛错）；`index` 按 name 排序，`title` 为组件 PascalCase 名。8 个 meta：均含 `registryDependencies: ["utils"]` 与一句话 `description`；avatar 另含 `dependencies: { "@ark-ui/vue": "catalog:" }`；button/badge 另含 `"class-variance-authority": "catalog:"`（cva 使用者，与 Task 7/8 一致；Card/Input 不使用 cva 故不声明）。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { translateDeps } from "./generator";

const catalog = { "@ark-ui/vue": "^5.39.2" };
it("catalog: 翻译为具体版本", () =>
  expect(translateDeps({ "@ark-ui/vue": "catalog:" }, catalog)).toEqual({
    "@ark-ui/vue": "^5.39.2",
  }));
it("catalog 缺键抛错并含包名", () =>
  expect(() => translateDeps({ foo: "catalog:" }, catalog)).toThrow(/foo/));
it("禁止 workspace: 协议", () =>
  expect(() => translateDeps({ x: "workspace:*" }, catalog)).toThrow());
```

其余断言（同一 describe 文件，用内存 io fixture）：`generateRegistry` 产出含 `button/utils/tokens` 三 item；所有 item JSON 序列化后不匹配 `/(catalog|workspace):/`；`index.items` 的 name 集与 items 一致且有序；button item 的 `files` 含 `Button.vue` 且 `content` 非空、`registryDependencies` 含 `"utils"`；avatar item `dependencies["@ark-ui/vue"] === "^5.39.2"`。

- [ ] **Step 2: 确认失败** —— `vp test --run src/registry`，Expected: FAIL。
- [ ] **Step 3: 实现** —— `parseCatalog` 用 `yaml` 包（devDep，安装后回填 catalog）解析 `catalog` 节；`generateRegistry` 为纯函数只依赖注入的 io。
- [ ] **Step 4: 确认通过** —— `vp test --run src/registry`，Expected: PASS。
- [ ] **Step 5: Commit** —— `✨ feat(vue): registry 生成器核心与组件元数据`

### Task 15: 生成脚本 + build 集成

**Files:**

- Create: `packages/vue/scripts/generate-registry.ts`
- Modify: `packages/vue/package.json`（scripts、devDeps `tsx`、`files: ["dist"]`）

**Interfaces:**

- Consumes: `generateRegistry`（Task 14）。
- Produces: `packages/vue/registry/vue/<name>.json` ×11（8 组件 + utils + tokens + `registry.json` 索引）；`build` 脚本产出 `dist/registry/vue/`。registry 生成产物**入库**（便于 review 与 docs 消费）。

- [ ] **Step 1: 实现脚本** —— 薄 IO 壳：`node:fs` 实现 `RegistryIo`；读 `<pkg>/../../pnpm-workspace.yaml`；调 `generateRegistry`；以 2 空格缩进写 `registry/vue/*.json` 与 `registry.json`。scripts：

```json
"generate:registry": "tsx scripts/generate-registry.ts",
"build": "vp run generate:registry && vp pack && mkdir -p dist/registry && cp -r registry/vue dist/registry/"
```

- [ ] **Step 2: 运行验证**

Run: `cd packages/vue && vp run generate:registry && grep -r "catalog:\|workspace:" registry/ ; echo exit=$?`
Expected: 11 个 JSON 生成且可 `JSON.parse`；grep 无命中（exit=1）。

- [ ] **Step 3: build 验证** —— `vp run build` 后 `ls dist/registry/vue/` 有 11 个文件。
- [ ] **Step 4: Commit** —— `✨ feat(vue): registry 生成脚本与 build 集成`

### Task 16: docs 站 /r/vue 静态托管

**Files:**

- Modify: `apps/docs/vite.config.ts`（新增 `registryPlugin`）

**Interfaces:**

- Consumes: `packages/vue/registry/vue/*.json`（Task 15）。
- Produces: dev 期 `GET /r/vue/<name>.json` 返回该 JSON；build 产物 `dist/r/vue/*.json`（URL 通道基础，P4 e2e 使用）。

- [ ] **Step 1: 实现 registryPlugin**（算法未定，给出实现）：`configureServer` 中间件拦截 `/r/vue/` 前缀，读 `../vue/registry/vue/<name>.json`（`new URL(..., import.meta.url)` 定位，越界路径 404）；`closeBundle` 钩子递归复制 `registry/vue` → `dist/r/vue`。
- [ ] **Step 2: 验证** —— `cd apps/docs && vp dev` 后 `curl -s localhost:5173/r/vue/button.json | head -c 200` 返回 JSON；`vp build` 后 `ls dist/r/vue/` 有 11 个文件。
- [ ] **Step 3: Commit** —— `✨ feat(docs): 托管 /r/vue registry 静态通道`

---

# 阶段 P3 —— CLI（@tu-design/cli）

CLI 公共约定（各任务遵守）：

- 核心逻辑全部为**纯函数，IO 经接口注入**；`src/lib/io.ts` 定义：

```ts
export interface Io {
  exists(path: string): boolean;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  readDir(path: string): string[];
}
```

`src/io/node.ts` 提供基于 `node:fs` 的实现（同步 API），仅命令入口层使用。

- 测试用内存 `Io`（`Map<string, string>` 实现），放同目录 `.test.ts`。

### Task 17: CLI 脚手架 + components.json 读写

**Files:**

- Create: `packages/cli/package.json`、`packages/cli/vite.config.ts`、`packages/cli/tsconfig.json`、`packages/cli/src/index.ts`、`packages/cli/src/lib/config.ts`、`packages/cli/src/lib/io.ts`、`packages/cli/src/io/node.ts`、`packages/cli/src/lib/config.test.ts`

**Interfaces:**

- Produces:

```ts
// config.ts
export interface ComponentsConfig {
  framework: "vue";
  registry: string;
  aliases: { components: string; utils: string; ui: string; lib: string };
  tailwind: { css: string };
}
export function validateConfig(raw: unknown): ComponentsConfig; // 缺字段/framework≠"vue" → 抛错列出缺失项（内置校验，无外部 schema 依赖）
export const DEFAULT_REGISTRY = "https://<org>.github.io/tu-design/r/vue"; // init 未显式传 --registry 时写入 components.json；URL 不可达时 add 走 npm 兜底
export function defaultConfig(registry: string): ComponentsConfig; // aliases 默认 @/components、@/lib/utils、@/components/ui、@/lib；tailwind.css 默认 "src/assets/main.css"
export function loadConfig(io: Io, cwd: string): ComponentsConfig; // <cwd>/components.json；不存在 → 抛错提示先运行 init
export function saveConfig(io: Io, cwd: string, config: ComponentsConfig): void;
```

- `package.json`：`bin: { "tu-design": "./dist/index.js" }`；deps：`commander`、`prompts`、`picocolors`、`package-manager-detector`、`@tu-design/vue: "workspace:*"`（npm 通道来源）；`vite.config.ts`：`pack: { exports: true }`（标准 tsdown 模式）。
- `src/index.ts`：commander 注册 `init` 与 `add <components...>`（本任务仅注册占位 action，`--registry`/`--overwrite` 选项声明在此）。

- [ ] **Step 1: 写失败测试** —— 代表断言：`validateConfig({})` 抛错含 `"framework"`；`loadConfig` 内存 io 读 `components.json` 返回解析对象；不存在时抛错文案含 `init`。
- [ ] **Step 2: 确认失败** —— `cd packages/cli && vp test --run src/lib/config.test.ts`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过 + `vp pack`**。验证 dist 产物含 shebang 与可执行位；**若 pack 未处理 bin**，build 脚本追加 `sed -i '1i #!/usr/bin/env node' dist/index.js && chmod +x dist/index.js`（预案）。
- [ ] **Step 5: Commit** —— `✨ feat(cli): 脚手架与 components.json 读写校验`

### Task 18: init — Tailwind 检测 + cn 注入 + tokens 合并

**Files:**

- Create: `packages/cli/src/lib/init-core.ts`、`packages/cli/src/lib/init-core.test.ts`
- Modify: `packages/cli/src/index.ts`（init action 接线）

**Interfaces:**

- Consumes: `loadConfig/defaultConfig/saveConfig`（Task 17）。
- Produces:

```ts
export function detectTailwindV4(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  globalCss: string,
): boolean;
// deps 含 tailwindcss（^4）且 globalCss 含 @import "tailwindcss"
export function mergeTokensCss(userCss: string, tokensCss: string): string;
// userCss 已含 "@custom-variant dark" → 原样返回（幂等）；否则将 tokensCss 插到 @import "tailwindcss"; 之后
export const CN_UTIL_SOURCE: string; // clsx+twMerge 的 cn 模板，等价 @tu-design/vue/src/lib/utils.ts
export interface InitSummary {
  configPath: string;
  cnPath: string;
  cssPath: string;
  skippedCss: boolean;
}
export function runInit(io: Io, cwd: string, opts: { registry: string }): InitSummary;
// 流程：读 package.json + tailwind.css → detect 失败抛错；写 components.json（存在则校验复用）；cn 写入 alias 解析路径；css 合并；npm 通道所需 @tu-design/vue 的存在性由调用方安装步骤保证
```

alias 路径解析规则（pin）：`@/xxx` → `path.resolve(cwd, tsconfigPathsRoot, xxx)`，`tsconfigPathsRoot` 默认 `src`（Task 19 改写后以 tsconfig 实际为准，此处先按默认实现并注入 `aliasRoot` 参数以便测试）。

- [ ] **Step 1: 写失败测试** —— 代表断言：

```ts
it("mergeTokensCss 幂等", () => {
  const css = `@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));`;
  expect(mergeTokensCss(css, tokens)).toBe(css);
});
it("插入位置紧随 tailwind import", () => {
  const out = mergeTokensCss(`@import "tailwindcss";\nbody{}`, tokens);
  expect(out.indexOf("@custom-variant")).toBeGreaterThan(out.indexOf('@import "tailwindcss"'));
});
it("runInit 二次执行文件不变", () => {
  runInit(io, "/", { registry: "http://x/r/vue" });
  const snap = io.snapshot();
  runInit(io, "/", { registry: "http://x/r/vue" });
  expect(io.snapshot()).toEqual(snap);
});
```

其余：`detectTailwindV4` 缺依赖/缺 css import 均为 false；`runInit` 写出 components.json 与 cn 文件路径符合 alias 解析。

- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/init-core.test.ts`。
- [ ] **Step 3: 实现**（tokensCss 文本内置于 CLI 常量，与 `@tu-design/vue/src/styles/tokens.css` 保持一致，来源注释指向该文件）。
- [ ] **Step 4: 确认通过**。
- [ ] **Step 5: Commit** —— `✨ feat(cli): init 的 tailwind 检测/cn 注入/tokens 幂等合并`

### Task 19: init — tsconfig paths 与 vite alias 改写

**Files:**

- Create: `packages/cli/src/lib/alias.ts`、`packages/cli/src/lib/alias.test.ts`
- Modify: `packages/cli/src/index.ts`、`src/lib/init-core.ts`（runInit 末尾接线 `applyAliases`）

**Interfaces:**

- Produces:

```ts
export function mergeTsconfigPaths(source: string, paths: Record<string, string[]>): string;
// 无 compilerOptions.paths → 注入；已有 → 合并键；"@/*" 已存在且值相同 → 原样；不同 → 覆盖
export function mergeViteAlias(
  source: string,
  alias: { find: string; replacement: string },
): string;
// 无 resolve.alias → defineConfig({ 后插入 resolve 块；已有 resolve.alias → 追加键；无法安全改写 → 返回原文（调用方打印手动指引）
export function applyAliases(io: Io, cwd: string, aliasRoot: string): void;
// tsconfig.json 存在则写 {"@/*": [`./${aliasRoot}/*`]}；vite.config.ts 存在则 alias { find: "@", replacement: path.resolve(cwd, aliasRoot) }
```

- [ ] **Step 1: 写失败测试** —— 代表断言：空对象 tsconfig 注入后含 `"paths"` 与 `"@/*"`；已有 `paths: {"@/*": ["./app/*"]}` 时合并不丢原键；`mergeViteAlias` 对 `export default defineConfig({})` 产出含 `resolve` 与 `alias` 的合法 TS 文本（测试内直接字符串包含断言 + 执行者可用 `new Function` 冒烟可选）；无 `defineConfig` 的 vite 配置返回原文不变。
- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/alias.test.ts`。
- [ ] **Step 3: 实现**（纯字符串变换，不引入 AST 依赖）。
- [ ] **Step 4: 确认通过**。
- [ ] **Step 5: Commit** —— `✨ feat(cli): init 改写 tsconfig paths 与 vite alias`

### Task 20: init — 包管理器检测与依赖安装

**Files:**

- Create: `packages/cli/src/lib/pm.ts`、`packages/cli/src/lib/pm.test.ts`
- Modify: `packages/cli/src/index.ts`（init 末尾安装 `clsx tailwind-merge class-variance-authority`）

**Interfaces:**

- Produces:

```ts
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";
export function detectPackageManager(agent: string | undefined): PackageManager; // 未知识别 → "npm"
export function buildInstallCommand(pm: PackageManager, deps: string[], dev?: boolean): string[];
// pnpm: pnpm add <deps> [-D]；npm: npm install <deps> [-D]；yarn: yarn add <deps> [-D]；bun: bun add <deps> [-d]
export function installDependencies(
  io: Io & { exec(cmd: string[]): void },
  cwd: string,
  deps: string[],
  dev?: boolean,
): void;
// exec 实现：spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: "inherit" })；agent 由 package-manager-detector 在入口层取得后传入 detectPackageManager
```

- [ ] **Step 1: 写失败测试** —— `buildInstallCommand` 表驱动 4 PM × dev/非 dev 全断言；`detectPackageManager("pnpm@9.15.0")` → `"pnpm"`；`detectPackageManager(undefined)` → `"npm"`。
- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/pm.test.ts`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过**。
- [ ] **Step 5: Commit** —— `✨ feat(cli): 包管理器检测与依赖安装命令构造`

### Task 21: add — registry 解析（URL 优先，npm 兜底）

**Files:**

- Create: `packages/cli/src/lib/registry.ts`、`packages/cli/src/lib/registry.test.ts`

**Interfaces:**

- Consumes: `RegistryItem` 类型（Task 14，CLI 从 `@tu-design/vue` 源码 import 类型或本地复制类型定义——pin：CLI 内 `src/lib/registry-types.ts` 复制最小类型，避免跨包运行时依赖）。
- Produces:

```ts
export interface RegistryFetcher {
  fetchJson(url: string): Promise<unknown>;
}
export interface NpmChannel {
  hasItem(name: string): boolean;
  readItem(name: string): unknown;
} // 实现：定位 require.resolve("@tu-design/vue/package.json") → dist/registry/vue/<name>.json
export function resolveRegistryUrl(config: ComponentsConfig, override?: string): string; // override（--registry）优先
export function validateRegistryItem(raw: unknown): RegistryItem; // 校验 name/type/files 最小结构
export async function fetchItem(
  fetcher: RegistryFetcher,
  registryUrl: string,
  npm: NpmChannel,
  name: string,
): Promise<RegistryItem>;
// 1) fetch `${registryUrl}/${name}.json`；2) 失败/404/校验不过 → npm 兜底；3) 双失败 → 抛错文案含 name
```

- [ ] **Step 1: 写失败测试** —— 代表断言：fake fetcher 命中 URL 时不触 NpmChannel；URL 抛错时返回 npm readItem 结果；双失败 `rejects.toThrow(/button/)`；`resolveRegistryUrl(config, "http://o/r")` → `"http://o/r"`。
- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/registry.test.ts`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过**。
- [ ] **Step 5: Commit** —— `✨ feat(cli): registry 双通道解析与 item 校验`

### Task 22: add — 文件写入与覆盖处理

**Files:**

- Create: `packages/cli/src/lib/write.ts`、`packages/cli/src/lib/write.test.ts`

**Interfaces:**

- Consumes: `RegistryItem`、`ComponentsConfig`。
- Produces:

```ts
export function findProjectRoot(io: Io, cwd: string): string; // cwd 无 components.json 时向上层找最近者；到文件系统根仍无 → 抛错提示先 init
export function resolveTarget(target: string, config: ComponentsConfig, aliasRoot: string): string;
// registry JSON 的 target 恒为 POSIX /；此处 path.join(aliasRoot, ...target.split("/")) 规范化为平台路径
export interface WritePlan {
  path: string;
  content: string;
  exists: boolean;
}
export function planWrites(items: RegistryItem[], io: Io, aliasRoot: string): WritePlan[];
export async function writeFiles(
  plans: WritePlan[],
  io: Io,
  opts: { overwrite?: boolean; confirm?: (msg: string) => Promise<boolean> },
): Promise<string[]>;
// exists 且无 overwrite → confirm 询问（默认 prompts confirm）；拒绝 → 跳过；返回实际写入路径列表
```

- [ ] **Step 1: 写失败测试** —— 代表断言：`resolveTarget("components/ui/button/Button.vue", config, "/p/src")` → `"/p/src/components/ui/button/Button.vue"`（posix 下逐段 join，无 `//`）；`writeFiles` 冲突 + confirm=false → 跳过且不写；`overwrite: true` → 无询问直接覆盖；`findProjectRoot` 在嵌套内存结构中向上找到 components.json。
- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/write.test.ts`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过**。
- [ ] **Step 5: Commit** —— `✨ feat(cli): add 文件写入、覆盖询问与项目根检测`

### Task 23: add — 递归依赖、依赖合并与摘要

**Files:**

- Create: `packages/cli/src/lib/add-core.ts`、`packages/cli/src/lib/add-core.test.ts`
- Modify: `packages/cli/src/index.ts`（add action 完整接线 + picocolors 摘要输出）

**Interfaces:**

- Consumes: Task 18-22 全部产物。
- Produces:

```ts
export async function resolveTopo(
  names: string[],
  fetchOne: (name: string) => Promise<RegistryItem>,
): Promise<RegistryItem[]>;
// DFS：先展开 registryDependencies 再自身（依赖在前）；访问集+在栈集检测环 → 抛错含环路径 "a -> b -> a"
export function collectDeps(items: RegistryItem[]): {
  dependencies: string[];
  devDependencies: string[];
}; // 合并去重，保持出现序
export interface AddSummary {
  files: string[];
  dependencies: string[];
  devDependencies: string[];
}
export async function runAdd(
  io: Io & RegistryFetcher & { exec(cmd: string[]): void },
  cwd: string,
  names: string[],
  opts: { overwrite?: boolean; registry?: string },
): Promise<AddSummary>;
// findProjectRoot → loadConfig → 逐个 fetchItem（resolveRegistryUrl）→ resolveTopo → planWrites/writeFiles → collectDeps → installDependencies（有依赖才 exec）→ summary
```

- [ ] **Step 1: 写失败测试** —— 代表断言：

```ts
it("环引用报错并列出路径", async () => {
  const fetchOne = async (n: string) => items[n]; // a→b→a 的 fixture
  await expect(resolveTopo(["a"], fetchOne)).rejects.toThrow(/a -> b -> a/);
});
it("拓扑序依赖在前", async () => {
  const out = await resolveTopo(["button"], fetchOne); // button → utils
  expect(out.map((i) => i.name)).toEqual(["utils", "button"]);
});
it("collectDeps 去重", () =>
  expect(
    collectDeps([
      { name: "x", type: "registry:ui", files: [], dependencies: { clsx: "^2" } },
      {
        name: "y",
        type: "registry:ui",
        files: [],
        dependencies: { clsx: "^2", "tailwind-merge": "^3" },
      },
    ]).dependencies,
  ).toEqual(["clsx", "tailwind-merge"]));
it("runAdd 集成：写入文件并安装依赖", async () => {
  /* 内存 io + fake fetcher 跑 button；断言 cn 与 Button 文件落盘、exec 收到含 clsx 的命令 */
});
```

- [ ] **Step 2: 确认失败** —— `vp test --run src/lib/add-core.test.ts`。
- [ ] **Step 3: 实现**。
- [ ] **Step 4: 确认通过 + `cd packages/cli && vp pack`**。
- [ ] **Step 5: 手动冒烟** —— 临时目录造最小目标项目（package.json + tailwind v4 + 空 tsconfig），`node packages/cli/dist/index.js init --registry http://localhost:5173/r/vue`（docs dev 服务提供 URL 通道）+ `add button`：components.json / cn / tokens / 文件 / 依赖安装全部发生；再跑一遍验证幂等。问题修复后继续。
- [ ] **Step 6: Commit** —— `✨ feat(cli): add 递归依赖解析与安装摘要`

---

# 阶段 P4 —— 闭环与发布

### Task 24: 端到端验收（spec §11/§14）

**Files:** 全部位于 `/tmp/opencode/e2e/`，不进仓库（问题修复回仓库）。

- [ ] **Step 1: 构造目标项目** —— `pnpm create vite`（vue-ts 模板）+ 安装 tailwindcss/@tailwindcss/vite + css 入口 `@import "tailwindcss";` + vite 配置插件。**npm 通道准备**：`cd packages/vue && pnpm pack` → 目标项目 `pnpm add <tarball>`（同时校验 pack 产物可用）。
- [ ] **Step 2: init** —— 目标项目内 `node <repo>/packages/cli/dist/index.js init`。核对：components.json 生成、`src/lib/utils.ts`（cn）存在、全局 css 含 tokens（仅一份）、tsconfig paths 与 vite alias 就位、clsx/tailwind-merge/cva 已安装。
- [ ] **Step 3: add** —— `node <repo>/packages/cli/dist/index.js add button avatar`。核对：`src/components/ui/button|avatar/` 文件落盘；`@ark-ui/vue` 出现在目标项目依赖（Avatar 的 Ark 依赖自动安装）；`registryDependencies` 的 utils 先于组件写入。
- [ ] **Step 4: 渲染验收** —— 目标项目 App 用 Button（各 variant）+ Avatar 渲染，`npx vite build` 成功且产物含 `bg-primary`；dev 起服务人工确认样式正确（spec §14 第 2 条）。
- [ ] **Step 5: 问题回修** —— 发现的缺陷在仓库内修复 + 单测覆盖后重新走 Step 2-4。
- [ ] **Step 6: Commit（如有修复）** —— `🐛 fix: e2e 验收问题修复`

### Task 25: changesets 与发布配置

**Files:**

- Create: `.changeset/config.json`、`.changeset/release-0-1-0.md`
- Modify: `packages/vue/package.json`、`packages/cli/package.json`（`publishConfig: { "access": "public" }`、`files`）、根 `package.json`（发布 scripts）

- [ ] **Step 1: 配置 changesets** —— `.changeset/config.json`：`{ "access": "public", "baseBranch": "master" }`（其余默认）；changeset 文件声明 `@tu-design/vue` 与 `@tu-design/cli` minor。
- [ ] **Step 2: 发布脚本** —— 根 `package.json` scripts 增：

```json
"version:pkg": "changeset version",
"publish:pkg": "pnpm -r --filter '@tu-design/*' publish --no-git-checks"
```

（changeset 只管版本与 changelog；**publish 显式走 pnpm**，满足 spec §10.2 硬性要求。）

- [ ] **Step 3: version 演练** —— `vp run version:pkg`：两包版本变 `0.1.0`，CHANGELOG 生成。核对后保留（这是真实首版）。
- [ ] **Step 4: pack 干跑验证** —— `cd packages/vue && vp run build && pnpm pack --dry-run`（cli 同理）。核对：tarball 内 `package.json` 无 `catalog:`/`workspace:`（pnpm pack 已替换为具体版本）；`files` 只含 `dist`（含 `dist/registry/vue/`）；cli 的 bin 可执行。
- [ ] **Step 5: Commit** —— `🔖 chore: 接入 changesets 与 pnpm publish 发布配置`

### Task 26: 成功标准核对与收尾

**Files:** 无新增（核对清单执行）。

- [ ] **Step 1: 全量质量门** —— `vp check && vp run -r test && vp run -r build`，Expected: 全绿。
- [ ] **Step 2: registry schema 校验** —— 一次性脚本（/tmp）：用 `ajv` + 官方 `registry-item.json` schema 校验 `packages/vue/registry/vue/*.json` 全部通过（不引入仓库依赖）。
- [ ] **Step 3: spec §14 清单逐项核对** —— docs 8 demo 热更（Task 13 已验）、e2e init/add（Task 24）、registry 无协议残留 + schema（Step 2）、质量门（Step 1）、changesets dry-run（Task 25 Step 4）。任何未达标项回到对应任务修复。
- [ ] **Step 4: 最终 Commit（如有遗留）** —— `✅ test: 成功标准核对收尾`

---

## 执行备注

- 仓库当前在 `master` 且**尚无提交**，Task 1 Step 1 完成首次提交后才具备常规 git 操作条件；单人仓库直接在 master 实施（`using-git-worktrees` 在无提交状态下不适用）。
- 版本待定依赖（`tsx`、`yaml`、`shiki`、`vue-router`）在首次 `pnpm add` 后立即把解析范围回填 `pnpm-workspace.yaml` catalog。
- **仓库内禁用 npm**：根 `package.json` 的 `devEngines.packageManager` 会使任何 npm 命令报 EBADDEVENGINES（2026-09-29 实测）；monorepo 内一律用 pnpm/vp，npm 命令仅限 /tmp 临时目标项目中执行。
- 任一 Spike 失败启用对应预案（spec §12/§15），不阻塞整体。
