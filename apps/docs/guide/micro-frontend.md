# 微前端与沙箱环境

tu-design 的浮层组件在 **wujie 微前端**、**Shadow DOM 沙箱**（如 micro-app `strictStyleIsolation`、web component 沙箱）等环境下会**自动适配**，无需任何配置。本文沉淀这套适配的通用机制——由组件库的 `overlay-shared` 公共层统一实现，对所有浮层组件行为一致；各组件文档只保留组件特有的 props（如 `to`、`positioning` 透传），不再重复展开（下文以 Popover 举例之处均为通用机制）。需要更准、更可控的显式声明时，可用 [`TuDesignProvider mode`](/components/provider) 覆盖自动探测（见文末专节）。

## 适用范围

适配随浮层组件自动启用，按组件形态分两档：

| 形态       | 组件                                                                                                                                        | 适配内容                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 定位型浮层 | Popover、Tooltip、Select、DropdownMenu、ContextMenu、Cascader、TreeSelect、DatePicker、DateRangePicker、MonthPicker、WeekPicker、YearPicker | ids 无冒号覆盖 + Teleport 目标降级 + 定位策略（坐标空间）修正     |
| 模态型浮层 | Dialog、Drawer、AlertDialog                                                                                                                 | ids 无冒号覆盖 + 模态滚动锁降级（面板居中渲染，无需定位策略两项） |

微前端沙箱中浮层组件面临的核心问题是两类：**面板归属**（Teleport 目标）与**定位坐标空间**（定位策略）；wujie 沙箱还有 ids 特殊字符引发的告警刷屏问题，三者分别对应下文的适配机制。模态型浮层另有一类 graft 坐标系专属问题——**滚动锁误补偿**，见文末专节。

## ids 无冒号覆盖

底层定位引擎的缺省 id 惯例形如 `popover:{scope.id}:title`（含冒号）。wujie 沙箱把 `document.getElementById` patch 成 `querySelector('[id="…"]')` miss 后兜底 `querySelector('#' + id)`——**冒号未转义**，直接抛 `SyntaxError`，并被 catch 后打出 `[wujie warn] 不支持document.getElementById()传入特殊字符…`，打开浮层期间反复刷屏。

浮层组件的内部 ids 统一改由 Vue `useId()` 派生（`v-0` 格式，无冒号）：未命中也是合法选择器，静默返回 null，告警消除。原生环境 `getElementById` 不解析选择器，行为零变化。显式传入 `ids`（经 attrs 透传）时以用户为准。

## Teleport 目标降级

浮层面板默认 Teleport 到 `body`——在沙箱应用里这会把面板传送出子应用容器，Tailwind 样式与 `--popover` 等主题变量的继承链断裂。组件经**双信号探测**命中任一即自动降级为传送**应用挂载容器**（`app._container`）：

- **真 shadow DOM**（如 micro-app `strictStyleIsolation`、web component 沙箱）：结构探测命中——容器 `getRootNode()` 返回 `ShadowRoot`；
- **wujie**：wujie 会 patch iframe realm 的 `Node.prototype.getRootNode`（真实 root 为 shadowRoot 时返回 iframe document），结构探测失效，故叠加官方标记 `window.__POWERED_BY_WUJIE__`（wujie 在子应用代码执行前注入，时序可靠）；
- **非 shadow 环境行为不变**，仍是 `body`，零破坏（qiankun / micro-app light DOM 为同文档渲染，`body` 即主文档 `body`，兜底正确）；
- **显式 `to` 优先级最高**，可手动指定任意目标（建议指向无 `overflow` 裁剪的子应用根容器，否则大面板可能被裁剪）。

## 定位策略（坐标空间）

wujie 把子应用文档树 graft 进 shadowRoot 渲染：**graft 树的 CSS 包含块原点是容器在主页面中的位置**，而定位引擎默认 `strategy: "absolute"` 按**视口空间**产出坐标——两者相差一个容器偏移（实测偏移值恰为容器位置），面板整体错位。

修正信号为框架无关的 `window.self !== window.top`（组件 JS 运行在 iframe realm）：

- iframe realm 下默认改用 `strategy: "fixed"`——fixed 以视口为包含块，与定位引擎的坐标空间一致（wujie graft 树下是唯一正确解）；
- 非 graft 拓扑下 fixed 与 absolute 坐标等价（包含块同为最近视口），该默认值零副作用；跨域 iframe 下 `self`/`top` 仅做引用比较，不读属性，无 `SecurityError`；
- 显式传入 `positioning.strategy` 时以其为准（经 attrs 透传，如 `:positioning="{ strategy: 'absolute' }"`）。

