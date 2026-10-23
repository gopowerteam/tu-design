# TableRender

配置驱动的表格渲染器：`defineTable<T>()` 一步完成「列定义 + 分页排序状态 + 数据内核」，`<TableRender>` 负责语义化 `<table>` 渲染与分页条。基于 **TanStack Table** 管理分页/排序状态机，页码导航复用 **Ark UI Pagination** 原语，样式走 Tailwind tokens。

两种数据模式由 `onLoad` 决定：**静态模式**（传 `data`）本地分页与排序；**服务端模式**（传 `onLoad`）把分页/排序交还数据源，每次状态变化都以新参数回调取数。数据协议与 [x-render table-render](https://github.com/alibaba/x-render) 同构，迁移成本低。

| 适用                                            | 不适用                         |
| ----------------------------------------------- | ------------------------------ |
| 列多、要排序分页的列表页（省约 60 行/表的样板） | 结构特殊、单元格重度定制的页面 |

## 演示

静态模式（本地分页、排序、`render` 单元格、状态徽标、行点击）：

<DemoPreview file="table-render/StaticTableDemo.vue" />

服务端模式（`onLoad` 取数、关键词查询、默认排序、延迟响应）：

<DemoPreview file="table-render/ServerTableDemo.vue" />

搜索表单（`search` 接 FormRender：查询/重置自动联动取数）：

<DemoPreview file="table-render/SearchTableDemo.vue" />

固定列（横向滚动 + 左右 `fixed` + 选择列联动累计）：

<DemoPreview file="table-render/StickyColumnDemo.vue" />

虚拟滚动（`virtual` + `height`：10 000 行窗口渲染，滚动流畅）：

<DemoPreview file="table-render/VirtualScrollDemo.vue" />

树形数据（`tree`：子行展开/收起、层级缩进、caret 位于首列）：

<DemoPreview file="table-render/TreeTableDemo.vue" />

错误态（onLoad 抛错进入占位 + 重试；`#error` 插槽自定义）：

<DemoPreview file="table-render/ErrorRetryDemo.vue" />

行选择（checkbox 多选 + `selectable` 行级过滤 + 跨页保留；radio 单选 + 再点取消）：

<DemoPreview file="table-render/RowSelectionDemo.vue" />

## 安装

```bash
npx tu-design add table-render
```

会自动安装 `@tanstack/vue-table` 与 `@ark-ui/vue`。

## 用法

### 聚合式（推荐）

`defineTable` 须在组件 `setup` 中调用（TanStack `useVueTable` 依赖组件挂载），返回值直接传给 `:definition`：

<DemoPreview file="table-render/StaticTableDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface User {
  id: number;
  name: string;
  age: number;
}

const users: User[] = [/* ... */];

const table = defineTable<User>({
  data: users, // 静态模式：本地分页 + 本地排序
  pageSize: 10,
  columns: [
    { key: "id", title: "ID", width: 80 },
    { key: "name", title: "姓名", sortable: true, defaultSort: "asc" },
    {
      key: "age",
      title: "年龄",
      align: "right",
      sortable: true,
      formatter: (row) => `${row.age} 岁`,
    },
  ],
});
</script>

<template>
  <TableRender :definition="table" row-key="id" />
</template>
```

### 服务端模式

传 `onLoad` 即切换为服务端模式：引擎不做本地分页与排序，翻页/排序/改每页条数都以新参数回调 `onLoad`。

<DemoPreview file="table-render/ServerTableDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";
import type { TableLoadParams } from "@tu-design/vue";

const table = defineTable<User>({
  columns: [
    { key: "id", title: "ID" },
    { key: "name", title: "姓名", sortable: true },
  ],
  onLoad: async ({ page, sort, update }: TableLoadParams<User>) => {
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        pageIndex: page.pageIndex, // 1-based，对外 API 唯一口径
        pageSize: page.pageSize,
        sortBy: sort?.key,
        sortOrder: sort?.direction,
      }),
    });
    const { list, total } = await res.json();
    update(list, total); // total 缺省时沿用上一次的值
  },
  autoLoad: true, // 默认 true：挂载后自动取数
});
</script>

<template>
  <TableRender :definition="table" row-key="id" @row-click="onRowClick" />
</template>
```

`update(data, total?)` 是回写数据的唯一入口：表格自身不发请求，请求库（axios / ofetch / TanStack Query…）完全由调用方决定。

### 搜索表单联动（search）

`search` 接收 [`defineForm`](/components/form-render) 返回的定义对象，表格即在上方内置渲染搜索区（搜索 + 重置按钮）：**点「搜索」走 FormRender 完整校验流，通过后归位第 1 页重载；点「重置」回到 `items.default` 后重载**。服务端模式下每次翻页/排序/重载的 `onLoad` 都自动携带当前表单值（`params.form`），无需手动拼接查询条件。

<DemoPreview file="table-render/SearchTableDemo.vue" />

```vue
<script setup lang="ts">
import * as v from "valibot";
import { defineForm, defineTable } from "@tu-design/vue";

interface OrderQuery {
  keyword: string;
  status: string | null;
}

const search = defineForm<OrderQuery>({
  items: [
    {
      key: "keyword",
      title: "关键词",
      default: "",
      render: (r) => r.input({ placeholder: "客户 / 订单号" }),
    },
    {
      key: "status",
      title: "状态",
      default: null,
      render: (r) => r.select({ items: ["已付款", "待付款", "已关闭"] }),
    },
  ],
  schema: v.object({ keyword: v.string(), status: v.nullable(v.string()) }),
});

const table = defineTable<Order>({
  search, // 传入即内置搜索区
  columns: [/* ... */],
  onLoad: ({ form, page, sort, update }) => {
    // form 即搜索表单当前值：{ keyword, status }
    fetchOrders({ ...form, pageIndex: page.pageIndex, pageSize: page.pageSize, sort }).then(
      ({ list, total }) => update(list, total),
    );
  },
});
</script>

<template>
  <TableRender :definition="table" row-key="id" @search="onSearch" @reset="onReset" />
</template>
```

