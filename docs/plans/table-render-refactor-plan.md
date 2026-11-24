# TableRender 列设置与右键菜单重构方案（v1）

> 状态：方案已评审，待实施（Phase 0）
> 范围：`packages/vue/src/components/table-render/`
> 关联：`docs/plans/table-render-plan.md` 是初版功能方案；本文档只负责当前实现的重构与后续右键菜单基础设施，不重复历史决策。

## 0. 背景与结论

当前 `TableRender.vue` 已增长到 1514 行，同时承担引擎编排、搜索表单、列设置面板、表头矩阵、sticky 布局、表体状态、虚拟滚动和拖拽等职责。列设置逻辑与模板直接写在主组件里，入口与面板耦合；右键目前只有行级 `row-contextmenu`，没有统一的 header/cell/table 上下文。

本方案的目标不是立刻实现复制、导出等功能，而是先把以下四个边界拆开：

1. 引擎状态；
2. 表头/表体渲染；
3. 列设置面板；
4. 表格命令菜单。

列设置只是表格命令菜单中的一个命令；右键菜单是隐藏辅助入口，后续复制行/列、复制单元格、复制表格、导出都作为菜单项增量加入。

评审结论：方向可行，但需要补齐依赖清单、列设置面板宿主、右键 target 判定、表头测量和事件优先级等细节；本版已吸收这些修订。

### 0.1 需求与约束

#### 功能需求

- 列设置入口不能孤立占用布局；默认入口应与现有工具栏或表头整合。
- 保留现有列显隐能力：树形分组、三态勾选、最少一列、重置、受控 `visibleKeys`、双事件。
- 右键菜单作为隐藏辅助入口，不要求触屏/键盘；不能抢占现有行级 `row-contextmenu`。
- 列设置只是表格命令菜单的一个命令；后期需要支持复制行、复制列、复制单元格、复制表格、导出。
- 入口位置尚未最终确定，架构必须允许在“工具栏文字链接 / 表头 `⋮` / 右键菜单”之间切换。
- 本轮只做基础设施，不实现复制、导出等具体动作。

#### 工程约束

- 组件通过 registry 以源码分发；新增文件必须能被 CLI 安装，新增跨组件依赖必须写入 `registry.meta.json`。
- 不引入 `xlsx`、剪贴板库等新 npm 依赖。
- 必须保持现有公共 API、DOM 钩子、ARIA、事件载荷和 DEV 警告文案不变。
- 不重命名、不删除已分发文件，避免 CLI 更新时残留旧文件。
- 校验链路固定为：`vp check` → `vp run -r typecheck` → `vp test`；改动组件后补 `vp run generate:registry`。
- 现有行为测试是重构安全网，重构阶段以“测试不变”为完成标准。

#### 验收要求

- 列设置面板在工具栏入口、表头入口、右键菜单入口下打开的是同一个面板能力。
- `columnSettings: false` 时不出现任何列设置入口，受控 `visibleKeys` 仍生效。
- 右键 target 能正确区分 header / group / row / cell / empty / error / skeleton / pagination / table。
- 搜索框、菜单内部、已由业务 `preventDefault()` 的右键不触发内置菜单。
- 表头测量、虚拟滚动 `theadOffset`、fixed sticky 偏移在重构后行为不变。
- 复制/导出只保留 context 与菜单项扩展点，不在本轮出现半成品动作。

### 0.2 重构思路

1. **先分离能力，再替换入口**
   列设置拆成“面板内容 / 浮层宿主 / 入口适配器”三层。入口位置变化不影响面板逻辑；右键菜单、工具栏链接、表头按钮都只是入口。

2. **上下文优先，而不是按功能加事件**
   右键先建立统一的 `TableContextTarget`，复制行、复制列、复制单元格、导出都消费同一个 context。避免为每个动作新增 `xxx-contextmenu` 事件和菜单。

3. **单例浮层，避免实例爆炸**
   整个表格只保留一个列设置宿主和一个右键菜单宿主。不为每行、每列挂 `ContextMenu`；既避免大表格实例膨胀，也绕开 `ContextMenu` 无 Teleport、可能被滚动容器裁剪的问题。

4. **显式依赖，不用隐式 provide/inject**
   表头、表体、工具栏通过显式 model/actions props 获取状态与回调，便于单测和追踪数据流。若后续 prop 数量失控，再评估内部私有 inject。