## 模态滚动锁

模态组件打开时默认锁定页面滚动，并按「视口宽 − 文档宽」补偿消失的滚动条宽度（继承 Ark UI `preventScroll`，防主文档滚动条消失引起布局跳动）。wujie graft 拓扑下该公式的两个测量值**分属不同坐标系**——`window.innerWidth` 是沙箱 iframe 报告的**宿主视口宽**，`documentElement.clientWidth` 是 graft 进 shadowRoot 渲染的**子应用容器宽**——差值（宿主侧边栏/留白宽度，实测可达 130px）被误当滚动条宽写入渲染 `body` 的 `padding-right`：弹窗一开整页内容盒凭空压缩、表格列宽全体重排，关闭又弹回（[issue #4](https://github.com/gopowerteam/tu-design/issues/4)）。

适配策略：**wujie graft 下自动禁用滚动锁**，其余场景（独立运行、qiankun、iframe 嵌入等）保持 Ark 缺省行为不变。依据有二：

- wujie 主流拓扑下子应用 `body` 本就不滚动（滚动容器在宿主侧），锁不产生任何既有收益——宿主背景在修复前后都从来没被锁住过；
- 即便子应用 body 可滚，误补偿的破坏也大于锁的收益，带 bug 的锁不如不要。

策略集中在 `overlay-shared/useSandboxOverlay.ts` 的 `overlayPreventScroll()` 单点实现，Dialog / Drawer / AlertDialog 三处共享；返回值仅 wujie 下为 `false`，其余为 `undefined`（不覆盖 Ark 的 `preventScroll = modal` 派生默认，attrs 透传 `:modal="false"` 的用法不受影响）。

## 手动声明运行环境（TuDesignProvider）

自动探测的固有边界：marker 随 wujie 版本演进可能改名（届时降级**静默失效**）、degrade 模式与默认模式不可区分、非 iframe 的 graft 型沙箱不在信号覆盖内。对这几类场景，库提供显式声明层——在子应用根部挂载 [`<TuDesignProvider mode="...">`](/components/provider)，直接告知渲染拓扑：

- 解析优先级：**组件显式 prop（`to` / `positioning.strategy` 等）> Provider `mode` > 自动探测**；
- `mode` 取值按「隔离构成」而非框架品牌：`none`（无特殊拓扑）/ `shadow`（仅 shadow 边界）/ `shadow-iframe`（shadow 边界 + 独立 iframe realm，即 wujie 默认形态），缺省 `auto` 走探测；
- 显式声明时**不执行任何探测代码**——marker 漂移、结构伪装都不再影响声明值；
- `mode="none"` 同样覆盖 wujie degrade 模式的正确声明（degrade 下 iframe 自成一体，各适配皆无收益，见「已知边界」对应条目）。

不配置 = 行为与历史版本完全一致；何时值得配置见组件文档的框架映射速查表。

## 模态滚动锁跨沙箱契约

### 背景：假锁 → 无锁 → 语义空缺

wujie 拓扑下模态滚动锁的演进经历了三个阶段：

1. **假锁**（[issue #4](https://github.com/gopowerteam/tu-design/issues/4)）：Ark 的滚动条宽补偿公式在 graft 拓扑下混用两个坐标系，把宿主侧边栏宽度误写进子应用 `padding-right`，弹窗一开整页内容盒被压缩；
2. **无锁**（v0.5.11 止血）：wujie 拓扑下自动禁用滚动锁（见上文「模态滚动锁」一节），误补偿消除——代价是弹窗打开时宿主背景自由滚动，模态核心语义缺失，这是止血的既定代价；
3. **语义空缺**（[issue #5](https://github.com/gopowerteam/tu-design/issues/5)）：补齐空缺无法由组件库单方完成——Zag 的 `preventScroll` 仅 boolean、无自定义锁注入点，而真滚动容器在宿主侧。故立跨沙箱契约：**组件库对称驱动、glue 转发计数、宿主施加真锁**。

### 契约签名与生效语义（语义 B）

契约经 [`TuDesignProvider :overlay`](/components/provider) 注入，RAII 风格——`lock()` 返回释放函数，关闭/卸载时由库调用且仅一次：

```ts
interface TuOverlayContract {
  /** 模态打开时调用；返回释放函数，关闭/卸载时调用且仅调用一次 */
  lock(): VoidFunction;
}
```

**仅当 `mode` 解析为锁禁用拓扑时消费**（`shadow-iframe` / `auto` 探测命中 wujie）；其余拓扑下注入被忽略，开发环境 `console.warn` 一次，行为与不注入完全一致（与 v0.5.11 逐位相同）。行为矩阵：

| mode                              | 注入 `:overlay` | 行为                                 |
| --------------------------------- | --------------- | ------------------------------------ |
| `shadow-iframe`                   | 有              | 内置锁让位，注入契约驱动加锁 / 释放  |
| `shadow-iframe`                   | 无              | 无锁（v0.5.11 现状）                 |
| `auto` 探测命中 wujie             | 有              | 同 `shadow-iframe` 注入              |
| `auto` 探测命中 wujie             | 无              | 无锁（现状）                         |
| `none` / `shadow` / `auto` 未命中 | 有              | 注入忽略 + dev warn 一次；Ark 原生锁 |
| `none` / `shadow` / `auto` 未命中 | 无              | Ark 原生锁（现状）                   |

### 三方职责

| 方               | 职责                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 组件库           | 对称驱动：打开调 `lock()`，关闭/卸载调释放函数且仅一次（开着即卸载补调）；`:modal="false"` 非模态不强加锁                       |
| glue（子应用侧） | 经 `window.$wujie.bus` 事件 `overlay:lock` / `overlay:unlock`（携带 app id）转发，按应用引用计数，deactivated/销毁时 flush 清零 |
| 宿主             | 收到事件后对**真滚动容器**施加真滚动锁，unlock 时释放                                                                           |

### glue 接入示例（子应用侧）

```ts
// glue.ts —— 运行在 wujie 子应用内
const APP_ID = "sub-app-a"; // 与宿主约定的应用唯一标识
const bus = window.$wujie!.bus;

let count = 0;

export const overlay = {
  lock(): VoidFunction {
    count += 1;
    if (count === 1) bus.$emit("overlay:lock", APP_ID);
    return () => {
      count -= 1;
      if (count === 0) bus.$emit("overlay:unlock", APP_ID);
    };
  },
};

// deactivated/销毁时 flush 清零：防止子应用带着未关闭的模态被卸载后宿主锁残留
export function flushOverlayLocks() {
  if (count > 0) {
    bus.$emit("overlay:unlock", APP_ID);
    count = 0;
  }
}

// 挂进 wujie 卸载生命周期（alive 模式 deactivate 与销毁均会调用）
window.__WUJIE_UNMOUNT = () => {
  flushOverlayLocks();
  // …原有卸载逻辑
};
```

```vue
<!-- 子应用根组件 -->
<TuDesignProvider mode="shadow-iframe" :overlay="overlay">
  <RouterView />
</TuDesignProvider>
```

引用计数保证多个模态同开时宿主只加一次锁、全部关闭后才释放；RAII 释放函数由库保证恰好调用一次，glue 计数不会因重复释放而失衡。

### 宿主接入示例

```ts
// 宿主侧：监听 bus 事件，对真滚动容器施加真锁
import { bus } from "wujie";
import { preventBodyScroll } from "@zag-js/remove-scroll";

const releases = new Map<string, VoidFunction>();

bus.$on("overlay:lock", (appId: string) => {
  if (releases.has(appId)) return; // 幂等：同一应用重复事件不重复加锁
  releases.set(appId, preventBodyScroll(document));
});

bus.$on("overlay:unlock", (appId: string) => {
  releases.get(appId)?.();
  releases.delete(appId);
});
```

`@zag-js/remove-scroll` 只是本库的**传递依赖**——宿主无该直接依赖时可内联等价实现：对真滚动容器设 `overflow: hidden` + 滚动条宽度补偿（防布局跳动）+ iOS 用 `position: fixed` 并在释放时还原 `scrollTop`。宿主真滚动容器若不是 `document.body` 而是自定义容器，把同样的锁逻辑施加到该容器即可。

### overscroll-behavior:contain 不是锁

契约接入之前（或不接契约时），集成方可自行在模态 Backdrop 上叠加 `overscroll-behavior: contain`，作为**契约生效前的轻量观感改善建议**——拦截部分触摸手势滚动链。明示：**这不是锁**，以下路径全部残留：

- 键盘滚动（焦点链绕过 Backdrop——Backdrop 与 Positioner 是兄弟节点）；
- programmatic scroll（`scrollTo` 等）；
- 桌面滚动条条带拖拽；
- iOS < 16 不支持该属性。

它达不到「宿主背景滚动无效」的验收，故不进库的缺省实现；真锁请走上面的契约。

### 移动端真机验收

契约在移动端的效果须真机验收：iOS Safari 的橡皮筋滚动、`position: fixed` 锁的 `scrollTop` 还原、触摸手势滚动链均与桌面模拟不同。建议至少覆盖：弹窗打开时背景不滚、关闭后滚动位置还原、多模态快速开关无锁残留、子应用 deactivate/销毁后无锁残留。

## rAF 时钟守卫（沙箱时钟混用）

wujie 会把子应用的 `requestAnimationFrame` 替换为**主应用的** rAF（其 window 属性白名单 `/animationFrame$/i` 所致），而 `performance` 仍指向子应用 iframe 本地——两条时间线在同一子应用作用域并存。Ark UI 底层的 zag 状态机 Timer（[issue #6](https://github.com/gopowerteam/tu-design/issues/6) 实证其 `start()` 取 `performance.now()`、`tick()` 取 rAF 回调时间戳）混用两时钟计时，测得的流逝 ≈「宿主加载 → 子应用打开」间隔（秒~分钟级）：有限时长 toast 首帧即被判超时消失，而 `loading` / `duration: Infinity`（不启计时器）完全正常——该差分即本缺陷的指纹。

挂载 [`<TuDesignProvider>`](/components/provider) 或 [`<ToastProvider>`](/components/toast) 根部时库自动安装哨兵检测，无需配置：

- 首个 rAF 回调测量 `|回调时间戳 − performance.now()|`，超过阈值 100ms（正常环境同帧抖动 ≤16ms，≈6 帧余量，零误伤）判定为混用拓扑，此后 rAF 回调时间戳统一改传本地 `performance.now()`（与上游单时钟修复同构），全部 zag 计时链路（toast 自动关闭、clipboard 已复制态、splitter、timer）恢复正确流逝；
- 干净环境首帧裁决后**自动恢复原引用**，零残留；普通同源 iframe 嵌入（现代浏览器对原始 iframe 已按文档自身时间线归一，无此问题）不受任何影响——因此守卫按**运行时实测**门控，而非按运行环境声明门控（按 mode 门控会在普通 iframe 下反向注入「时长被拉长」的新缺陷，issue #6 分析已实证）；
- `mode="none"` 显式关闭守卫（与「显式关全部适配」语义一致）；
- 上游 zag 修复混用后（`Timer.tick` 单时钟一行改动），哨兵测得漂移归零、守卫自动休眠，与上游修复安全共存。

快速自检（宿主 DevTools console）：找到 wujie 沙箱 iframe 后执行 `f.contentWindow.requestAnimationFrame(ts => console.log(ts - f.contentWindow.performance.now()))`——修复前输出秒~分钟级毫秒数，守卫生效后应 ≈ 一帧内（≤20ms）。

## 已知边界

- `fixed` 面板以视口为包含块，容器滚动时面板会短暂滞后于触发器（定位引擎监听 scroll 重新对齐），介意可显式传回 `positioning: { strategy: "absolute" }`；
- 触发器祖先带 `transform`（如入场动画容器）会劫持 `fixed` 的包含块，此时建议关闭 Teleport 让面板留在原地（Popover 为 `portal: false`，其他浮层组件以各自文档的对应 prop 为准）；
- wujie 以 degrade 模式（iframe 保活）运行时页面无 shadowRoot，组件样式随子应用留在 iframe 内，建议同样关闭 Teleport 让面板留在原地（**更优**：根部声明 `<TuDesignProvider mode="none">`，一次性关闭全部自动适配，免逐组件设置）；
- **层叠上下文（z-index）**：graft 渲染进 shadow DOM，但 shadow DOM **不创建独立层叠上下文**，子应用浮层的 z-index 与宿主页面元素直接比较。库的模态层 `--z-modal`（60）保证遮罩盖住置于 50~59 的宿主 chrome；宿主 chrome 若设 ≥ 60 会击穿遮罩，这是层叠契约而非硬保证。完整层叠序与 in-place/teleported 浮层分工见[主题 · z-index 层叠体系](/guide/theming)；
- wujie 下滚动锁禁用后，若子应用自身把 `body` 做成可滚（高度链未锁定），弹窗打开时背景可随滚轮滚动；「锁住宿主背景」需宿主参与（对真滚动容器施加 `overflow: hidden`），属跨沙箱协调的后续扩展点，见 [issue #4](https://github.com/gopowerteam/tu-design/issues/4) 讨论；
- qiankun / micro-app 为同文档渲染（无 iframe realm），预期无需适配（尚未实测）；非 iframe 型 graft 沙箱若未来出现，`sandbox.ts` 的 marker 探测为扩展点——追加该沙箱的官方标记信号即可，**或由该沙箱的使用方直接显式声明 `mode`**（探测不到也能配置对，见上节）。

以上机制在全部浮层组件中生效，无需配置；个别组件特有的覆盖入口（如 Popover 的 `to` / `portal` / `z-index`）见对应组件文档。
