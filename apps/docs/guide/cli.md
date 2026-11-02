# CLI

通过 `npx @tu-design/cli add <name>` 把组件源码添加到你的项目：

```bash
npx @tu-design/cli add button
npx @tu-design/cli add avatar
npx @tu-design/cli add utils tokens   # 基础依赖
```

## 工作机制

CLI 从 registry 服务拉取组件的 **registry JSON**（遵循 [shadcn registry-item schema](https://ui.shadcn.com/schema/registry-item.json)），并将其中内联的文件内容写入你的项目：

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "button",
  "type": "registry:ui",
  "registryDependencies": ["utils"], // 先行安装的依赖项
  "dependencies": ["class-variance-authority@^0.7.1"], // 需要的 npm 依赖
  "files": [
    {
      "path": "button/Button.vue",
      "type": "registry:component",
      "target": "components/ui/button/Button.vue", // 写入位置
      "content": "…", // 源码内联
    },
  ],
}
```

## 依赖链

部分组件依赖基础项，CLI 会按 `registryDependencies` 自动先装：

| 项       | 作用                                                      |
| -------- | --------------------------------------------------------- |
| `utils`  | 生成 `lib/utils.ts` 的 `cn` 工具（clsx + tailwind-merge） |
| `tokens` | 生成 `tokens.css` 主题变量（shadcn 风格，oklch）          |

例如 `button` 声明了 `registryDependencies: ["utils"]`，`avatar` 基于 Ark UI 并声明相应 npm 依赖——首次添加组件时建议先手动补齐 `utils` 与 `tokens`。

## 更新已安装组件

组件以**源码**分发到你项目里（不是 npm 运行时依赖），更新组件 = 重新拉取 registry 并覆盖本地文件：

```bash
npx @tu-design/cli add button --overwrite   # 直接覆盖本地同名文件
npx @tu-design/cli add button --dry-run     # 只预览将写入/覆盖的文件，不落盘
npx @tu-design/cli diff                     # 对比全部已安装组件与线上最新版本
npx @tu-design/cli diff button avatar       # 只对比指定组件
```

`diff` 输出每个文件的状态：

| 状态     | 含义                                                   |
| -------- | ------------------------------------------------------ |
| 最新     | 本地与线上一致                                         |
| 可更新   | 本地未改动，线上有新版，可安全 `--overwrite`           |
| 本地已改 | 你改过该文件，线上没变                                 |
| 冲突     | 你改过该文件，线上也更新了，建议先 `git diff` 人工比对 |
| 缺失     | 本地缺文件（如新版新增的文件），重新 `add` 即可补齐    |

### 覆盖行为

- 内容相同的文件自动跳过（幂等），不会重复询问。
- 交互终端下，内容不同的文件会逐个询问是否覆盖。
- **非交互环境（CI / 管道）必须显式 `--overwrite`**：否则内容不同的文件会被跳过、并以退出码 1 警告——避免"看似成功实则没更新"。

### components.lock.json

`add` 会在项目根维护 `components.lock.json`，记录每个组件安装时的版本与逐文件内容哈希——`diff` 依赖它判断"本地是否改过"。请随项目提交，不要手工编辑。

registry item 自带 `version`（与 `@tu-design/vue` 包版本同步发布）；旧版 registry 数据没有版本号时，`diff` 会退化为两方对比（只能判断相同/不同，无法判断本地是否改过）。

## registry 数据源

registry JSON 由 tu-design 仓库维护（`packages/vue/registry/vue/`），文档站 dev 期以 `/r/vue/*.json` 提供中间件伺服、构建期随静态产物发布。

## MCP Server

CLI 内置 MCP Server（仅查询，不执行安装），供 Claude Code、Cursor 等 AI 编码工具接入：

```bash
npx @tu-design/cli mcp
```

可选 `--registry <url>` 覆盖数据源。

### 接入配置

Claude Code：

```bash
claude mcp add tu-design -- npx -y @tu-design/cli mcp
```

Cursor（`~/.cursor/mcp.json`）与其他 MCP 客户端通用配置：

```json
{
  "mcpServers": {
    "tu-design": {
      "command": "npx",
      "args": ["-y", "@tu-design/cli", "mcp"]
    }
  }
}
```

### 工具列表

| 工具                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| `list_components`   | 列出全部组件（name / title / description）                   |
| `search_components` | 按关键词过滤组件（匹配 name / title / description）          |
| `get_component`     | 返回单个组件完整 registry JSON：内联源码、npm 依赖、依赖组件 |

AI 查询到组件后，在项目根运行 `npx @tu-design/cli add <name>` 完成安装。
