# tu-design

shadcn 风格的 Vue 3 组件库 monorepo —— 基于 Tailwind v4 与 oklch CSS 变量主题，使用 Vite+ 统一工具链。

## 包结构

| 包                | 说明                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `@tu-design/vue`  | 组件库：Avatar / Badge / Button / Card×6 / Input / Label / Separator / Skeleton |
| `@tu-design/cli`  | `tu-design` CLI：`init` 脚手架，向用户项目写入 tokens.css 与组件源码            |
| `@tu-design/docs` | VitePress 文档站（组件 demo + 使用指南）                                        |

## 特性

- **主题系统**：`:root` / `.dark` 中性 `default` 主题，支持 `data-theme` 自定义品牌主题配方（见[主题指南](apps/docs/guide/theming.md)）
- **组件自动导入**：`TuDesignResolver`（unplugin-vue-components），按需引入零样板
- **Registry**：CLI 分发的组件清单 JSON，由 `generate:registry` 生成并做防漂移测试
- **工程化**：Vite+（`vp`）统一 check / test / build，pnpm catalog 统一依赖版本，changesets 管理发版

## 开发

```bash
vp install        # 安装依赖

vp run ready      # 全量体检：vp check + 递归 test + 递归 build
vp test           # 根目录一键测试（分项目运行：vue 41 + cli 79）
```

```bash
cd apps/docs && vp run dev            # 文档站开发服务器（默认端口 5174，路径前缀 /tu-design/）
cd packages/vue && vp run generate:registry   # 重生成 registry JSON
```

### 发版

```bash
vp run version:pkg     # changeset version，消费 .changeset/ 并升版本
vp run publish:pkg     # 发布 @tu-design/* 到 npm
```

## 文档

源码位于 `apps/docs`，本地 `vp run dev` 后访问组件页（`/tu-design/components/<name>.html`）与指南（安装 / 主题 / CLI / 自动导入）。