5. **行为保持式重构**
   先补 characterization 测试，再按 Phase 提取；每个 Phase 以现有测试全绿为完成标准。高风险的表体拆分后置且可选，不阻塞列设置与菜单基础设施。

6. **只留扩展点，不提前做功能**
   复制/导出需要确定格式化、选中范围、服务端全量数据等语义，本轮只保证 context 携带 `record / rowKey / columnKey / rawValue`，菜单项支持 `onSelect` 闭包。

### 0.3 关键取舍

| 选项                            | 结论      | 原因                                    |
| ------------------------------- | --------- | --------------------------------------- |
| 点表头标题打开列设置            | 不采用    | 与排序点击冲突，属于破坏性交互变更      |
| 悬浮按钮作为默认入口            | 不采用    | 可能遮挡 fixed-right 列，hover 发现性差 |
| 表头内嵌 `⋮` / 工具栏文字链接   | 采用      | 零布局占用或复用已有行，不抢排序        |
| 每个入口各自实例化面板          | 不采用    | 右键菜单项无法统一打开，面板状态分散    |
| 单例列设置宿主 + controller     | 采用      | 所有入口打开同一面板，状态一致          |
| 每行/每列挂 `ContextMenu`       | 不采用    | 实例多、HTML/裁剪风险高                 |
| 单例右键菜单宿主                | 采用      | 大表格安全，便于统一 target 解析        |
| `provide/inject` 传递视图上下文 | 暂不采用  | 依赖隐式；显式 model/actions 更可测     |
| 本轮拆分 `TableBody`            | 可选/后置 | 虚拟滚动、ref 测量、拖拽预览耦合较深    |
| 右键菜单默认开启                | 不采用    | 会抢占业务右键；默认关闭，显式 opt-in   |

## 1. 目标与非目标

### 目标

- 将 `TableRender.vue` 缩减为编排与布局层。
- 将列设置拆成“纯面板 + 单例宿主 + 入口适配器”，入口可替换。
- 为右键菜单建立统一 context 和单例菜单宿主，默认关闭、显式 opt-in。
- 保持现有公共 API、DOM 契约、事件载荷和 DEV 警告不变。
- 为后续复制/导出预留 context 与菜单项扩展点。

### 非目标

- 本轮不实现复制行/列、复制单元格、复制表格、导出。
- 不引入 `xlsx`、剪贴板库等新依赖。
- 不改变 `visibleKeys`、分页、排序、选择、树形、虚拟滚动的语义。
- 不重命名或删除已分发的组件文件。
- 不做触屏/键盘专项适配；右键菜单定位为鼠标隐藏功能。

## 2. 已核实的代码事实

| 事实                    | 结论                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `TableRender.vue` 规模  | 当前 1514 行                                                                                     |
| 列设置逻辑位置          | 约 395–515 行；面板模板约 1158–1253 行                                                           |
| 表头模板位置            | 约 1267–1352 行                                                                                  |
| 表头测量逻辑            | `headerRowEls` / `rowTop` / `theadOffset` / `measureHeaderRows` 约 987–1028 行，直接供给虚拟滚动 |
| 现有右键能力            | `TableBodyRow.vue` 仅在 `<tr>` 上 `emit("row-contextmenu")`；表头/单元格/表格无统一上下文        |
| 现有定位属性            | `TableBodyRow` 的 `<tr>/<td>` 没有 `data-row-key` / `data-column-key`；表头 `<th>` 也没有        |
| `columnSettings` 默认值 | 默认 `true`；存在 `columnSettings: false` 行为测试                                               |
| 浮层组件                | `ContextMenu` / `DropdownMenu` 当前均无 Teleport，Positioner 直接渲染                            |
| registry 依赖           | `table-render/registry.meta.json` 当前没有 `input`、`dropdown-menu`、`context-menu`              |
| registry 生成器         | 递归收集组件子目录文件；源码 import 的 registry 依赖漏声明会直接抛错                             |
| 测试规模                | `TableRender.test.ts` 2554 行；`TableRender.visibility.test.ts` 475 行                           |

## 3. 目标架构

