# 主题

tu-design 的组件样式由 **CSS 变量**（shadcn 风格 tokens）驱动，全部定义在 [`tokens.css`](/guide/cli) 中，基于 oklch 色彩空间。`tu-design init` 会把这份文件写入你的项目，之后它完全归你所有，可自由修改。

系统内置一套**默认主题，名为 `default`**——即 tokens.css 中的中性色。所有主题定制都围绕它展开，见文末的「自定义主题配方」。

## 变量一览

| 变量                                     | 用途                         | 暗色（`.dark`）下的要点                                          |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `--background` / `--foreground`          | 页面底色 / 默认文字          | 明暗互换                                                         |
| `--card` / `--popover`（含 foreground）  | 卡片 / 弹层底色与文字        | 同步加深                                                         |
| `--primary` / `--primary-foreground`     | 主色（按钮、链接强调）       | 取值反转：暗色下主色接近白                                       |
| `--secondary` / `--secondary-foreground` | 次级色块                     | 同步加深                                                         |
| `--muted` / `--muted-foreground`         | 弱化背景 / 弱化文字          | 同步加深                                                         |
| `--accent` / `--accent-foreground`       | 强调背景（hover 等）         | 同步加深                                                         |
| `--destructive`                          | 危险操作                     | 提高亮度，在深底上保持对比                                       |
| `--border` / `--input` / `--ring`        | 边框 / 输入框边框 / 焦点环   | 边框改为半透明白（`oklch(1 0 0 / 10%)`），叠加在深色底上自然变浅 |
| `--radius`                               | 圆角基准（派生 sm/md/lg/xl） | 不随主题变化                                                     |

## Tailwind 映射

`tokens.css` 通过 Tailwind 4 的 `@theme inline` 将变量映射为 utility：

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* … */
}
```

因此组件里可以直接写 `bg-background`、`text-primary-foreground`、`rounded-lg` 等类名——它们全部经由 `var()` 级联取值，**修改变量即改变组件外观，组件类名无需任何改动**。

## 圆角体系

`--radius` 是唯一的圆角来源，sm/md/lg/xl 全部由它派生：

```css
:root {
  --radius: 0.625rem;
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

想整体调圆或调方（更锐利的工具型界面、更圆润的消费级界面），改这一个变量即可。

## 暗色模式

### class 策略

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

::: tip
本站右上角的明暗切换按钮正是这套机制——切换后注意观察各组件[演示](/components/button)的颜色变化。
:::

### 防闪烁（FOUC）

SPA 在 JS 挂载前 `<html>` 始终是亮色，若用户偏好暗色，首帧会闪白。在 `index.html` 的 `<head>` 里加一段内联脚本，先于任何渲染恢复 class：

```html
<script>
  (function () {
    var saved = localStorage.getItem("theme");
    var dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  })();
</script>
```

### 与 VueUse 集成

VueUse 的 `useDark` 默认就把 `.dark` 挂在 `<html>` 上，与 tokens.css 的 class 策略开箱匹配。用 `storageKey` 对齐上面内联脚本的存储键：

```ts
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark({ storageKey: "theme" });
const toggleDark = useToggle(isDark);
```

## 品牌色覆盖

临时调整一两个变量时直接覆盖即可，无需成套主题。

全局覆盖——写在 tokens.css **之后**（见下文源顺序说明）：

```css
:root {
  --primary: oklch(0.55 0.18 260); /* 换成你的品牌色 */
}
```

CSS 变量沿 DOM 级联，把覆盖写到任意容器上即得到**作用域主题**，只影响该子树：

```html
<aside style="--primary: oklch(0.55 0.18 260)">
  <button>此区域内的主色按钮</button>
</aside>
```

::: tip
「临时改一两个变量」适合微调。想要命名、可复用、可切换的完整主题，用下面的配方。
:::

## 自定义主题配方：data-theme

### 命名约定

- 默认主题名为 **`default`**：`data-theme` 缺省、或显式设为 `"default"` 时生效。属性选择器不匹配任何规则，自然回落到 tokens.css 的基础值——**无需为 default 写任何 CSS**。
- 自定义主题用品牌色名，全小写 kebab-case：`violet`、`blue`、`forest`…

### 配方模板（以 violet 为例）

只需覆盖 5 个色相相关变量（`--background`、`--border` 等保持默认），即得到「品牌强调色主题」。关键在暗色变体使用**双选择器**，同时覆盖「`<html>` 同元素」与「子树」两种挂载场景：

```css
/* 亮色 */
[data-theme="violet"] {
  --primary: oklch(0.541 0.281 293.009); /* violet-600 */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.606 0.25 292.717); /* violet-500 */
  --accent: oklch(0.943 0.029 294.588); /* violet-100 */
  --accent-foreground: oklch(0.38 0.189 303.427); /* violet-900 */
}

/* 暗色 */
[data-theme="violet"].dark,
.dark [data-theme="violet"] {
  --primary: oklch(0.606 0.25 292.717); /* violet-500 */
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.541 0.281 293.009); /* violet-600 */
  --accent: oklch(0.283 0.141 291.089); /* violet-950 */
  --accent-foreground: oklch(0.969 0.016 293.756); /* violet-50 */
}
```

::: warning 源顺序很重要
`[data-theme="violet"]` 与 `:root`、`.dark` 特异性相同（0,1,0），胜负由源顺序决定——这段规则必须出现在 tokens.css **之后**：写在你自己的 CSS 文件里（在 tokens.css 之后引入），或直接追加到 tokens.css 末尾。贴错位置会**静默失效**。
:::

### 使用方式

```html
<!-- 全局：<html> 上挂主题 -->
<html lang="zh-CN" data-theme="violet">
  …
</html>

<!-- 局部：任意子树，主题只作用于该容器 -->
<div data-theme="violet">
  <button>紫色的按钮</button>
</div>
```

与暗色模式**正交**：`data-theme` 管品牌色相，`.dark` 管明暗，任意组合开箱即用。

### 切换与恢复

```js
const html = document.documentElement;
html.dataset.theme = "violet"; // 切到 violet
html.dataset.theme = "default"; // 显式回默认主题
delete html.dataset.theme; // 或直接移除属性（等价）
```

### 已知边界：嵌套恢复

在已设主题的子树**内部**再挂 `data-theme="default"` 不会重置回默认——内层不匹配任何规则，变量会继承外层的 violet 值。如确需「主题内恢复默认」，要写一个显式重置块（把默认值再抄一遍）。绝大多数应用只在 `<html>` 层切换主题，不会遇到此问题。
