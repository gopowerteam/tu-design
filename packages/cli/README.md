# @tu-design/cli

`tu-design` —— [tu-design](../vue) 组件库的 registry 分发 CLI（shadcn 模式）：初始化项目配置，并把组件源码从 registry 拉取写入你的项目。

## 使用

```bash
npx @tu-design/cli init
npx @tu-design/cli add button
```

### `init`

初始化 `components.json`，并自动完成基础接入：

- 写入 `components.json`（registry URL、别名等配置）
- 注入 `cn` 工具到 `src/lib/utils.ts`
- 将主题 tokens 合并进全局 CSS（自动探测常见位置，可用 `--css` 指定；已包含则跳过）
- 写入 `AGENTS.md` AI 协作规则（组件安装 / 自动导入 / 语义 token 主题约定，供 AI 编码代理遵循；文件已存在时不覆盖，`--no-agents` 可显式跳过）
- 探测包管理器并安装运行时依赖（`clsx` / `tailwind-merge` / `class-variance-authority`）

| 选项               | 说明                                |
| ------------------ | ----------------------------------- |
| `--registry <url>` | registry URL，默认线上 Pages 数据源 |
| `--css <path>`     | 全局 CSS 路径                       |
| `--no-agents`      | 不写入 AGENTS.md AI 协作规则        |

### `add <components...>`

按名字添加组件源码（支持一次多个），文件写入 `components.json` 声明的位置：

| 选项               | 说明                                     |
| ------------------ | ---------------------------------------- |
| `--registry <url>` | 覆盖 `components.json` 中的 registry URL |
| `--overwrite`      | 覆盖已存在的文件而不询问                 |

### `mcp`

启动 MCP Server（stdio 传输，只查询、不安装）：供 Claude / Cursor 等 AI 客户端在线查询组件 registry——列出组件、按关键字搜索、获取单个组件的 registry 详情（内联源码、依赖与安装提示），引导 AI 用 CLI 安装而不是手写源码。

| 选项               | 说明              |
| ------------------ | ----------------- |
| `--registry <url>` | registry URL 通道 |

客户端配置示例（与文档站一致）：

```json
{ "mcpServers": { "tu-design": { "command": "npx", "args": ["-y", "@tu-design/cli", "mcp"] } } }
```

## 工作机制

CLI 从 registry 服务拉取每个组件的 **registry JSON**（遵循 [shadcn registry-item schema](https://ui.shadcn.com/schema/registry-item.json)），JSON 中内联了文件内容与写入目标，并声明：

- `registryDependencies` —— 依赖的基础项（如 `utils`、`tokens`），CLI 会先行安装
- `dependencies` —— 需要的 npm 依赖（如 Ark UI、TanStack 包），CLI 检测到后用当前包管理器安装

默认 registry 数据源是文档站 Pages 上发布的 `https://gopowerteam.github.io/tu-design/r/vue`，由 [`@tu-design/vue` 的 `generate:registry`](../vue) 生成并随 Pages 部署更新，可用 `--registry` 指向自建服务。

## 开发

- 构建：`vp run build`（`vp pack` + `fix-bin`）；测试：`vp test --run`；类型：`vp run typecheck`
- `src/lib/generated-sources.ts`（init 注入的 tokens.css / cn 工具模板常量）由 `scripts/generate-sources.ts` 从 `@tu-design/vue` 源码生成，勿手改：改动 `packages/vue/src/styles/tokens.css` 或 `packages/vue/src/lib/utils.ts` 后运行 `pnpm --filter @tu-design/cli generate:sources` 再生成，`init-core.test.ts` 防漂移守卫会拦截漏跑。

## 相关

- 组件库：[@tu-design/vue](../vue)
- 文档站：<https://gopowerteam.github.io/tu-design/>（含 CLI 指南）
- 仓库：<https://github.com/gopowerteam/tu-design>
- 许可：MIT
