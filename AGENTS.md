# tu-design

shadcn 风格的 Vue 3 组件库 monorepo。组件以**源码**形式经 registry 分发到用户项目（不是 npm 运行时依赖）：Tailwind v4 + oklch CSS 变量主题 + Ark UI 原语。

## 包结构

- `packages/vue` — `@tu-design/vue`，组件源码在 `src/components/<name>/`（`<Name>.vue`、`index.ts`、`registry.meta.json`、`*.test.ts`）
- `packages/cli` — `tu-design` CLI：`init` / `add` / `diff` / `mcp`，registry 客户端 + `components.lock.json` 升级链路
- `packages/config-lint` — 私有 lint 配置片段（`defineLintConfig` 组合器 + JSDoc 规则），被根 `vite.config.ts` 加载
- `apps/docs` — VitePress 文档站，同时伺服 registry、`llms.txt` 与原始 `.md` 端点
- `apps/playground` — 组件更新 e2e 脚本，无 `package.json`，不参与 workspace test/build

## 常用命令

```bash
vp install              # 安装依赖（拉取远端变更后先执行）
vp check                # oxfmt + oxlint（typeAware），不检查 .vue
vp run -r typecheck     # SFC 类型兜底：vue-tsc（vue 包）+ tsc（cli 包）
vp test                 # 根 vitest：projects = packages/vue、packages/cli、packages/config-lint
vp run ready            # check + 递归 test + 递归 build —— 不含 typecheck，不等同 CI
```

- 单包/单文件测试：`cd packages/vue && vp test --run <文件名过滤>`；测试 API 从 `vite-plus/test` 导入（lint 规则强制），vue 包用 happy-dom + `test/setup.ts`。
- CI 顺序固定 `check → typecheck → test → build`（`.github/workflows/ci.yml`）。`vp run ready` 缺 typecheck，**改 `.vue` 后必须单独跑 `vp run -r typecheck`**（`vp check` 覆盖不到 SFC）。
- 文档站：`vp run docs`（根脚本）或 `cd apps/docs && vp run dev`；默认端口 5173（占用则 +1），base 固定 `/tu-design/`。
- 本地提交钩子由 `vp config`（`prepare`）生成到 `.vite-hooks/`，对暂存文件跑 `vp check --fix`；勿手改。

## 高频陷阱

- 一切经由 `vp`：`vp run <script>` 跑 package.json 脚本，`vp <name>` 是内置命令，两者可能不同；不要直接调 vite/vitest/oxlint/tsx。
- 依赖版本统一走 pnpm catalog（`catalogMode: prefer`）：新增依赖写入 `pnpm-workspace.yaml` 的 `catalog:`，包内写 `"catalog:"`。registry 生成时把 `catalog:` 翻译成真实版本号，`workspace:` 协议会被拒绝。
- **registry 是已提交的生成物**：改动 `packages/vue/src/components/**`、`src/lib/utils.ts`、`src/styles/tokens.css` 或 workspace catalog 后，必须 `cd packages/vue && vp run generate:registry`；`src/registry/drift.test.ts` 会逐文件比对。
- **CLI 注入源码同样是生成物**：改 `tokens.css` 或 `src/lib/utils.ts` 后还要 `pnpm --filter @tu-design/cli generate:sources`，否则 `init-core.test.ts` 的防漂移断言失败。
- 新增组件：目录必须带 `registry.meta.json`（`description`、`registryDependencies`、`dependencies` 用 `catalog:`）；generator 会校验源码 import 的 npm 包与 registry 依赖都已在 meta 声明，否则生成失败。同时更新 `src/index.ts` 导出与 `src/resolver.ts` 的 `COMPONENT_NAMES`（`resolver.test.ts` 强制同步），并补 `apps/docs/components/<name>.md` + `apps/docs/demos/<name>/*.vue`。
- `TuDesignResolver` 用组件名白名单而非 `/^T[A-Z]/` 正则，避免误捕 Transition/Teleport 等内置组件。
- **JSDoc 是 error 级 lint 要求**：模块顶层函数（含未导出的箭头函数）必须有 `/** ... */`，`@param` / `@returns` 带描述；测试文件、`.vue`、`config-lint` 自身豁免。
- 环境契约：Node ≥ 22.18.0，pnpm 12.6.0（`devEngines` 固定，`onFail: download`）。不要用 taze 升级 pnpm，也不要升 TypeScript 到 7（vue-tsc 尚不支持）；`minimumReleaseAge: 0` 是刻意关闭，勿改回默认。
- 不要在本仓库根目录执行 `tu-design init` / `add`（会写 `components.json`、改 CSS、装依赖污染仓库）；验证 CLI 用 playground 或临时目录。

## registry 分发链路（CLI ↔ 文档站）

- CLI 默认数据源是线上 Pages：`https://gopowerteam.github.io/tu-design/r/vue`（`packages/cli/src/lib/config.ts` 的 `DEFAULT_REGISTRY`，`--registry` 可覆盖）。
- 文档站 dev 期用 Vite 中间件伺服 `/r/vue/*.json`（直接读 `packages/vue/registry/vue`）；build 期 `buildEnd` 复制进 `dist/r/vue`，并生成 `llms.txt` / `llms-full.txt`。中间件先于 Vite base 剥离执行，需手动处理 `/tu-design/` 前缀。
- `.github/workflows/deploy-pages.yml`：push master 且 `apps/docs/**` 或 `packages/vue/**` 有变更才部署；registry 改动要等 Pages 部署后线上 CLI 才生效。

## 发版（bumpp 锁定版本模型）

1. `pnpm release <version>`（版本号显式传入）：`recursive` + `all` 让全 workspace 统一版本，`execute` 钩子自动 `vp run -r generate:registry`，产物随 release commit 一并提交 → 单 commit + tag `v{version}` + push。
2. tag 触发 `.github/workflows/publish.yml`：按 `PACKAGES`（`@tu-design/vue @tu-design/cli`）校验版本一致 → `pnpm pack`（prepack 完整构建）→ npm OIDC 发布 → changelogithub 生成 Release。**新增可发布包必须加进 `PACKAGES`；`@tu-design/docs` 私有，禁止加入。**
3. 手动兜底：`vp run publish:pkg`（`pnpm publish` 会触发 prepack 构建）。changesets 已退役。

## 组件更新 e2e（playground）

- `bash apps/playground/component-update/run-tests.sh`，前置需先构建 CLI（`vp run -r build`）。脚本自包含 mock registry + stub pnpm，退出码 = 失败断言数；生成物已 gitignore，且不在 `vp test` / CI 内 —— 改动 `add` / `diff` / lockfile 逻辑后手动跑。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
