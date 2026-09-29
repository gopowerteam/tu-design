# tu-design · shadcn 模式 Vue 组件库 — 设计文档

- 日期：2026-09-29
- 状态：已评审（含验证修订）；2026-09-29 修订：移除已删除的 apps/website 与 packages/utils 相关表述（monorepo 为空白起点）。待实施计划
- 范围：架构设计（Architectural path）

## 1. 目标与非目标

### 目标

在 tu-design monorepo（vite-plus + pnpm catalog 工具链）中构建「shadcn 模式」的 Vue 组件库：

- **CLI + registry 分发组件源码**（非传统 npm 组件包安装）：用户通过 `npx tu-design init` / `npx tu-design add <component>` 把组件源码复制进自己的项目，可自由修改。
- 组件基于 **Ark UI（`@ark-ui/vue`）** 无头原语 + **Tailwind CSS v4** 样式。
- 发布 `@tu-design/*` scoped 公开 npm 包。
- 文档演示站新建 `apps/docs`。
- 命名框架感知，为将来 React 版本预留对称扩展路径。

### 非目标（本期不做）

- React 版组件包（`@tu-design/react`）——仅预留命名与结构，不实现。
- 传统 npm 安装形态的组件包（用户直接 `import { Button } from "@tu-design/vue"`）——`vp pack` 构建产物仅为 registry 附带产物，不在本期宣传/支持。
- 首批只做基础套件（见 §5），交互套件（Dialog/DropdownMenu 等）后续迭代。

## 2. 关键决策记录

| 决策点          | 结论                                            | 备选与理由                                              |
| --------------- | ----------------------------------------------- | ------------------------------------------------------- |
| 分发模式        | CLI + registry（shadcn 模式）                   | 用户明确选择；传统 npm 包与双模式被否决                 |
| 无头底座        | Ark UI（`@ark-ui/vue`）                         | 用户指定；替代 shadcn-vue 默认的 reka-ui                |
| 文档站          | 新建 `apps/docs`                                | monorepo 为空白起点，无历史包袱                         |
| 发布            | `@tu-design/*` scoped 公开发布                  | —                                                       |
| 首批组件        | 基础套件 8 个                                   | 小范围跑通全链路后再扩展                                |
| registry 事实源 | 源码包 + 构建时自动生成 registry JSON（方案 A） | 否决手写双份维护（方案 B）与无元数据 Git 直拉（方案 C） |

## 3. 命名规范（framework-aware）

| 对象                     | 命名                               | 说明                                                                         |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------- |
| 发布包                   | `@tu-design/vue`、`@tu-design/cli` | React 未来为 `@tu-design/react`（参照 `@ark-ui/vue` / `@ark-ui/react` 先例） |
| registry 通道            | `registry/vue/*.json`              | React 未来为 `registry/react/*.json`                                         |
| 组件目录与 registry 名称 | `button`、`dialog`…                | 框架无关，Vue/React 两端同名                                                 |
| CLI bin                  | `tu-design`                        | `npx tu-design add button`                                                   |
| 用户项目配置             | `components.json`                  | 含自定义扩展字段 `framework: "vue"`                                          |

注意：

- `components.json` 的 `framework` 字段是**对 shadcn 官方 schema 的扩展**，CLI 需内置自定义 JSON schema 校验。
- registry-item 本体沿用官方 `$schema`（`https://ui.shadcn.com/schema/registry-item.json`），因此对官方 `npx shadcn` **schema 兼容、配置 namespace 后可消费**，并非开箱即用。
- monorepo 内不存在历史包（原 `packages/utils` 已删除）；所有发布包一律用 `@tu-design` scope。

## 4. 包结构与技术栈

### 4.1 包结构

```
tu-design/
├── apps/
│   └── docs/               # @tu-design 文档站（Vue 3 + Tailwind v4）
├── packages/
│   ├── vue/                # @tu-design/vue —— 组件源码 + vue registry（核心）
│   └── cli/                # @tu-design/cli —— 框架感知 CLI（核心）
```

`pnpm-workspace.yaml` 已含 `apps/*` / `packages/*` / `tools/*` 与 `catalogMode: prefer`，无需调整 packages 声明。

### 4.2 技术栈（版本已核实，2026-09-29）

