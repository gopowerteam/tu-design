# 主题

tu-design 的组件样式由 **CSS 变量**（shadcn 风格 tokens）驱动，全部定义在 [`tokens.css`](/guide/cli) 中，基于 oklch 色彩空间。`tu-design init` 会把这份文件写入你的项目，之后它完全归你所有，可自由修改。

系统内置一套**默认主题，名为 `default`**——即 tokens.css 中的中性色。所有主题定制都围绕它展开，见文末的「自定义主题配方」。

tokens.css 提供三层定制入口，按介入深度排列：

1. **变量覆盖**——直接改写语义 token（如 `--primary`），适合临时微调；
2. **应用主题桥接**——定义一组 `--app-*` 变量，整套组件跟随你的应用主题系统（推荐）；
3. **data-theme 配方**——命名的可切换主题，支持全局与子树两种挂载方式。

## 变量一览

### 基础语义色

| 变量                                     | 用途                       | 暗色（`.dark`）下的要点                                                |
| ---------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `--background` / `--foreground`          | 页面底色 / 默认文字        | 明暗互换                                                               |
| `--card` / `--popover`（含 foreground）  | 卡片 / 弹层底色与文字      | 同步加深（popover 略浅于 card，制造层次）                              |
| `--primary` / `--primary-foreground`     | 主色（按钮、链接强调）     | 取值反转：暗色下主色接近白                                             |
| `--secondary` / `--secondary-foreground` | 次级色块                   | 同步加深                                                               |
| `--muted` / `--muted-foreground`         | 弱化背景 / 弱化文字        | 同步加深                                                               |
| `--accent` / `--accent-foreground`       | 强调背景（hover 等）       | 同步加深                                                               |
| `--border` / `--input` / `--ring`        | 边框 / 输入框边框 / 焦点环 | 边框改为半透明白：`--border` 为 `oklch(1 0 0 / 10%)`，`--input` 为 15% |

### 状态色三件套

`--destructive` / `--success` / `--warning` / `--info` 四组同构，每组三件：

| 变量（以 success 为例） | 用途                   | 回落行为                                                       |
| ----------------------- | ---------------------- | -------------------------------------------------------------- |
| `--success`             | 实色（图标、进度条等） | 官方 oklch 兜底；暗色下提高亮度保持对比                        |
| `--success-soft`        | 浅底（Alert 底色等）   | 未定义时 `color-mix(in oklab, 实色 10%, transparent)` 自动派生 |
| `--success-foreground`  | 实色上的前景文字       | 默认白；**warning 在暗色下兜底为深色**（实色变亮后保证对比）   |

`-soft` 的派生比例：destructive / success 为 10%，warning / info 为 12%。

### 圆角与层级

| 变量              | 用途                                   |
| ----------------- | -------------------------------------- |
| `--radius`        | 圆角基准，sm/md/lg/xl/2xl 全部由它派生 |
| `--z-sticky`      | 表体 sticky 列层级（10）               |
| `--z-sticky-head` | 表头 sticky 层级（30）                 |
| `--z-overlay`     | 浮层/弹窗统一层级（50）                |

## Tailwind 映射

`tokens.css` 通过 Tailwind 4 的 `@theme inline` 将变量映射为 utility：

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  /* … 其余语义色与状态色一一映射 */
}
```

因此组件里可以直接写 `bg-background`、`text-primary-foreground`、`bg-success-soft` 等类名——它们全部经由 `var()` 级联取值，**修改 token 即改变组件外观，组件类名无需任何改动**。

此外文件开头引入了 `tw-animate-css` 提供动画 utility；`@layer base` 中把裸 `border` 类的全局边框色接到 `--border` token（对齐 shadcn v4 官方 tokens，`border` 不再回退 `currentColor`）。

## 圆角体系

`--radius` 是唯一的圆角来源，sm/md/lg/xl/2xl 全部由它派生：

```css
:root {
  --radius: 0.625rem;
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 6px);
}
```

想整体调圆或调方（更锐利的工具型界面、更圆润的消费级界面），改这一个变量即可。

## z-index 层叠体系

所有层级由三个 token 统一管理，约定层叠序从低到高：

```
表体 sticky 列 (--z-sticky: 10)
  < 表头普通列 sticky (z-20，TableRender theadThClass 提供)
  < 表头 sticky (--z-sticky-head: 30，表头 fixed 列经 stickyStyle inline style 消费)
  < 浮层/弹窗 (--z-overlay: 50)