```text
TableRender.vue                    # 编排、布局、对外 API
├─ TableToolbar.vue                # 搜索区 / #toolbar / #actions / 列设置入口
├─ TableHeader.vue                 # thead、表头矩阵、排序、表头入口
├─ TableBody.vue                   # 可选，二期再拆
├─ TablePagination.vue             # 已有
├─ TableColumnSettings.vue         # 单例根面板宿主
│   └─ ColumnSettingsPanel.vue     # 纯面板内容
└─ TableContextMenu.vue            # 单例表格命令菜单

composables/
├─ useTableHeaderModel.ts          # 表头树、矩阵、深度
├─ useStickyLayout.ts              # sticky 映射、min-width、分组 sticky
├─ useHeaderMeasurement.ts         # 多行表头测量、theadOffset
├─ useColumnSettingsPanel.ts       # 面板行、三态、搜索、折叠
└─ useTableContextMenu.ts          # target 解析、context、items、open/position
```

### 依赖传递方式

使用显式 model/actions props，不使用 `provide/inject`：

```ts
<TableHeader :model="headerModel" :actions="headerActions" />
<TableToolbar :model="toolbarModel" :actions="toolbarActions" />
```

理由：依赖显式、便于单测、避免隐式耦合。若后续 prop 数量失控，再评估内部私有 inject，不影响公共 API。

### 状态归属

| 状态                             | 归属                                                |
| -------------------------------- | --------------------------------------------------- |
| `visibleKeys` / `setVisibleKeys` | 引擎 `useTableRender`                               |
| 面板搜索词、分组折叠             | `ColumnSettingsPanel` 局部状态                      |
| 面板开关、锚点、高亮列           | `useColumnSettingsController`                       |
| 右键 context / 菜单项 / 打开位置 | `useTableContextMenu`                               |
| 表头树、矩阵、sticky、min-width  | `useTableHeaderModel` / `useStickyLayout`           |
| 表头测量、`theadOffset`          | `useHeaderMeasurement`，由 `TableHeader` 持有并回传 |
| 复制/导出数据范围                | 后续 helper / 业务 resolver                         |

## 4. 列设置设计

### 4.1 模块职责

- `ColumnSettingsPanel.vue`：纯内容，不依赖引擎。
- `TableColumnSettings.vue`：根级 Popover 宿主，`trigger="manual"` + 隐藏锚点。
- `useColumnSettingsController`：在 `TableRender` 中创建，所有入口共用。

```ts
interface ColumnSettingsController {
  open: Ref<boolean>;
  highlightKey: Ref<string | undefined>;
  openAt(target: MouseEvent | HTMLElement, columnKey?: string): void;
  close(): void;
}
```

入口统一调用：

- 工具栏文字链接 → `openAt(event)`
- 表头 `⋮` → `openAt(event, cell.key)`
- 右键菜单“列设置…” → 关闭菜单后 `openAt(event, targetKey)`

这样避免“每个入口各有一个面板实例”，也解决右键菜单项找不到面板宿主的问题。

### 4.2 面板 props / emits

```ts
props:
  columns: TableColumnOptions[]
  columnTree: TableColumnNode[]
  visibleKeys: readonly string[]
  defaultVisibleKeys?: string[]
  highlightKey?: string

emits:
  "update:visible-keys": [keys: string[]]
```

- `visibleKeys` 始终由引擎控制，面板只 emit；
- `TableRender` 收到后调用 `instance.setVisibleKeys`，现有 watcher 继续发双事件；
- “最少一列”、受控空数组钳制仍由引擎负责。

### 4.3 面板内容

- Header：标题 + `已显示 8/12` + 重置（仅当 `defaultVisibleKeys` 存在）。
- 搜索：列数 ≥ 6 时显示；匹配叶子时保留祖先分组。
- 分组行：折叠 chevron + 三态 Checkbox。
- 叶子行：缩进、Pin 标识、隐藏列弱化。
- Footer：全选（已全选 disabled）/ 无匹配提示。
- 打开时高亮并滚动到 `highlightKey` 对应列。
- 保留现有 DOM 钩子：`data-column-item`、`data-column-key`、`data-column-group`。

### 4.4 入口策略

```ts
const hasTopBar = showSearchArea || !!$slots.toolbar || !!$slots.actions;
```

- `hasTopBar` → `TableToolbar` 渲染文字链接“列设置 8/12”；
- 否则 → `TableHeader` 在叶子表头渲染 `⋮`；
- `columnSettings: false` → 不渲染任何入口；
- 可选 `columnSettingsPlacement?: "auto" | "toolbar" | "header"`，默认 `auto`。