| 依赖                                   | 版本                  | 用途                                      |
| -------------------------------------- | --------------------- | ----------------------------------------- |
| `vue`                                  | ^3.5.43（进 catalog） | 运行时，peer ≥3.5 满足 `@ark-ui/vue` 要求 |
| `@ark-ui/vue`                          | ^5.39.2               | 无头原语（交互组件）                      |
| `tailwindcss` + `@tailwindcss/vite`    | v4                    | CSS-first 样式                            |
| `clsx`                                 | ^2.1.1                | class 组合                                |
| `tailwind-merge`                       | ^3.7.0                | Tailwind v4 兼容的 class 去重             |
| `class-variance-authority`             | ^0.7.1                | 组件变体                                  |
| `tw-animate-css`                       | ^1.4.0                | v4 动画（shadcn 官方方案）                |
| `commander` / `prompts` / `picocolors` | commander ^15         | CLI                                       |
| `package-manager-detector`             | latest                | 用户项目包管理器检测                      |
| `@vue/test-utils`                      | ^2.5.1                | 组件测试                                  |
| `@changesets/cli`                      | ^3.0.3                | 多包版本管理                              |

全部公共依赖版本进 `pnpm-workspace.yaml` 的 `catalog`。

## 5. 组件封装模式（`packages/vue`）

### 5.1 首批组件（基础套件）

| 组件      | registry 名 | 实现方式                                                                                                        |
| --------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| Button    | `button`    | 纯 SFC + cva 变体；支持动态 `as` 标签（默认 `"button"`）；`asChild` 不在本期（待交互批次结合 Ark 原语统一评估） |
| Badge     | `badge`     | 纯 SFC + cva                                                                                                    |
| Card      | `card`      | 纯 SFC（Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter 子组件，同目录多文件）                 |
| Separator | `separator` | 纯 SFC（原生 div 实现，交互版后续替换 Ark 原语）                                                                |
| Skeleton  | `skeleton`  | 纯 SFC                                                                                                          |
| Input     | `input`     | 纯 SFC + `useModel`/attrs 透传                                                                                  |
| Label     | `label`     | 纯 SFC（原生 `label` 元素）                                                                                     |
| Avatar    | `avatar`    | **`@ark-ui/vue` Avatar**（图片加载态/回退）——作为 Ark 集成模式先行验证                                          |

原则：纯样式组件不引入无头库；交互组件（Dialog、DropdownMenu、Select、Tabs 等，后续批次）一律基于 `@ark-ui/vue` 原语封装。

### 5.2 目录与文件约定

```
packages/vue/src/components/button/
├── Button.vue        # SFC：样式 + 变体 + attrs/class 透传，不持有业务状态
└── index.ts          # export { default as Button, buttonVariants }
```

- 变体函数（如 `buttonVariants`）必须从 `index.ts` 具名导出，供非组件场景复用与 registry 提取。
- `cn` 工具：`packages/vue/src/lib/utils.ts`（`clsx` + `tailwind-merge`，依赖版本见 §4.2），registry 以 `registry:lib` 形态提供。

## 6. Tailwind v4 tokens 体系

- 入口：用户全局 CSS 中 `@import "tailwindcss";`
- 暗色模式：`@custom-variant dark (&:where(.dark, .dark *));`（class 策略）
- 语义 tokens（oklch）：`:root` 与 `.dark` 定义 `--background`、`--foreground`、`--primary`、`--primary-foreground`、`--muted`、`--muted-foreground`、`--border`、`--input`、`--ring`、`--radius` 等（完整清单与 shadcn 官方 v4 token 集一致）
- 映射：`@theme inline` 将 CSS 变量映射为 Tailwind 颜色/圆角 token（`--color-background: var(--background)` 等）
- 动画：`@import "tw-animate-css";`
- **归属与升级路径**：tokens 源文件 `packages/vue/src/styles/tokens.css`；React 落地时上移为共享 style item（registry `registry:style`）或独立 `@tu-design/tokens`，防止两框架 tokens 漂移。本期不做上移（YAGNI），但此路径写入本 spec 作为约束。

## 7. Registry 设计

### 7.1 结构

- 目录：`packages/vue/registry/vue/`（生成产物，构建时写入 `dist/registry/vue/` 并随包发布）
- 每个 registry item 一个 JSON：`registry/vue/button.json`，外加索引 `registry/vue/registry.json`
- item schema：shadcn `registry-item`（`$schema`、`name`、`type`（`registry:ui` / `registry:lib` / `registry:style`）、`registryDependencies`、`dependencies`、`devDependencies`、`files[]`（`path`/`type`/`target`/`content`）、`tailwind`）

### 7.2 生成器（单一事实源）