行为细则：

- **仅服务端模式生效**：`onLoad` 才有取数时机；静态模式（`data`）传入 `search` 时 DEV 警告并忽略（不做本地过滤）
- **校验先行**：「搜索」走 FormRender 完整校验流（`schema` 可选），校验失败不发 search 也不取数
- **重置即重载**：FormRender 将表单重置为 `items.default`（未配 `default` 的字段为 `null`）后，表格归位第 1 页重载；重置后的 defaults 会随 `onLoad` 下发
- **事件转发**：`search` / `reset` 事件携带当前表单值快照（`(values) => void`），便于上报埋点或同步外部状态
- **双模式装配**：`defineTable({ search })`（聚合式）或 `<TableRender search>` prop（拆分式）皆可；两者同传时 definition 优先并 DEV 警告。definition 未配置时 prop 回填生效（与 rowSelection 的「聚合式忽略」不同）
- **不做**：查询按钮 loading、搜索区布局自定义插槽、`v-model` 受控——需要时先取 `search.form` 自行扩展

### 拆分式

不想（或不能）在 `setup` 里建内核时，可直接把配置拆成 props（`definition` 优先，存在时忽略其余）：

```vue
<TableRender row-key="id" :columns="columns" :data="users" />
```

<DemoPreview file="table-render/SplitUsageDemo.vue" />

## API