表头 `⋮`：

- 绝对定位，不参与布局；
- `group-hover` / `focus-visible` 显示，`[@media(hover:none)]` 常显；
- `@click.stop`，排序按钮不动；
- `data-column-settings`、`aria-label="列设置：<title>"`；
- 排序按钮增加 `data-sort-button`，避免测试误选。

## 5. 右键菜单设计

### 5.1 默认关闭，显式 opt-in

```ts
contextMenu?: boolean | ((ctx: TableContextMenuContext<T>) => TableMenuItem<T>[]);
```

- 默认 `false`：不挂根级 `contextmenu`，不影响现有行为；
- `true`：使用默认菜单；
- 函数：业务返回 items，可复用 `defaultTableMenuItems(ctx)`；
- `row-contextmenu` 保持原样。

### 5.2 统一上下文

```ts
export type TableContextTarget<T extends DataRecord = DataRecord> =
  | { kind: "table" }
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "skeleton" }
  | { kind: "pagination" }
  | { kind: "header"; columnKey?: string; groupPath?: string; node: TableColumnNode<T> }
  | { kind: "row"; record: T; index: number; rowKey: string }
  | {
      kind: "cell";
      record: T;
      index: number;
      rowKey: string;
      columnKey: string;
      /** 明确取自 record[columnKey]，不是 line.cells 的 VNode */
      rawValue: unknown;
    };

export interface TableContextMenuContext<T extends DataRecord = DataRecord> {
  target: TableContextTarget<T>;
  event: MouseEvent;
  selection: { keys: string[]; rows: T[] };
  visibleKeys: readonly string[];
  columns: readonly TableColumnOptions<T>[];
  close: () => void;
}
```

不暴露完整 `TableRenderDefinition`；业务需要引擎时使用自己持有的 `definition`。

### 5.3 target 判定优先级

```text
1. 命中 input / textarea / [contenteditable] / [data-no-table-menu] → return
2. event.defaultPrevented → return
3. 菜单内部 [data-scope="menu"] → return
4. tr[data-row-key] + td[data-column-key] → cell
5. tr[data-row-key] → row
6. th[data-column-key] → header leaf
7. th[data-column-group] → header group
8. [data-table-empty] / [data-table-error] / [data-table-skeleton] → 对应状态
9. [data-table-pagination] → pagination
10. 兜底 → table
```

必须显式补属性：

- `TableBodyRow` 的 `<tr>`：`data-row-key`
- `<td>`：`data-column-key`（选择/拖拽单元格除外）
- 表头叶子 `<th>`：`data-column-key`
- 分组 `<th>`：`data-column-group`
- 空态/错误/骨架/分页：`data-table-*`

### 5.4 菜单项

```ts
export interface TableMenuItem<T extends DataRecord = DataRecord> {
  type?: "item" | "separator" | "label" | "group";
  value?: string;
  label?: string;
  disabled?: boolean;
  children?: TableMenuItem<T>[];
  onSelect?: (ctx: TableContextMenuContext<T>) => void | Promise<void>;
}
```

- 默认项使用 `onSelect` 闭包，避免 value 冲突和“谁处理内置动作”的歧义；
- 业务 resolver 返回自己的 items，也可复用默认项；
- 没有 `onSelect` 的项，点击时发 `context-menu-select` 事件；
- 异步动作：菜单先关闭再执行；错误由业务 catch 或后续增加 `context-menu-error`；
- `columnSettings: false` 时，默认工厂自动过滤列相关项；
- 未配置 `defaultVisibleKeys` 时不显示“重置列”，只显示“显示全部列”；
- 最终 items 为空时不打开菜单。

### 5.5 菜单宿主

- 单例受控 `DropdownMenu`，放在表格根节点、滚动容器外；
- 隐藏 0x0 固定锚点，`positioning: { strategy: "fixed" }`；
- 菜单内部 `@contextmenu.stop`，target 判定同时排除 `[data-scope="menu"]`；
- 关闭菜单后再打开列设置面板，避免两层浮层叠加；
- `DropdownMenu` 无 Teleport，表格嵌在 `overflow: hidden` 弹窗内时仍可能裁剪；文档标注，后续再补 portal。

### 5.6 与 `row-contextmenu` 的协议

```ts
function onTableContextMenu(event: MouseEvent) {
  if (event.defaultPrevented) return;
  // ...
}
```

