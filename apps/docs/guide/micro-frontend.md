# 微前端与沙箱环境

tu-design 的浮层组件在 **wujie 微前端**、**Shadow DOM 沙箱**（如 micro-app `strictStyleIsolation`、web component 沙箱）等环境下会**自动适配**，无需任何配置。本文沉淀这套适配的通用机制——由组件库的 `overlay-shared` 公共层统一实现，对所有浮层组件行为一致；各组件文档只保留组件特有的 props（如 `to`、`positioning` 透传），不再重复展开（下文以 Popover 举例之处均为通用机制）。

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

## 已知边界

- `fixed` 面板以视口为包含块，容器滚动时面板会短暂滞后于触发器（定位引擎监听 scroll 重新对齐），介意可显式传回 `positioning: { strategy: "absolute" }`；
- 触发器祖先带 `transform`（如入场动画容器）会劫持 `fixed` 的包含块，此时建议关闭 Teleport 让面板留在原地（Popover 为 `portal: false`，其他浮层组件以各自文档的对应 prop 为准）；
- wujie 以 degrade 模式（iframe 保活）运行时页面无 shadowRoot，组件样式随子应用留在 iframe 内，建议同样关闭 Teleport 让面板留在原地；
- **层叠上下文（z-index）**：graft 渲染进 shadow DOM，但 shadow DOM **不创建独立层叠上下文**，子应用浮层的 z-index 与宿主页面元素直接比较。库的模态层 `--z-modal`（60）保证遮罩盖住置于 50~59 的宿主 chrome；宿主 chrome 若设 ≥ 60 会击穿遮罩，这是层叠契约而非硬保证。完整层叠序与 in-place/teleported 浮层分工见[主题 · z-index 层叠体系](/guide/theming)；
- wujie 下滚动锁禁用后，若子应用自身把 `body` 做成可滚（高度链未锁定），弹窗打开时背景可随滚轮滚动；「锁住宿主背景」需宿主参与（对真滚动容器施加 `overflow: hidden`），属跨沙箱协调的后续扩展点，见 [issue #4](https://github.com/gopowerteam/tu-design/issues/4) 讨论；
- qiankun / micro-app 为同文档渲染（无 iframe realm），预期无需适配（尚未实测）；非 iframe 型 graft 沙箱若未来出现，`sandbox.ts` 的 marker 探测为扩展点——追加该沙箱的官方标记信号即可。

以上机制在全部浮层组件中生效，无需配置；个别组件特有的覆盖入口（如 Popover 的 `to` / `portal` / `z-index`）见对应组件文档。