- 输入：`packages/vue/src/components/*`（组件目录 + 每组件元数据文件 `registry.meta.json`：描述、`registryDependencies`、额外 `dependencies`）与 `src/lib/utils.ts`、`src/styles/tokens.css`
- 输出：上述 JSON 集合 + 索引
- **硬性规则：生成器必须把 `catalog:` 引用翻译为具体版本范围**（解析 `pnpm-workspace.yaml` 的 catalog，如 `@ark-ui/vue` → `^5.39.2`）。禁止 `catalog:` / `workspace:` 协议出现在任何 registry JSON 中。
- 生成器为纯函数逻辑，配 vitest 单测（catalog 翻译、schema 产出、索引一致性）。

### 7.3 分发通道

1. **npm 通道**：registry JSON 随 `@tu-design/vue` 发布（`files` 含 `dist/registry/`）；CLI 将 `@tu-design/vue` 作为依赖内嵌读取。
2. **URL 通道**：docs 站同源静态托管 `/r/vue/*.json`（构建产物直接复制 registry 目录）；部署平台默认 **GitHub Pages**（后续可换，不影响 CLI——URL 仅是 `components.json` 中的一个配置项）。

## 8. CLI 设计（`@tu-design/cli`）

### 8.1 命令

**`tu-design init`**

1. 检测目标项目 Tailwind v4（读 `package.json` 依赖 + 全局 CSS `@import "tailwindcss"`）
2. 写 `components.json`：`{ framework: "vue", registry: <url>, aliases: { components, utils, ui, lib }, tailwind.css 路径 }`
3. 注入 `cn` 工具到 aliases.utils 指向路径
4. 将 tokens（`@custom-variant dark` + CSS 变量 + `@theme inline` 块）合并进用户全局 CSS（幂等：已存在则跳过）
5. **检测并改写用户 tsconfig `paths` 与 vite alias**，保证 `@/lib/utils` 等别名可解析
6. 用 `package-manager-detector` 检测 pnpm/npm/yarn/bun，安装 `clsx`、`tailwind-merge`、`class-variance-authority`（交互组件在 `add` 时按需追加 `@ark-ui/vue`）

**`tu-design add <components...>`**

1. 读目标项目 `components.json`，按 `framework` 选择 registry 通道（vue/react）
2. 从 npm 通道或 URL 通道拉取 item（URL 优先，npm 兜底；`--registry` 可覆盖）
3. 按 `files[].target` 写入用户组件目录（**边界处理：Windows 路径分隔符、已存在文件询问覆盖、monorepo 子项目根检测**）
4. 安装 item 声明的 `dependencies` / `devDependencies`（走检测到的包管理器，更新 lockfile）
5. 递归处理 `registryDependencies`（拓扑序，防循环：访问集合 + 报错）
6. 输出安装摘要（写入的文件、安装的依赖）

### 8.2 工程与测试

- TypeScript + `commander` + `prompts` + `picocolors`，bin 名 `tu-design`
- **必配单测**：`add` 的文件写入/依赖合并/递归依赖处理为纯逻辑（IO 层注入），registry 解析与 schema 校验同测
- React 扩展 = 仅新增 `registry/react/*` 数据 + components.json 的 `framework: "react"` 分支数据，**CLI 代码零改动**

## 9. 文档站（`apps/docs`）

- Vue 3 + vue-router + Tailwind v4，vite-plus 驱动（`vp dev` / `vp build`）
- **源码级引用：docs 的 vite 配置将 `@tu-design/vue` alias 到 `../vue/src`**，绕开该包 exports 指向 `dist` 的问题，保证组件改动实时热更（备选：`@tu-design/vue` exports 增加 `development` 条件指向 src——默认用 alias，简单且不影响对外 exports）
- 每组件页：在线 Demo + shiki 源码高亮 + `npx tu-design add <name>` 安装命令
- 构建产物托管 registry JSON（`/r/vue/*.json`，见 §7.3）

## 10. 构建与发布

### 10.1 构建（`vp pack`）

