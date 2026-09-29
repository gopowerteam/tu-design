# 主题

tu-design 的组件样式由 **CSS 变量**（shadcn 风格 tokens）驱动，全部定义在 [`tokens.css`](/guide/cli) 中，基于 oklch 色彩空间。

## 变量一览

| 变量                                     | 用途                         |
| ---------------------------------------- | ---------------------------- |
| `--background` / `--foreground`          | 页面底色 / 默认文字          |
| `--primary` / `--primary-foreground`     | 主色（按钮、链接强调）       |
| `--secondary` / `--secondary-foreground` | 次级色块                     |
| `--muted` / `--muted-foreground`         | 弱化背景 / 弱化文字          |
| `--accent` / `--accent-foreground`       | 强调背景（hover 等）         |
| `--destructive`                          | 危险操作                     |
| `--border` / `--input` / `--ring`        | 边框 / 输入框边框 / 焦点环   |
| `--radius`                               | 圆角基准（派生 sm/md/lg/xl） |

## Tailwind 映射

`tokens.css` 通过 Tailwind 4 的 `@theme inline` 将变量映射为 utility：

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* … */
}
```

因此组件里可以直接写 `bg-background`、`text-primary-foreground`、`rounded-lg` 等类名。

## 暗色模式

tokens 以 **class 策略**切换：`<html>` 挂上 `.dark` 即翻转全部变量：

```css
:root {
  --background: oklch(1 0 0); /* … */
}
.dark {
  --background: oklch(0.145 0 0); /* … */
}
```

配合 Tailwind 的自定义变体：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

切换示例（手动控制）：

```js
document.documentElement.classList.toggle("dark");
```

::: tip
本站右上角的明暗切换按钮正是这套机制——切换后注意观察各组件[演示](/components/button)的颜色变化。
:::

## 自定义品牌色

修改 `:root` 与 `.dark` 中的 `--primary` 等变量即可，无需改动组件源码：

```css
:root {
  --primary: oklch(0.55 0.18 260); /* 换成你的品牌色 */
}
```
