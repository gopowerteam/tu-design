# 安装

## 前置要求

- Vue 3.5+
- [Tailwind CSS 4](https://tailwindcss.com)（含 `@tailwindcss/vite` 插件）

## 1. 配置路径别名

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

## 2. 引入主题变量

将 [tokens.css](https://github.com/gopowerteam/tu-design/blob/master/packages/vue/src/styles/tokens.css)（shadcn 风格 CSS 变量 + Tailwind `@theme inline` 映射）加入你的全局样式：

```css
/* src/style.css */
@import "tailwindcss";
@import "./tokens.css";
```

`tokens.css` 依赖 `tw-animate-css`，一并安装：

```bash
pnpm add tailwindcss @tailwindcss/vite tw-animate-css class-variance-authority clsx tailwind-merge
```

## 3. `cn` 工具

组件源码通过 `@/lib/utils` 导入 `cn`（clsx + tailwind-merge 封装），确保 `src/lib/utils.ts` 存在：

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

::: tip
通过 CLI 添加 [`utils`](/guide/cli) 会自动生成该文件；添加 [`tokens`](/guide/cli) 会生成 `tokens.css`。
:::

## 4. 添加组件

```bash
npx tu-design add button
```

组件将写入 `src/components/ui/button/`。接下来可以在[组件](/components/button)页查看每个组件的用法。