业务行右键处理器调用 `event.preventDefault()` 即表示“我接管，不打开内置菜单”。这比单纯文档约定可靠。

### 5.7 复制/导出扩展点（本轮不实现）

后续菜单项可基于以下信息实现：

- 复制单元格：`target.rawValue`；
- 复制行/列/表格：`target` + `visibleKeys` + 当前页行；
- 导出 CSV：可见列 × 当前页行，`\uFEFF` BOM；
- 服务端全量导出：业务通过 `onSelect` 自行请求，不依赖组件内置全量数据。

## 6. 公共 API 变更

只做加性变更：

```ts
// props
columnSettingsPlacement?: "auto" | "toolbar" | "header"; // 可选，默认 auto
contextMenu?: boolean | ((ctx: TableContextMenuContext<T>) => TableMenuItem<T>[]); // 默认 false

// emits
"context-menu": [ctx: TableContextMenuContext<T>];
"context-menu-select": [value: string, ctx: TableContextMenuContext<T>];
```

- 现有 `columnSettings?: boolean` 语义不变；
- `visibleKeys`、`defaultVisibleKeys`、事件载荷不变；
- `row-contextmenu` 不变；
- `defineExpose` 不变；
- 新类型从 `table-render/index.ts` 导出：`TableContextTarget`、`TableContextMenuContext`、`TableMenuItem`、`defaultTableMenuItems`。

## 7. 文件清单

### 新增

- `table-render/ColumnSettingsPanel.vue`
- `table-render/TableColumnSettings.vue`
- `table-render/TableToolbar.vue`
- `table-render/TableHeader.vue`（Phase 3）
- `table-render/TableContextMenu.vue`（Phase 4）
- `table-render/useColumnSettingsPanel.ts`
- `table-render/useColumnSettingsController.ts`
- `table-render/useTableHeaderModel.ts`
- `table-render/useStickyLayout.ts`
- `table-render/useHeaderMeasurement.ts`
- `table-render/useTableContextMenu.ts`
- `table-render/context-menu-types.ts`
- 对应测试文件

### 修改

- `table-render/TableRender.vue`：编排、入口、controller、菜单 opt-in。
- `table-render/TableBodyRow.vue`：增加 `data-row-key` / `data-column-key`。
- `table-render/registry.meta.json`：增加 `input`、`dropdown-menu`（或 `context-menu`），更新 description。
- `table-render/index.ts`：导出新增公共类型/默认菜单工厂。
- `packages/vue/registry/vue/*.json`：重新生成。
- `apps/docs/components/table-render.md`：列设置入口、右键菜单、API 表。
- `apps/docs/demos/table-render/ColumnVisibilityDemo.vue`：入口与面板演示。
- `table-render/TableRender.visibility.test.ts`、`TableRender.test.ts` 等：选择器与新测试。

### 不重命名/不删除

`TableRender.vue`、`TableBodyRow.vue`、`TablePagination.vue` 等已分发文件路径保持不变，只新增文件。避免 CLI `add --overwrite` 更新时残留旧文件。

## 8. 实施阶段

### Phase 0：基线测试

- 现有测试全量通过。
- 补 characterization 测试：
  - 列设置面板 DOM/事件/最少一列/受控回写；
  - 表头排序、分组、fixed sticky；
  - `row-contextmenu` 与 `defaultPrevented`；
  - 虚拟滚动 `theadOffset`；
  - DEV 警告文案/次数。
- 完成标准：不改实现，测试全绿。

### Phase 1：纯逻辑提取

- `useTableHeaderModel`
- `useStickyLayout`
- `useHeaderMeasurement`

模板暂不动；完成标准是 DOM 与行为零变化，warning 测试通过。

### Phase 2：列设置重构

- `useColumnSettingsPanel`
- `ColumnSettingsPanel.vue`
- `TableColumnSettings.vue` + controller
- `TableToolbar` 文字链接 / `TableHeader` `⋮`
- 移除旧的 `settingsTipOpen` 手动 Tooltip 逻辑
- 增加 `input` 依赖
- 更新 visibility 测试选择器

完成标准：

- 现有列显隐测试通过；
- 新增搜索、折叠、计数、高亮、入口位置测试；
- 排序按钮与设置按钮互不干扰；
- `columnSettings: false` 无任何入口。

