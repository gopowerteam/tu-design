# 安装

## 前置要求

- Vue 3.5+
- [Tailwind CSS 4](https://tailwindcss.com)（含 `@tailwindcss/vite` 插件）

## 1. 一键初始化（推荐）

```bash
npx @tu-design/cli init
```

`init` 自动完成：

- 写入 `components.json`，记录 registry 数据源等配置
- 生成 `src/lib/utils.ts` 的 `cn` 工具（clsx + tailwind-merge 封装）
- 将 [tokens.css](https://github.com/gopowerteam/tu-design/blob/master/packages/vue/src/styles/tokens.css) 内容合并进你的全局 CSS（已包含则自动跳过）
- 写入 `AGENTS.md` AI 协作规则（`--no-agents` 可跳过）
- 安装运行时依赖：`clsx`、`tailwind-merge`、`class-variance-authority`、`tw-animate-css`

常用选项：`--registry <url>` 覆盖数据源；`--css <path>` 指定全局 CSS 路径（默认自动探测常见位置）。

## 2. 配置路径别名

registry 中的组件源码使用 `@/lib/utils` 导入 `cn` 工具，需要在你的构建工具中配置 `@` 指向 `src`：

```ts
// vite.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

同时确保 `tsconfig.json` 中有对应的 paths：

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## 3. 添加组件

```bash
npx @tu-design/cli add button
```

组件将写入 `src/components/ui/button/`。接下来可以在[组件](/components/button)页查看每个组件的用法。

::: details 未使用 init？手动配置
**引入主题变量**：将 [tokens.css](https://github.com/gopowerteam/tu-design/blob/master/packages/vue/src/styles/tokens.css)（shadcn 风格 CSS 变量 + Tailwind `@theme inline` 映射）加入你的全局样式：

```css
/* src/style.css */
@import "tailwindcss";
@import "./tokens.css";
```

`tokens.css` 依赖 `tw-animate-css`，一并安装：

```bash
pnpm add tailwindcss @tailwindcss/vite tw-animate-css class-variance-authority clsx tailwind-merge
```

**`cn` 工具**：组件源码通过 `@/lib/utils` 导入 `cn`（clsx + tailwind-merge 封装），确保 `src/lib/utils.ts` 存在：

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

也可以只补基础依赖而跳过其余初始化：`npx @tu-design/cli add utils tokens`。
:::
