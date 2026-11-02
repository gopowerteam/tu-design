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
- 探测包管理器并安装运行时依赖（`clsx` / `tailwind-merge` / `class-variance-authority`）

| 选项               | 说明                                |
| ------------------ | ----------------------------------- |
| `--registry <url>` | registry URL，默认线上 Pages 数据源 |
| `--css <path>`     | 全局 CSS 路径                       |

### `add <components...>`

按名字添加组件源码（支持一次多个），文件写入 `components.json` 声明的位置：

| 选项               | 说明                                     |
| ------------------ | ---------------------------------------- |
| `--registry <url>` | 覆盖 `components.json` 中的 registry URL |
| `--overwrite`      | 覆盖已存在的文件而不询问                 |

## 工作机制

CLI 从 registry 服务拉取每个组件的 **registry JSON**（遵循 [shadcn registry-item schema](https://ui.shadcn.com/schema/registry-item.json)），JSON 中内联了文件内容与写入目标，并声明：

- `registryDependencies` —— 依赖的基础项（如 `utils`、`tokens`），CLI 会先行安装
- `dependencies` —— 需要的 npm 依赖（如 Ark UI、TanStack 包），CLI 检测到后用当前包管理器安装

默认 registry 数据源是文档站 Pages 上发布的 `https://gopowerteam.github.io/tu-design/r/vue`，由 [`@tu-design/vue` 的 `generate:registry`](../vue) 生成并随 Pages 部署更新，可用 `--registry` 指向自建服务。

## 相关

- 组件库：[@tu-design/vue](../vue)
- 文档站：<https://gopowerteam.github.io/tu-design/>（含 CLI 指南）
- 仓库：<https://github.com/gopowerteam/tu-design>
- 许可：MIT