按「入口函数 → 组件 → 数据类型」三组组织；单元格预设见下一节 [内置列渲染器](#内置列渲染器)。

### `defineTable<T>(config)` / `useTableRender(options)`

`defineTable` 是 `useTableRender` 的聚合别名（后者供「已有内核、动态切换数据源」的场景）。两者均须在组件 `setup` 中调用。

| config 字段     | 类型                                              | 默认             | 说明                                                                                       |
| --------------- | ------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `columns`       | `TableColumnOptions<T>[]`                         | —                | 列配置；`key` 为取值字段                                                                   |
| `data?`         | `T[] \| Ref \| () => T[]`                         | —                | 静态模式数据源；ref/getter 自动跟随                                                        |
| `onLoad?`       | `(params: TableLoadParams<T>) => void \| Promise` | —                | 服务端模式数据源；与 `data` 冲突时以此为准                                                 |
| `autoLoad?`     | `boolean`                                         | `true`           | 挂载后是否自动取数（仅服务端模式生效）                                                     |
| `pageSize?`     | `number`                                          | `10`             | 每页条数                                                                                   |
| `pageSizeOpts?` | `number[]`                                        | `[10,20,50,100]` | 每页条数下拉选项                                                                           |
| `rowSelection?` | `"radio" \| "checkbox" \| TableSelectionOptions`  | —                | 行选择；字符串为简写（S2）                                                                 |
| `rowKey?`       | `string`                                          | —                | 行主键字段；rowSelection 依赖（S1）                                                        |
| `search?`       | `FormRenderDefinition`                            | —                | 搜索表单（`defineForm` 返回值）；仅服务端模式生效，静态模式传入时 DEV 警告并忽略           |
| `virtual?`      | `boolean`                                         | —                | 表体行虚拟化渲染（当前页行窗口内，分页语义不变）；须同时配置 `height`，否则 DEV 警告并降级 |
| `height?`       | `number \| string`                                | —                | 虚拟滚动容器高度（数字 px 或 CSS 高度）；仅 `virtual: true` 时生效                         |
| `tree?`         | `TreeOptions`                                     | —                | 树形数据（子行展开/收起）；配置无效时 DEV 警告并忽略，见[树形数据](#树形数据)              |
| `pageIndex?`    | `number`                                          | —                | 受控页码（1-based）：传入即受控，缺省非受控；内部翻页经 `update:page-index` 通知           |
| `pageSize?`     | `number`                                          | —                | 受控每页条数：传入即受控；`pageIndex` 未受控时 R9 归位内部处理并通知                       |
| `sort?`         | `SortableOptions`                                 | —                | 受控排序：传入即受控；内部/外部变化均经 `sort-change` 通知                                 |
| `selectedKeys?` | `(string \| number)[]`                            | —                | 受控选中集（数组，与 `update:selected-keys` 载荷同构）；传入即受控                         |

返回 `TableRenderDefinition<T>`：

| 字段                                      | 说明                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `columns`                                 | 列配置                                                                    |
| `table`                                   | TanStack 表格实例（逃逸舱口：列聚合、rowSelection 等）                    |
| `page`                                    | 只读投影 `{ pageIndex(1-based), pageSize, total, pageSizeOpts }`          |
| `sort`                                    | 只读投影 `{ key, direction } \| undefined`                                |
| `loading`                                 | 只读布尔（内部取数中）                                                    |
| `reload(resetPage?)`                      | 重新取数/重同步数据源；`resetPage` 为真时先回到第 1 页                    |
| `toggleSort(key)`                         | 排序三态切换：无 → asc → desc → 取消                                      |
| `setPageIndex(n)` / `setPageSize(n)`      | 1-based 页码；改每页条数会归位到第 1 页                                   |
| `selection`                               | 只读选中行快照 `{ value: T[], enabled, type, width }`；含跨页保留行（S6） |
| `selectedKeys`                            | 只读选中主键集合 `Ref<Set<string>>`（S7）                                 |
| `setSelection(keys)` / `clearSelection()` | 程序化设置/清空选中集（S12）                                              |
| `toggleRowSelected(key, checked)`         | 行控件切换；radio 受 `cancelable` 约束（S4）                              |
| `search`                                  | 校验后的搜索表单定义（未配置或被忽略时为 `undefined`），供组件渲染搜索区  |

辅助函数 `defineColumns<T>(columns)`：可选的类型辅助（便于把列配置抽到独立文件），纯类型推导、原样返回——裸数组同样可直接传给 `defineTable`。

### `TableRender` props

| prop                        | 类型                    | 默认       | 说明                                                                                                       |
| --------------------------- | ----------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `definition`                | `TableRenderDefinition` | —          | 聚合式内核（优先于其余 props）                                                                             |
| `rowKey`                    | `string`                | **必填**   | 行主键字段名                                                                                               |
| `columns`                   | `TableColumnOptions[]`  | —          | 拆分式列配置                                                                                               |
| `onLoad`                    | 见上                    | —          | 拆分式数据源                                                                                               |
| `data`                      | `T[]`                   | —          | 拆分式静态数据源                                                                                           |
| `autoLoad`                  | `boolean`               | `true`     | 同 config                                                                                                  |
| `pageSize` / `pageSizeOpts` | `number` / `number[]`   | 同 config  | 同 config；**仅初始值生效**，运行期调整用实例的 `setPageSize`                                              |
| `loading`                   | `boolean`               | —          | 外部受控加载态，与内部 loading 取或                                                                        |
| `emptyText`                 | `string`                | `暂无数据` | 空态文案（`#empty` 插槽优先）                                                                              |
| `search`                    | `FormRenderDefinition`  | —          | 搜索表单（defineForm 返回值）；拆分式直接传，聚合式请在 defineTable 配置（definition 优先，同传 DEV 警告） |

事件：`update:page-index` / `update:page-size`（单向通知，非受控）、`sort-change`、`row-click`（`(record, index, event)`）、`row-dblclick` / `row-contextmenu`（`(record, index, event)`，contextmenu 不主动 preventDefault）、`cell-click`（`(record, columnKey, index, event)`，与 `row-click` 冒泡并存——cell 触发时 row-click 也会触发）、`selection-change`（`(rows)`）、`update:selected-keys`（`(keys)`）、`search` / `reset`（`(values)`，搜索表单联动）、`load-error`（`(error)`，服务端模式 onLoad 失败）。
插槽：`empty`（空态）、以及列 `render` 返回的任意 VNode（完全自定义逃逸口）。
拆分式 props：`rowSelection`（仅拆分式生效；聚合式请在 `defineTable` 配置，同时传入时按 definition 为准并 DEV 警告）。

### 类型速查

#### `TableColumnOptions<T>`

| 字段           | 类型                                               | 说明                                                                                                 |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `key`          | `string`                                           | 列标识，同时作为默认取值字段                                                                         |
| `title`        | `string`                                           | 表头文本                                                                                             |
| `align?`       | `"left" \| "center" \| "right"`                    | 单元格对齐                                                                                           |
| `width?`       | `number \| string`                                 | 列宽                                                                                                 |
| `render?`      | `(record: T, index: number, column) => VNodeChild` | 自定义单元格；优先于 `formatter`；第三参 `column` 供内置渲染器读取字段值                             |
| `formatter?`   | `(record: T) => string \| number \| Date`          | 纯数据格式化                                                                                         |
| `ellipsis?`    | `boolean \| "tooltip"`                             | 截断处理：`true` = truncate + 原生 title；`"tooltip"` = 库内 Tooltip（无原生 title），见下方行为细则 |
| `sortable?`    | `boolean`                                          | 是否可排序（渲染为 `<button>`，带 `aria-sort`）                                                      |
| `defaultSort?` | `"asc" \| "desc"`                                  | 初始排序方向；须同时 `sortable: true`                                                                |
| `fixed?`       | `"left" \| "right"`                                | 固定列方向；须同时提供数字 `width`（见[固定列](#固定列)）                                            |

取值优先级：`render` > `formatter` > `record[key]`（`null`/`undefined` 显示为空）。

#### `TableLoadParams<T>`

| 字段     | 类型                                  | 说明                                                    |
| -------- | ------------------------------------- | ------------------------------------------------------- |
| `page`   | `PageableOptions`                     | `{ pageIndex(1-based), pageSize, total, pageSizeOpts }` |
| `sort?`  | `SortableOptions`                     | 无排序或已取消排序时为 `undefined`                      |
| `form`   | `Record<string, unknown>`             | 搜索表单当前值；未配置 `search` 时为 `{}`               |
| `update` | `(data: T[], total?: number) => void` | 回写数据；`total` 缺省时保留旧值                        |

## 行选择

开启 `rowSelection` 即注入首列选择列。**单选/多选同一入口**：`"radio"` / `"checkbox"` 字符串简写，或对象详写。批量操作示例见顶部演示 [RowSelectionDemo](#演示)。

<DemoPreview file="table-render/RowSelectionDemo.vue" />

```vue
<script setup lang="ts">
import { computed } from "vue";
import { defineTable } from "@tu-design/vue";

const table = defineTable<User>({
  rowKey: "id",
  data: users,
  rowSelection: {
    type: "checkbox",
    width: 48,
    selectable: (row) => !row.locked, // 返回 false 的行置灰且被全选跳过
    reserveOnPageChange: true, // 默认 true：翻页/重载后选中保留
  },
  columns: [/* ... */],
});

// 批量操作：selection.value 是完整行对象（含跨页保留行）
function batchDelete() {
  const rows = table.selection.value; // T[]
  const keys = [...table.selectedKeys.value]; // Set<string>
}
</script>

<template>
  <TableRender :definition="table" row-key="id" @selection-change="onSelectionChange" />
</template>
```

### `rowSelection` 配置

| 字段                   | 类型                     | 默认   | 说明                                                 |
| ---------------------- | ------------------------ | ------ | ---------------------------------------------------- |
| `type`                 | `"radio" \| "checkbox"`  | —      | radio 单选互斥，checkbox 多选                        |
| `width?`               | `number`                 | `48`   | 选择列宽                                             |
| `selectable?`          | `(record: T) => boolean` | —      | 行级可选过滤；`false` 的行控件置灰且被全选跳过（S5） |
| `cancelable?`          | `boolean`                | `true` | radio 再点已选行是否取消（S4）                       |
| `reserveOnPageChange?` | `boolean`                | `true` | 翻页/数据重载后是否保留选中（S6）                    |

### 设置默认选中值

`rowSelection` 没有 `defaultSelection` 配置项——默认选中走程序化出口 `setSelection(keys)`，在 `onMounted` 中预置即可（演示中的两块表格均带默认选中）：

<DemoPreview file="table-render/RowSelectionDemo.vue" />

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { defineTable } from "@tu-design/vue";

const table = defineTable<User>({
  rowKey: "id",
  data: users,
  rowSelection: { type: "checkbox", selectable: (row) => !row.locked },
  columns: [/* ... */],
});

// 预置 id 为 1、3 的行；selectable 为 false 的行会被引擎忽略
onMounted(() => {
  table.setSelection([1, 3]);
});
</script>
```

行为细则：

- **静态模式**：`data` 在 setup 阶段已就绪，`onMounted` 里 `setSelection` 即可生效，表头三态与 `selection-change` 都会正确联动
- **服务端模式**：首屏数据由 `onLoad` 异步回写，预置须等数据到达后执行——在 `onLoad` 的 `update` 回调里判断“仅首次”后调用 `setSelection`（此时快照已含该页行对象，`selection.value` 拿到完整行）

```ts
let primed = false;

const table = defineTable<User>({
  // ...
  onLoad: async ({ page, update }) => {
    const { list, total } = await fetchUsers(page);
    update(list, total);
    if (!primed) {
      primed = true;
      table.setSelection([1, 3]); // 默认选中，仅首屏一次
    }
  },
});
```

- `setSelection` 允许传入当前数据中不存在的 key（进入待定集，数据出现后自动关联行对象，S12）；`selectable` 过滤范围内的不可选行会被直接忽略（对齐 S5）
- radio 型预置多个 key 时只有最后一个生效（单选互斥，S4）

行为细则（S 系列，编号对应设计文档 `docs/plans/table-selection-plan.md`）：

- **rowKey 是硬依赖（S1）**：rowSelection 启用但 rowKey 无效时 DEV 警告并禁用选择——组件内部以 `String(row[rowKey])` 作为行 id，缺失会跨页串选，不做索引兜底
- **全选是本页语义（S10）**：表头 checkbox 三态（全选/半选/未选）只作用于当前页的可选行，不选中未加载的行
- **跨页保留（S6）**：`reserveOnPageChange: true`（默认）时翻页/`update()` 重载不清空选中；`selection.value` 从内置快照返回完整行对象——**跨页行可能是过期数据**（数据源已更新时），行对象再次出现会以新数据覆盖快照
- **radio 默认可取消（S4）**：再点已选行取消选中；`cancelable: false` 时该交互为空操作（程序化 `clearSelection` 不受限）
- **选择不冒泡（S5）**：点击选择控件不会触发行 `row-click`；`selection-change` 只在选中集变化时发一次，排序/翻页不触发
- **受控**：`update:selected-keys` 事件支持外部回写选中集；程序化出口 `setSelection(keys)` 允许暂不存在的 key、并过滤不可选行（S5/S12）

## 固定列

列配置 `fixed: "left" | "right"` 即横向滚动时把该列 sticky 在对应一侧：表头、数据行、加载骨架行同位同偏移；选择列（`rowSelection`）视作最左固定列参与偏移累计。偏移量在渲染层按列宽推导（纯 computed，不进 TanStack pinning 状态），因此 **fixed 列必须提供数字型 `width`（px）**——缺失或为字符串/百分比时 DEV 警告「已忽略 fixed」并按普通列渲染。

<DemoPreview file="table-render/StickyColumnDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

const table = defineTable<Order>({
  rowSelection: "checkbox", // 选择列视作最左固定列参与累计
  columns: [
    { key: "date", title: "日期", width: 110, fixed: "left" },
    { key: "customer", title: "客户", width: 140 },
    { key: "product", title: "商品", width: 160 },
    { key: "remark", title: "备注", width: 280, ellipsis: true },
    { key: "ops", title: "操作", width: 130, fixed: "right", render: (r) => r.button(["编辑"]) },
  ],
});
</script>

<template>
  <!-- 外层限宽制造横向滚动 -->
  <div class="max-w-2xl">
    <TableRender :definition="table" row-key="id" />
  </div>
</template>
```

行为细则：

- **offset 累计**：`fixed: "left"` 列偏移 = 之前所有 fixed-left 列宽之和（有选择列时先累加选择列宽 48）；`fixed: "right"` 从最右列反向累计。纯渲染层 computed，不写 TanStack pinning state
- **呈现分层**：sticky 单元格统一 `bg-background`（防滚动透出）；表头 z-index（20）高于表体（10）；每个 sticky 组朝滚动方向的交界列加分隔边框（左组 `border-r`、右组 `border-l`）
- **滚动容器**：`<table>` 外层的 `overflow-x-auto` 容器始终存在（分页条不参与横向滚动）；固定列只是 sticky 定位，不引入 `table-fixed`，表格仍由内容与列宽协商宽度
- **骨架同构**：加载骨架行的固定列同 sticky 同偏移；空态行是横跨全列的单单元格，不参与 sticky
- **不做**：纵向 sticky 表头、滚动位置动态阴影、`min-width` 弹性列宽、TanStack pinning 状态接入

## 虚拟滚动

`virtual: true` + `height` 开启表体行虚拟化（基于 **TanStack Virtual**）：**当前页行窗口内**只渲染视口附近的行（分页语义不变），10 000 行级别数据滚动依旧流畅。行高经 `measureElement` 动态测量（行内容高度可变，不假设固定行高），rowKey 作为虚拟行 key；表头与骨架行不虚拟化。

<DemoPreview file="table-render/VirtualScrollDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

const table = defineTable<LogEntry>({
  data: rows, // 静态/服务端模式皆可；虚拟化只作用于当前页行窗口
  pageSize: 10_000,
  virtual: true,
  height: 400, // 数字 px 或 CSS 高度（"50vh" 等）
  columns: [/* ... */],
});
</script>

<template>
  <TableRender :definition="table" row-key="id" />
</template>
```

行为细则：

- **height 必填**：`virtual: true` 但缺 `height` 时 DEV 警告「virtual 需要配置 height」并降级普通渲染；数字按 px，字符串（`"50vh"`）原样作为容器高度
- **仅表体纵向滚动**：滚动容器由组件接管（`virtual` 模式下外层容器获得 `height` + `overflow-y: auto`，横向滚动能力保留，分页条不参与滚动）；表头普通渲染随内容滚动（纵向 sticky 表头不在本期范围）
- **scrollMargin 前缀**：表头在滚动容器内占据的前缀高度会在挂载后测量并作为 `scrollMargin` 传入虚拟化，窗口计算以表体坐标系为准
- **交互保持**：`row-click`、行选择（radio/checkbox）、`ellipsis`、`render` 列、固定列 sticky 在虚拟行下行为不变；行高动态测量，无需配置固定行高
- **骨架与空态不虚拟化**：loading 骨架行与空态行保持普通渲染
- **不做**：表头虚拟化、横向虚拟、树形行虚拟展开

## 树形数据

`tree` 配置开启树形数据（父子行）：子行字段默认 `children`，展开按钮（caret）位于**首个业务列单元格内**（对齐 antd/element 习惯，不加独立列），按 `depth × indentSize`（默认 16px）层级缩进。底层走 TanStack expanded 行模型——展开后的子行进入当前页行序列，分页/选择/排序语义不变。

<DemoPreview file="table-render/TreeTableDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

const table = defineTable<Dept>({
  data: orgTree,
  tree: {
    childrenKey: "children", // 子行字段名，默认 "children"
    defaultExpandAll: true, // 默认全部展开，默认 false
    indentSize: 16, // 每层缩进 px，默认 16
  },
  columns: [/* ... */],
});
</script>

<template>
  <TableRender :definition="table" row-key="id" />
</template>
```

### `tree` 配置

| 字段                | 类型      | 默认         | 说明             |
| ------------------- | --------- | ------------ | ---------------- |
| `childrenKey?`      | `string`  | `"children"` | 子行字段名       |
| `defaultExpandAll?` | `boolean` | `false`      | 初始是否全部展开 |
| `indentSize?`       | `number`  | `16`         | 每层缩进 px      |

行为细则：

- **展开按钮在首列内**：`getCanExpand()` 的行渲染 caret（`aria-expanded` + 展开态旋转），叶子行无 caret；缩进对首列内容整体生效，叶子行也缩进（对齐父级行头）
- **点击隔离**：caret 点击已阻断冒泡，不会误触发 `row-click`；展开/收起是纯客户端状态，不触发取数
- **子行参与分页/选择**：展开后的子行是当前页行序列的独立行——`selection-change`/全选含展开子行；**不做父子级联勾选**（勾父带子/半选态），受控 `expanded` 与详情展开行为二期
- **服务端模式**：children 随行数据返回、展开为纯客户端状态；翻页/排序重取后展开态会被 TanStack autoReset 重置（收起），**建议树形数据配合静态模式或整树返回**
- **与其他能力叠加**：固定列（缩进在 sticky 首列内正常渲染）、虚拟滚动（展开后行数变化自动传导虚拟窗口）、行选择均可组合
- **配置防御**：`tree` 非对象或 `childrenKey` 非字符串时 DEV 警告并按普通表格渲染
- **不做**：父子级联勾选、受控 expanded（程序化展开/收起 API）、详情展开行（expandable detail row，独立二期）、懒加载子树

## 受控模式（v-model）

`pageIndex` / `pageSize` / `sort` / `selectedKeys` 四个 prop（或 `defineTable` 同名字段，支持传 ref）传入即进入**受控模式**：外部是这些状态的唯一真相源，表格内部变化经既有事件（`update:page-index` / `update:page-size` / `sort-change` / `update:selected-keys`）通知父层回写——标准 v-model 闭环。缺省保持既有非受控行为，完全向后兼容。

<DemoPreview file="table-render/ControlledDemo.vue" />

```vue
<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

const pageIndex = ref(1);
const pageSize = ref(10);
const sort = ref<SortableOptions | undefined>(undefined);

const table = defineTable<User>({
  pageIndex, // 传 ref 即受控（defineTable / 拆分式 prop 均可）
  pageSize,
  sort,
  columns: [/* ... */],
});
</script>

<template>
  <TButton size="sm" @click="pageIndex = 1">外部跳页</TButton>
  <TableRender
    :definition="table"
    row-key="id"
    :page-index="pageIndex"
    @update:page-index="pageIndex = $event"
    :page-size="pageSize"
    @update:page-size="pageSize = $event"
    :sort="sort"
    @sort-change="sort = $event"
  />
</template>
```

| 受控 prop      | 同步行为                                                                                      | 事件通知                                    |
| -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `pageIndex`    | 经受控 watch 同步 TanStack（1-based，最小归 1）                                               | `update:page-index`                         |
| `pageSize`     | 同步容量；**R9 归位**：`pageIndex` 未受控时内部归位第 1 页并通知，两方都受控时由父层自行联动  | `update:page-size` / `update:page-index`    |
| `sort`         | 经排序管线应用（服务端模式归位第 1 页 + 触发重载，不漏取数）；指向不可排序列时 DEV 警告并忽略 | `sort-change`（内部交互时）                 |
| `selectedKeys` | 经 `setSelection` 写入（S5 `selectable` 过滤、S12 待定 key 语义继承）                         | `selection-change` / `update:selected-keys` |

细则：

- **传 prop 即受控**：非 `undefined` 才受控；四个 prop 可任意混用（如仅受控 `pageSize`，页码保持内部自治）
- **等值守卫**：内部先行（动作已生效）或父层回写回弹时同步为空操作——不会死循环、不会重复 onLoad
- **事件不重复**：受控模式下内部交互仍只发一次通知；受控 `pageSize` 触发的 R9 归位会额外发一次 `update:page-index`（页码归位需要让父层知道）
- **服务端模式**：受控翻页/排序按既有语义重载（每次状态变化回调 `onLoad`）；初始受控值直接决定首次取数参数，不会先取第 1 页再跳转
- **`loading` / `virtual` / `tree` 等**其余 prop 不受受控模式影响，保持既有语义

## 加载失败与错误态

服务端模式下 `onLoad` 抛错（或返回的 Promise rejects）时，表格进入**错误态**：表体区域渲染错误占位（默认 = 错误信息 + 「重试」按钮），优先于数据与空态；点击重试触发 `reload()`，**新一轮 load 开始时清除错误**。错误同时通过 `error` 投影（`Ref<Error | undefined>`）与 `load-error` 事件对外暴露，便于埋点上报。静态模式不产生错误。

<DemoPreview file="table-render/ErrorRetryDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

const table = defineTable<Order>({
  columns: [/* ... */],
  onLoad: async ({ page, update }) => {
    const res = await fetchOrders(page); // 可能 rejects
    update(res.list, res.total);
  },
});
</script>

<template>
  <!-- 默认占位 = 错误信息 + 重试按钮；#error 插槽可完全自定义 -->
  <TableRender :definition="table" row-key="id" @load-error="report" />
</template>
```

行为细则：

- **判定顺序**：loading（骨架）优先，其次 error（占位），最后才是数据/空态；load 开始时旧错误即被清除，因此 loading 期间不会闪现错误占位
- **自定义占位**：`#error` 插槽（slot props `{ error, retry }`）替换默认占位内容；`retry` 即 `reload()`
- **实例出口**：`def().error`（只读投影）与组件 `expose.error` 供程序化读取；非 Error 抛出值（字符串等）会归一化为 `Error`
- **错误占位为整表单元格**（colspan 全列，不虚拟化）；`render` 列/选择列等在错误态不渲染

## 内置列渲染器

`defineForm` 的 widget 有 `r.input()`，表格列同样有 `r`：`column.render` 声明为 `(r: ColumnRenders<T>) => ColumnRender<T>` 工厂形态——**`r` 由 `defineTable<T>` 的列类型自动推断，无需手写泛型**。5 个预设渲染器覆盖高频样板：状态映射、日期/货币格式化、序号列、操作列。

五种渲染器同台演示（含 `disabled` 逐行禁用、函数化 `text`）：

<DemoPreview file="table-render/ColumnRendersDemo.vue" />

```ts
import { columnRenders, defineTable } from "@tu-design/vue";

const table = defineTable<Order>({
  columns: [
    // 字典映射：未命中的值原样显示；条目带 variant 或 options.badge 时渲染 Badge
    {
      key: "status",
      title: "状态",
      render: (r) => r.dict({ paid: "已付款", pending: { label: "待付款", variant: "outline" } }),
    },
    // 日期：迷你令牌 yyyy MM dd HH mm ss（非法输入原样显示，不抛错）
    { key: "createdAt", title: "日期", render: (r) => r.date("yyyy-MM-dd HH:mm") },
    // 货币：Intl.NumberFormat，默认 CNY / zh-CN
    { key: "amount", title: "金额", render: (r) => r.currency("CNY") },
    // 序号：页内序号，默认从 1 起
    { key: "seq", title: "#", render: (r) => r.serial() },
    // 操作列：字符串简写或对象；onClick/disabled/text 均收到 (record, index)
    {
      key: "ops",
      title: "操作",
      render: (r) => r.button([{ text: "编辑", onClick: (row) => edit(row) }, "删除"]),
    },
  ],
});
```

| 渲染器                                                 | 签名                                     | 一句话说明                                       |
| ------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------ |
| [`dict`](#r-dict-mapping-options-—-字典映射)           | `(mapping, { badge? }?)`                 | 值→label 映射，可带 Badge 变体；未命中显示原始值 |
| [`date`](#r-date-pattern-—-日期格式化)                 | `(pattern? = "yyyy-MM-dd")`              | 令牌模板格式化；非法输入原样显示                 |
| [`currency`](#r-currency-currency-locale-—-货币格式化) | `(currency? = "CNY", locale? = "zh-CN")` | `Intl.NumberFormat` 货币格式；NaN 原样显示       |
| [`serial`](#r-serial-base-—-序号列)                    | `(base? = 1)`                            | 页内序号 `index + base`                          |
| [`button`](#r-button-items-—-操作列)                   | `(items)`                                | 操作列按钮行，支持字符串简写                     |

约定：所有渲染器返回 `(record, index, column) => VNodeChild`，与 `column.render` 同签名；需要字段值的渲染器（`dict`/`date`/`currency`）通过第三参 `column.key` 读取。与 x-render 的差异：无 `TableColumnRenders` 集合与 `$type` 标记机制（我们无列模式/视图模式切换）；`tag` 并入 `dict` 的 Badge 形态；`text` 即默认取值；`render` 就是自定义口；`image`/`progress` 二期再做。

### `r.dict(mapping, options?)` — 字典映射

条目级 variant 与整列 `options.badge` 简写、未命中原样显示：

<DemoPreview file="table-render/DictDemo.vue" />

| 参数 / 字段     | 类型                                                      | 默认 | 说明                                                                       |
| --------------- | --------------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| `mapping`       | `Record<string \| number, string \| DictEntry>`           | —    | 键为字段**原始值**，值为显示内容                                           |
| `DictEntry`     | `string \| { label: string; variant?: DictEntryVariant }` | —    | 字符串 = 纯文本；对象 = Badge 形态                                         |
| `variant`       | `"default" \| "secondary" \| "destructive" \| "outline"`  | —    | 条目级 Badge 变体（`default` 即主题色实底）                                |
| `options.badge` | `DictEntryVariant \| true`                                | —    | 整列统一 Badge 的简写；`true` 用 Badge 默认变体；**条目级 `variant` 优先** |

行为细则：

- **命中** → 显示映射文本（或 Badge）；**未命中** → 原始值原样显示（与 x-render `dict.get(value) \|\| value` 一致）；`null`/`undefined` → 空字符串
- 每行变体不同的状态列用对象条目；全部同款徽标时用 `options.badge` 省去逐条写 `variant`
- 布尔键不受支持（`Record` 键约束），请以 `0`/`1` 或字符串承载

输入 → 输出对照（以 `r.dict({ paid: "已付款" }, { badge: true })` 为例）：

| 字段原始值 | mapping 条目                              | 渲染结果                    |
| ---------- | ----------------------------------------- | --------------------------- |
| `"paid"`   | `"已付款"`                                | Badge「已付款」（默认变体） |
| `"paid"`   | `{ label: "已付款", variant: "outline" }` | Badge「已付款」（outline）  |
| `"closed"` | 未配置                                    | 原始文本 `closed`           |
| `null`     | 任意                                      | 空字符串                    |

```ts
r.dict({ paid: "已付款", pending: { label: "待付款", variant: "outline" } });
```

### `r.date(pattern?)` — 日期格式化

多令牌模板、时间戳输入、非法输入原样显示：

<DemoPreview file="table-render/DateDemo.vue" />

| 参数      | 类型     | 默认         | 说明       |
| --------- | -------- | ------------ | ---------- |
| `pattern` | `string` | `yyyy-MM-dd` | 令牌模板串 |

支持的令牌（其余字符原样输出）：

| 令牌   | 含义   | 补零 | 示例   |
| ------ | ------ | ---- | ------ |
| `yyyy` | 年     | —    | `2026` |
| `MM`   | 月     | ✓    | `01`   |
| `dd`   | 日     | ✓    | `15`   |
| `HH`   | 时(24) | ✓    | `09`   |
| `mm`   | 分     | ✓    | `05`   |
| `ss`   | 秒     | ✓    | `03`   |

行为细则：

- 输入接受 `Date`、ISO 字符串（`2026-01-15T00:00:00`）、`yyyy-MM-dd` 字符串、毫秒时间戳
- **非法输入（无法解析的字符串 / NaN 时间戳）原样显示，不抛错** —— 脏数据不会炸表格
- 内置迷你格式化实现，不引入 date-fns；需要时区、相对时间等复杂格式请用自定义 `render`

输入 → 输出对照（`pattern = "yyyy-MM-dd"`）：

| 字段原始值                    | 渲染结果        |
| ----------------------------- | --------------- |
| `new Date(2026, 0, 15)`       | `2026-01-15`    |
| `"2026-01-15T00:00:00"`       | `2026-01-15`    |
| `"2026-01-15"`                | `2026-01-15`    |
| `1768435200000`（毫秒时间戳） | `2026-01-15`    |
| `"明天"`（无法解析）          | 原样显示 `明天` |

```ts
r.date(); // "2026-01-15"
r.date("yyyy/MM/dd HH:mm"); // "2026/01/15 09:05"
```

### `r.currency(currency?, locale?)` — 货币格式化

默认 CNY、自定义 USD/en-US、数字字符串与脏数据：

<DemoPreview file="table-render/CurrencyDemo.vue" />

| 参数       | 类型     | 默认    | 说明                      |
| ---------- | -------- | ------- | ------------------------- |
| `currency` | `string` | `CNY`   | ISO 4217 币种代码         |
| `locale`   | `string` | `zh-CN` | Intl 地区（决定符号位置） |

行为细则：

- 等价 `new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)`，输出如 `¥1,234.50`、`$1,234.50`
- 输入接受数字或数字字符串（`"1234.5"` 会被 `Number()` 转换）；**NaN / 非数字原样显示**
- 依赖运行时的 `Intl.NumberFormat`（现代浏览器均支持）

输入 → 输出对照（默认 CNY / zh-CN）：

| 字段原始值   | 渲染结果    |
| ------------ | ----------- |
| `1234.5`     | `¥1,234.50` |
| `"1234.5"`   | `¥1,234.50` |
| `0`          | `¥0.00`     |
| `Number.NaN` | 原样显示    |
| `"一万"`     | 原样显示    |

```ts
r.currency(); // ¥1,234.50
r.currency("USD", "en-US"); // $1,234.50
```

### `r.serial(base?)` — 序号列

默认与 `base=0` 两种起始序号（分页可翻看页内重计数）：

<DemoPreview file="table-render/SerialDemo.vue" />

| 参数   | 类型     | 默认 | 说明     |
| ------ | -------- | ---- | -------- |
| `base` | `number` | `1`  | 起始序号 |

行为细则：

- 显示 `index + base`；**翻页后从 `base` 重新计数（页内序号）**——跨页连续序号需要总行数偏移，属二期
- 不读取字段值，`key` 可为任意占位（如 `"seq"`）

### `r.button(items)` — 操作列

字符串简写、函数化 text、逐行 disabled 与 onClick：

<DemoPreview file="table-render/ButtonDemo.vue" />

| 字段        | 类型                                    | 默认   | 说明                                         |
| ----------- | --------------------------------------- | ------ | -------------------------------------------- |
| `items`     | `Array<string \| TableActionButton>`    | —      | 按钮序列；**字符串简写等价 `{ text }`**      |
| `text`      | `string \| ((record, index) => string)` | —      | 按钮文本，支持按行定制                       |
| `onClick?`  | `(record, index) => void`               | —      | 点击回调（**不含事件对象**，见下方注意事项） |
| `variant?`  | `ButtonVariants["variant"]`             | `link` | 沿用 Button 组件全部变体                     |
| `disabled?` | `(record, index) => boolean`            | —      | 逐行求值，返回真即渲染原生 `disabled`        |

行为细则：

- 渲染为 `flex items-center gap-1` 的按钮行，`size="sm"`；**空数组渲染为空字符串**（不产生节点）
- 点击回调只携带 `(record, index)`；点击会**冒泡触发行 `row-click`**（行点击绑在 `<tr>` 上）——操作列与行点击并存时，请在 `row-click` 处理器里排除操作列来源，或对操作列所在表格不启用 `row-click`
- 空数组与全禁用是有意支持的合法形态（权限收敛后常整列禁用/隐藏）

```ts
r.button([
  { text: "编辑", onClick: (row) => edit(row) },
  { text: (row) => (row.locked ? "已锁定" : "解锁"), disabled: (row) => row.locked },
  "删除", // 简写，等价 { text: "删除" }
]);
```

### 自定义渲染器

进度条自定义工厂（SFC 内以 `h()` 实现，等价文档中的 TSX 写法）：

<DemoPreview file="table-render/CustomRenderDemo.vue" />

内置渲染器覆盖不到的形态（比如带确认弹窗的操作、进度条、头像组），直接写同签名的函数即可，内置与自定义可以逐列混用：

```tsx
// progress-column.tsx —— JSX 写法（Vue JSX 用 class 而非 className）
// 前置：项目需启用 JSX 转换，Vite 下为 @vitejs/plugin-vue-jsx
import type { TableColumnOptions } from "@tu-design/vue";

interface Task {
  name: string;
  percent: number;
}

// 自定义工厂与内置渲染器同一签名：(record, index, column) => VNodeChild
function progressColumn(warnBelow = 30): TableColumnOptions<Task>["render"] {
  // r.render 是自定义渲染器逃逸口（对齐 x-render renderRenderColumn）
  return (r) => r.render((record) => (
    <div class="flex items-center gap-2">
      <div class="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          class={[
            "h-full rounded-full",
            record.percent < warnBelow ? "bg-destructive" : "bg-primary",
          ]}
          style={{ width: `${record.percent}%` }}
        />
      </div>
        <span class="text-xs tabular-nums">{record.percent}%</span>
      </div>
    );
  });
}

// 逐列混用：自定义与内置渲染器并存
const table = defineTable<Task>({
  columns: [
    { key: "name", title: "任务" },
    { key: "percent", title: "进度", render: progressColumn() }, // 自定义
    { key: "status", title: "状态", render: (r) => r.dict({/* ... */}) }, // 内置
  ],
});
```

选择顺序建议：**能 `formatter` 就不 `render`**（纯文本格式化走取值链更轻）；格式化不够了再上内置渲染器；内置也不够才手写 `render`。三者优先级：`render` > `formatter` > `record[key]`。

### 常见问题

- **为什么我的布尔枚举映射不生效？** —— `Record` 的键约束不支持 `boolean`，把字段规整为 `0`/`1` 或字符串（`"true"`/`"false"`）再配 `dict`。
- **点了操作列按钮，行点击也触发了？** —— 行点击绑在 `<tr>` 上，按钮点击会冒泡；操作列与 `row-click` 并存时需在行点击处理器中区分来源（事件目标是否在操作列单元格内）。
- **`onClick` 能拿到事件对象吗？** —— 不能，回调签名是 `(record, index)`。这是有意收敛：需要事件的特殊场景请用自定义 `render` 完全接管。
- **`date` 的时区行为是什么？** —— 走浏览器本地时区解析与显示；服务端返回 UTC 字符串且需要固定时区展示时，请先在自己的数据层转换为目标时区的 `Date`。
- **`serial` 翻页后重头计数正常吗？** —— 正常，这是页内序号的设计语义；跨页连续序号需要总行数偏移，属二期。
- **金额带千分位但想要 `1,234.50`（无货币符号）？** —— `currency` 固定走货币格式；纯千分位请自定义 `render` 用 `Intl.NumberFormat({ style: "decimal" })`。

## 注意事项

- **须在 `setup` 中调用 `defineTable`**：TanStack `useVueTable` 依赖组件挂载。拆分式 props 则无此限制（内核在 TableRender 内部创建）。
- **两种模式互斥**：同时传 `onLoad` 与 `data` 时按服务端模式处理，并在 DEV 下给出警告。
- **`onLoad` 抛错不会打断表格**：内部 `console.error` 并保持空态，请在自己的 `onLoad` 里做错误提示。
- **竞态已内置**：同一表格的多次取数带序号守卫，先发后到的旧响应不会覆盖新结果，无需自行 debounce（但也不会替你做节流）。
- **排序改的是页码**：服务端模式下切换排序会自动回到第 1 页；`setPageSize` 同样归位第 1 页。
- **`rowKey` 字段缺失**时按行索引兜底，并在 DEV 下警告一次（仅一次，不会刷屏）；但**行选择场景例外**：rowKey 无效时禁用选择而非兜底（S1，索引作行 id 会跨页串选）。
- **固定列需要数字 `width`**：`fixed` 列缺数字宽度时 DEV 警告并按普通列渲染（sticky 偏移无法从字符串/百分比宽度推算）；固定列是纯渲染层 sticky，不写 TanStack pinning 状态。
- **虚拟滚动需要 `height`**：`virtual: true` 缺容器高度时 DEV 警告并降级普通渲染；大分页（如 `pageSize: 10000`）配合虚拟化使用，避免窗口外行进入 DOM。
- **树形数据的展开是纯客户端状态**：children 随行数据返回即可；`tree` 配置无效（非对象 / `childrenKey` 非字符串）时 DEV 警告并忽略。父子级联勾选、受控 expanded、详情展开行属二期。
- **`ellipsis: "tooltip"`**：单元格改用库内 Tooltip（悬停显示完整文本），不再设置原生 `title`；`render` 工厂列同样支持（VNode 经 cloneVNode 复制进 Tooltip，交互保持）；树形缩进列暂不支持 tooltip 形态（请用 `ellipsis: true`）。
- **错误态仅服务端模式产生**：静态模式（`data`）不产生 `error`；`#error` 插槽可完全自定义占位，重试即 `reload()`。
- **DEV 兜底提示**：`columns` 为空、`data` 非数组、`defaultSort` 未配 `sortable`、`search` 用于静态模式等都会在控制台提示并降级运行；生产构建静默。
- 二期规划：列显隐、列宽拖拽、导出、编辑态、`image`/`progress` 渲染器、跨页连续序号。