### Phase 3：表头/工具栏拆分

- `TableHeader.vue`（含测量并 emit）
- `TableToolbar.vue`
- `TableBody.vue` 可选，高风险则暂缓
- 使用显式 model/actions props

完成标准：所有现有表头/分组/填充/边框/拖拽测试通过；`theadOffset` 与虚拟滚动行为不变。

### Phase 4：右键菜单基础设施

- 补 `data-*` 属性；
- `useTableContextMenu` + `TableContextMenu.vue`；
- 增加 `dropdown-menu` 依赖；
- 默认菜单项：列设置 / 重置列 / 显示全部列；
- 实现 target 判定、输入框/菜单内部/空态/行事件协议；
- 测试 target 与菜单打开链路。

完成标准：

- 右键 header/row/cell/empty/error/pagination 得到正确 target；
- 搜索框右键不劫持原生菜单；
- 菜单内部右键不重复打开；
- 业务行右键 `preventDefault` 后不打开内置菜单；
- 菜单“列设置…”能打开同一个列设置面板。

### Phase 5：收尾

- 更新文档与 demo（右键作为隐藏功能、入口位置）。
- `registry.meta.json` 依赖与 description。
- `cd packages/vue && vp run generate:registry`
- `vp run -r typecheck`
- `vp check`
- `vp test`
- 手动验证宽表、fixed 列、分组表头、fill/virtual、弹窗内表格。

## 9. 测试矩阵

### 现有测试

- `TableRender.test.ts`
- `TableRender.visibility.test.ts`
- `TableRender.header-group.test.ts`
- `TableRender.fill.test.ts`
- `TableRender.border.test.ts`
- `TableRender.drag.test.ts`
- `TableRender.align.test.ts`
- `TablePagination.test.ts`

### 新增测试

| 范围        | 用例                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| 列设置面板  | 搜索过滤、分组折叠、三态、空结果、计数、高亮、重置                          |
| 入口        | 有顶栏用文字链接；裸表用表头 `⋮`；`columnSettings:false` 无入口             |
| 表头        | 点击 `⋮` 不触发排序；排序按钮仍正常；多级表头叶子入口                       |
| 右键 target | header / group / row / cell / empty / error / skeleton / pagination / table |
| 异常边界    | 搜索框右键、菜单内部右键、`defaultPrevented`、最终 items 为空               |
| 菜单动作    | 列设置打开同一面板、重置列、显示全部列                                      |
| 测量        | `theadOffset` 回传、虚拟滚动 scrollMargin 不变                              |

### 测试选择器

- 排序按钮：`[data-sort-button]`
- 列设置入口：`[data-column-settings]`
- 菜单：`[data-table-menu]`
- 面板行：保留 `data-column-item` / `data-column-key` / `data-column-group`

### 命令

```bash
cd packages/vue && vp test --run table-render
vp run -r typecheck
vp check
cd packages/vue && vp run generate:registry
vp test
```

## 10. 风险与缓解

| 风险                            | 缓解                                               |
| ------------------------------- | -------------------------------------------------- |
| registry 依赖漏声明导致生成失败 | 依赖清单 + 生成后跑 drift test                     |
| 表头测量迁移破坏虚拟滚动        | `TableHeader` emit `theadOffset`，保留现有测量测试 |
| 右键菜单双开                    | `defaultPrevented` 协议 + 默认关闭                 |
| 搜索框右键被劫持                | target 直接排除 input/textarea/contenteditable     |
| 菜单内部右键再次触发            | `[data-scope="menu"]` 排除 + `@contextmenu.stop`   |
| 每个表头一个 Popover 性能       | 单例根面板 + controller                            |
| 菜单被弹窗裁剪                  | 首版文档标注；后续加 portal                        |
| 拆表体引入虚拟滚动回归          | 本轮不强制拆 `TableBody`                           |
| 测试选择器误命中                | `data-sort-button` / `data-column-settings`        |
| CLI 更新残留旧文件              | 不重命名/删除已分发文件，只新增                    |

## 11. 后续待决

- `TableBody.vue` 是否拆分，视 Phase 3 风险决定。
- 菜单宿主是否增加 portal/Teleport，覆盖弹窗内表格。
- 复制/导出具体实现：`copyable` / `copyValue`、TSV/CSV、剪贴板兜底。
- 触屏/键盘专项适配：本轮不做。
