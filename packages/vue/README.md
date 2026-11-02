# @tu-design/vue

shadcn 风格的 Vue 3 组件库 —— Tailwind CSS v4 + oklch CSS 变量主题，基于 [Ark UI](https://ark-ui.com) 原语，组件源码通过 [`tu-design` CLI](../cli) 按 registry 分发到你的项目中。

- 文档站：<https://gopowerteam.github.io/tu-design/>
- 组件清单与用法示例见文档站 Components 章节，本 README 只覆盖接入方式。

## 分发模式

和 shadcn/ui 一样，**推荐用法不是安装本包**，而是把组件源码复制进你的项目：

```bash
npx tu-design init          # 初始化 components.json / tokens / cn 工具
npx tu-design add button    # 添加组件源码到 src/components/ui/button/
```

源码进入你的项目后归你所有，可以直接修改；组件依赖的运行时只有 `clsx`、`tailwind-merge`、`class-variance-authority`（及组件自身声明的 Ark UI / TanStack 等 npm 依赖）。

作为 npm 包安装时，本包导出：

- `TuDesignResolver` — unplugin-vue 组件自动导入解析器
- `cn` — clsx + tailwind-merge 封装
- 全部组件（`TButton`、`TTabs`……）供直接 import 使用

## 前置要求

- Vue 3.5+
- Tailwind CSS 4（含 `@tailwindcss/vite` 插件）
- 构建工具中将 `@` 别名指向 `src`（registry 源码以 `@/lib/utils` 导入 `cn`）

## 主题

`src/styles/tokens.css` 定义 shadcn 风格的 CSS 变量（oklch）并通过 Tailwind v4 `@theme inline` 映射为工具类：

- `:root` / `.dark` 提供默认亮/暗主题
- 支持 `data-theme` 自定义品牌主题配方（详见文档站主题指南）

`tokens.css` 依赖 `tw-animate-css`，需一并安装。CLI 的 `init` / `add tokens` 会自动合并注入。

## 自动导入

配合 [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)：

```bash
pnpm add -D unplugin-vue-components
```

```ts
// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { TuDesignResolver } from "@tu-design/vue";

export default {
  plugins: [Components({ resolvers: [TuDesignResolver()] })],
};
```

模板中可直接使用 `TButton` / `t-button`（`T` 前缀 + 组件名）。解析器按组件名白名单工作，`Transition`、`Teleport` 等 Vue 内置组件不会被误解析。

## Registry

`registry/vue/*.json` 是 CLI 分发的数据源（遵循 shadcn registry-item schema），由 `scripts/generate-registry.ts` 从组件源码生成并有防漂移测试保护。线上地址为 `https://gopowerteam.github.io/tu-design/r/vue`。

```bash
vp run generate:registry    # 改动组件源码 / utils / tokens 后重新生成
vp test                     # 运行组件测试
vp run typecheck            # vue-tsc 类型检查
```

## 相关

- [`@tu-design/cli`](../cli) — registry 分发 CLI
- 仓库：<https://github.com/gopowerteam/tu-design>
- 许可：MIT