```

Dialog、Popover、Select、DropdownMenu、Tooltip、日期弹层等全部浮层组件的 Positioner 统一消费 `z-[var(--z-overlay)]`；同级浮层按 DOM 挂载次序叠放。需要单独调高某个浮层时，Popover 等组件提供 `zIndex` prop 覆盖默认值。

自定义页面内的 sticky 元素时请复用这三个变量并保持间隔，避免与组件浮层冲突。

## 状态色的消费方式

组件内置消费已接通状态色三件套，使用语义 variant 即可，无需手动拼色：

- **Alert**：`variant="success" | "warning" | "info" | "error"` → `bg-*-soft` 浅底 + 边框用实色 35% `color-mix` 派生（强度感与浅底解耦）+ 图标 `text-*` 实色；
- **Toast**：`type="success" | "warning" | "info" | "error"` → `bg-* text-*-foreground` 实色样式；
- **Progress**：`variant="success" | "warning" | "info" | "error"` → `bg-*` 进度条实色。

自定义组件时遵循同一约定：浅底用 `-soft`，实色主体用实色 token，实色上的文字用 `-foreground`。

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

`.dark` 块内**每个桥接 token 都会重声明**（含全部 `-soft`）：自定义属性按声明处求值后继承，不在 `.dark` 内重声明就无法响应暗色下的实色变化。应用侧自定义 `-soft` 时同理，见下文桥接契约。

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

## 应用主题桥接：`--app-*`

tokens.css 中每个语义 token 都以 `var(--app-*, 官方兜底)` 的形式声明：**优先消费应用级 `--app-*` CSS 变量，未定义时回落官方 oklch 值**。没有主题系统的项目观感与默认主题完全一致（零成本）；有主题系统的项目只需暴露一组 `--app-*` 变量，整套组件即跟随应用换肤。

### 桥接契约

| 应用侧变量                                                             | 桥接到                             | 说明                                         |
| ---------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| `--app-bg-page`                                                        | `--background`                     | 页面底色                                     |
| `--app-bg-surface`                                                     | `--muted`                          | 弱化背景                                     |
| `--app-bg-raised`                                                      | `--card`、`--popover`              | 浮起表面                                     |
| `--app-bg-hover`                                                       | `--accent`                         | hover 等强调背景                             |
| `--app-text-1`                                                         | `--foreground` 及各 `*-foreground` | 主文字                                       |
| `--app-text-2`                                                         | `--muted-foreground`               | 弱化文字                                     |
| `--app-text-3`                                                         | （上游零消费）                     | 供应用侧直接使用的三级文字                   |
| `--app-accent`                                                         | `--primary`、`--ring`              | 品牌强调色                                   |
| `--app-accent-contrast`                                                | `--primary-foreground`             | 强调色上的文字                               |
| `--app-border`                                                         | `--border`、`--input`              | 边框；暗色建议低不透明度值（如 `#FFFFFF1A`） |
| `--app-destructive` / `--app-success` / `--app-warning` / `--app-info` | 对应状态实色                       | 见「状态色三件套」                           |
| `--app-*-soft`                                                         | `--*-soft`                         | 浅底；未定义时回落 `color-mix` 自动派生      |
| `--app-*-foreground`                                                   | `--*-foreground`                   | 实色上的前景                                 |

设计决策（与上游 shadcn 的差异边界）：

- **`--secondary` / `--secondary-foreground` 有意不桥接**——上游定位即中性灰，无品牌语义；
- **`-soft` 自动派生**：只定义实色（如 `--app-success`）即可，浅底自动回落为 `color-mix` 派生；
- **`.dark` 内重声明 `-soft`**：应用侧自定义 `-soft` 时必须在 `.dark` 内再写一遍，否则无法响应暗色实色变化。

### 接入示例

在项目全局 CSS 中定义一组 `--app-*` 变量（亮暗各一份），即完成整体换肤：

```css
:root {
  --app-bg-page: oklch(0.98 0.01 260);
  --app-text-1: oklch(0.2 0.02 260);
  --app-accent: oklch(0.55 0.18 260); /* 品牌色：--primary 与 --ring 同时生效 */
  --app-accent-contrast: oklch(0.985 0 0);
  --app-border: oklch(0.9 0.01 260);
}

.dark {
  --app-bg-page: oklch(0.16 0.01 260);
  --app-text-1: oklch(0.95 0.01 260);
  --app-accent: oklch(0.65 0.18 260);
  --app-accent-contrast: oklch(0.15 0.02 260);
  --app-border: #ffffff1a; /* 暗色建议低不透明度边框 */
}
```

## 品牌色覆盖

临时调整一两个变量时直接覆盖即可，无需成套主题。全局覆盖写在 tokens.css **之后**（源顺序说明见 data-theme 配方）：

```css
:root {
  --primary: oklch(0.55 0.18 260); /* 换成你的品牌色 */
}
```

::: warning 与桥接层的关系
直接覆盖 `--primary` 会**切断它与 `--app-accent` 的桥接**（变量被重定义后不再读取应用变量），且不会同步影响 `--ring`。如果你的项目接入了上文的 `--app-*` 桥接层，优先改 `--app-accent`——一处定义同时驱动 `--primary` 与 `--ring`。
:::

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

::: tip 与 `--app-*` 桥接的关系
data-theme 配方直接重定义 `--primary`、`--ring` 等 token 本身，优先于 `--app-*` 桥接取值。两者可并存：桥接负责全局基调（跟随应用主题系统），data-theme 负责命名主题的局部切换。
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
