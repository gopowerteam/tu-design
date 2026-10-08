# tu-design

shadcn 风格的 Vue 3 组件库 monorepo（Tailwind v4 + oklch CSS 变量主题 + Ark UI 原语）。

## 包结构

- `packages/vue` — `@tu-design/vue` 组件库，组件源码在 `src/components/<name>/`
- `packages/cli` — `tu-design` CLI（`init`/`add`），按 registry 向用户项目分发组件源码
- `apps/docs` — VitePress 文档站（`vp run dev`，端口 5174）

## 常用命令

```bash
vp install              # 安装依赖（拉取远端变更后先执行）
vp check                # oxfmt + oxlint（typeAware），不覆盖 Vue SFC
vp run -r typecheck     # SFC 类型兜底：vue-tsc（vue 包）+ tsc（cli 包）
vp test                 # 根目录一键测试（vitest projects：packages/vue + packages/cli）
vp run ready            # 全量体检 = vp check + 递归 test + 递归 build（等同于 CI）
```

- 运行单个包的测试：`cd packages/vue && vp test --run`（可追加文件名过滤参数）。
- CI 顺序固定：check → typecheck → test → build（`.github/workflows/ci.yml`）；`vp check` 不覆盖 SFC，typecheck 不能省。
- 本地提交会触发 pre-commit 钩子（`vp staged` → 对暂存文件执行 `vp check --fix`）。

## 高频陷阱

- 一切经由 `vp`：`vp run <script>` 跑 package.json 脚本，`vp <name>` 是内置命令，两者可能不同。不要直接调 vite/vitest/oxlint。
- 依赖版本统一走 pnpm catalog（`catalogMode: prefer`）：新增依赖须加进 `pnpm-workspace.yaml` 的 `catalog:`，包内写 `"catalog:"`。
- **registry 是生成物且已提交**：改动 `src/components/`、`src/lib/utils.ts`、`src/styles/tokens.css` 或 workspace catalog 后，必须 `cd packages/vue && vp run generate:registry` 重新生成 `registry/vue/*.json`，否则防漂移测试失败。生成时会将 `catalog:` 依赖翻译为真实版本号并剔除 `.test.ts` 文件。
- `TuDesignResolver`（`src/resolver.ts`）用组件名白名单而非 `/^T[A-Z]/` 正则（避免误捕 Transition/Teleport 等内置组件）；白名单必须与 `index.ts` 导出保持同步，`resolver.test.ts` 强制校验。
- 环境要求：Node ≥ 22.18.0，pnpm 12.6.0（`packageManager` 字段固定）。

## 发版（bumpp 锁定版本模型）

1. conventional commits 累积变更，发版时根目录 `pnpm release`：全 workspace 统一升版本（vue/cli 锁定同版本）→ 单 commit + tag `v{version}` + push。
2. tag 触发 `.github/workflows/publish.yml`：遍历 `PACKAGES` 清单校验锁定版本 → 逐包 pnpm pack（prepack 完整构建）→ 逐包 npm publish（OIDC，无需 NPM_TOKEN，需在 npmjs.com 配置 Trusted Publisher）→ changelogithub 生成单个 GitHub Release。
3. **新增可发布包时必须同步更新 publish.yml 的 `PACKAGES` 清单**，否则该包永不发布。
4. 手动兜底：`vp run publish:pkg`（注意 pnpm publish 会触发 prepack 构建）。changesets 已退役，`.changeset/` 与 `version:pkg` 已移除。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

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
