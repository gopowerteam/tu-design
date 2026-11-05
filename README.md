# tu-design

shadcn 风格的 Vue 3 组件库 monorepo —— 基于 Tailwind v4 与 oklch CSS 变量主题，使用 Vite+ 统一工具链。

## 包结构

| 包                       | 说明                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `@tu-design/vue`         | 组件库：45 个组件（基础输入 / 日期时间 / 下拉选择 / 反馈提示 / 数据展示 / 布局）    |
| `@tu-design/cli`         | `tu-design` CLI：`init` / `add` / `diff` / `mcp`，registry 分发 + lockfile 更新链路 |
| `@tu-design/docs`        | VitePress 文档站（组件 demo + 使用指南）                                            |
| `@tu-design/config-lint` | ESLint 共享配置（私有包，不入 registry）                                            |
| `apps/playground`        | component-update 端到端回归：真实 CLI 产物 + mock registry 验证组件更新链路         |

## 特性

- **主题系统**：`:root` / `.dark` 中性 `default` 主题，支持 `data-theme` 自定义品牌主题配方（见[主题指南](apps/docs/guide/theming.md)）
- **组件自动导入**：`TuDesignResolver`（unplugin-vue-components），按需引入零样板
- **Registry**：CLI 分发的组件清单 JSON，由 `generate:registry` 生成并做防漂移测试；CLI init 的注入源码（tokens.css / cn 工具模板）同样由 cli 包 `generate:sources` 从组件库源码生成
- **组件更新链路**：`add` 安装时写入 `components.lock.json` 记录版本，`diff` 比对本地与线上（最新 / 可更新 / 本地已改 / 冲突 / 缺失），配合 `add --overwrite` / `--all` 完成升级
- **工程化**：Vite+（`vp`）统一 check / test / build，pnpm catalog 统一依赖版本

## 开发

```bash
vp install        # 安装依赖

vp run ready      # 全量体检：vp check + 递归 test + 递归 build
vp test           # 根目录一键测试（分项目运行：vue 组件测试 + cli 全量测试）
```

```bash
cd apps/docs && vp run dev            # 文档站开发服务器（默认端口 5174，路径前缀 /tu-design/）
cd packages/vue && vp run generate:registry   # 重生成 registry JSON
bash apps/playground/component-update/run-tests.sh   # 组件更新链路端到端回归（需先构建 CLI）
```

## 文档

源码位于 `apps/docs`，本地 `vp run dev` 后访问组件页（`/tu-design/components/<name>.html`）与指南（安装 / 主题 / CLI / 自动导入 / 微前端）。