| 包             | 配置要点                                                                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/vue` | **与默认 tsdown 配置分叉**：`pack.plugins: [Vue({ isProduction: true })]`（`unplugin-vue/rolldown`）+ `pack.dts: { vue: true }`（rolldown-plugin-dts + vue-tsc）。tsgo generator 不能为 SFC 产出类型，不沿用。另跑 registry 生成脚本（`build` 前置步骤）。`exports: true` 维持 |
| `packages/cli` | 标准 tsdown 模式（tsdown + tsgo dts + `exports: true`），bin 声明 `tu-design`                                                                                                                                                                                                  |

### 10.2 发布

- changesets 管理多包版本（`@tu-design/vue` + `@tu-design/cli`）
- **publish 步骤必须走 `pnpm publish`**（catalog:/workspace: 协议仅在 pnpm publish/pack 时被替换为具体版本；npm publish 不会）
- 首版 `0.1.0`，`publishConfig.access: "public"`

## 11. 测试与质量

| 层              | 手段                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 组件            | `vp test`（vitest）+ `@vue/test-utils`：挂载渲染、变体 class 断言、attrs 透传、快照                                    |
| registry 生成器 | vitest 纯逻辑单测（catalog 翻译、schema 产出、索引一致性）                                                             |
| CLI             | vitest 纯逻辑单测（IO 注入）：写入、依赖合并、递归依赖、覆盖询问分支                                                   |
| 文档站          | 手动预览兜底；不设自动化测试                                                                                           |
| Lint/类型       | `vp check`（typeAware oxlint）；**SFC 的 lint 覆盖有限，SFC 质量以 vue-tsc 类型检查 + 测试兜底**（已知限制，记录在案） |
| 端到端验收      | 临时项目（非 monorepo）执行 `npx tu-design init` + `add button avatar`，Tailwind v4 项目中渲染成功、样式正确、依赖齐全 |

## 12. 实施前验证（Day-1 Spikes）

1. **vite-plus `pack` 对 `plugins` 的透传**：`packages/vue/vite.config.ts` 中挂 `unplugin-vue/rolldown`，验证 SFC 编译产物正确。
2. **vue-tsc（^3.3.11）与 catalog TypeScript（^7.0.2）兼容性**：semver 上 `>=5.0.0` 包含 7.x，但 Volar 对 TS 7 的完整支持需实测；**失败则 `packages/vue` 独立锁定 TS 5.x**（pnpm 允许 per-package 覆盖，不进 catalog）。
3. **最小闭环冒烟**：一个组件 → registry JSON → CLI `add` → 临时项目渲染。

任一 spike 失败不阻塞整体，按上述预案调整后继续。

## 13. 实施阶段（供 writing-plans 展开）

1. **P0 骨架**：spikes → `packages/vue` 初始化（含 `tokens.css`、`lib/utils.ts`）→ `apps/docs` 初始化 + alias 热更验证
2. **P1 基础套件**：8 个组件实现 + 组件测试
3. **P2 registry**：生成器 + 元数据 + 单测
4. **P3 CLI**：init / add + 包管理器检测 + alias 改写 + 单测
5. **P4 闭环与发布**：端到端验收 → changesets + `pnpm publish` 配置

## 14. 成功标准

- [ ] `apps/docs` 中 8 个组件 Demo 全部可用且热更生效
- [ ] 临时 Vue 项目（Tailwind v4）中 `npx tu-design init` 幂等成功，`add button avatar` 后组件开箱可用（含 Avatar 的 Ark 依赖自动安装）
- [ ] registry JSON 无 `catalog:` / `workspace:` 协议残留；schema 通过官方 registry-item 校验
- [ ] `vp check`、`vp run -r test`、`vp run -r build` 全绿
- [ ] changesets 版本流程演练通过（dry-run）

## 15. 风险登记

| 风险                                          | 等级 | 缓解                                                |
| --------------------------------------------- | ---- | --------------------------------------------------- |
| Volar/vue-tsc 对 TS 7 支持不完整              | 中   | spike #2 前置验证；预案锁 TS 5.x                    |
| vite-plus pack 不透传 plugins                 | 中   | spike #1 前置验证；预案改用 tsdown.config.ts 直配   |
| changesets 与 `pnpm publish`/catalog 集成细节 | 低   | P4 演练（dry-run）验证；发布脚本显式 `pnpm publish` |
| registry 单文件内嵌源码导致体积增长           | 低   | 组件数量可控（shadcn 同构）；索引轻量化             |
| Ark UI Vue 版 API 迭代                        | 低   | 交互组件仅后续批次引入；封装层隔离原语 API          |

---

参考：验证过程中核实的依赖版本与工具链事实（`@ark-ui/vue@5.39.2` peer `vue>=3.5`、tsdown Vue 配方 `unplugin-vue` + `dts:{vue:true}`、pnpm catalog 协议在 publish/pack 时替换、`vue-tsc@3.3.11` peer `typescript>=5.0.0`）已并入上文对应章节。
