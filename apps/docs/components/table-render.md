---
title: TableRender 表格渲染器
description: 配置驱动的表格渲染器，defineTable 一步聚合列定义、分页排序与数据内核，支持本地/服务端分页、本地筛选、行选择、固定列、虚拟滚动与树形数据。
---

# TableRender

配置驱动的表格渲染器：`defineTable<T>()` 一步完成「列定义 + 分页排序状态 + 数据内核」，`<TTableRender>` 负责语义化 `<table>` 渲染与分页条。基于 **TanStack Table** 管理分页/排序状态机，页码导航复用 **Ark UI Pagination** 原语，样式走 Tailwind tokens。

两种数据模式由 `onLoad` 决定：**静态模式**（传 `data`）本地分页与排序；**服务端模式**（传 `onLoad`）把分页/排序交还数据源，每次状态变化都以新参数回调取数。数据协议与 [x-render table-render](https://github.com/alibaba/x-render) 同构，迁移成本低。

| 适用                                            | 不适用                         |
| ----------------------------------------------- | ------------------------------ |
| 列多、要排序分页的列表页（省约 60 行/表的样板） | 结构特殊、单元格重度定制的页面 |

安装：

```bash
npx @tu-design/cli add table-render
```

会自动安装 `@tanstack/vue-table` 与 `@ark-ui/vue`。

## 基础用法

`defineTable` 须在组件 `setup` 中调用（TanStack `useTable` 依赖组件挂载），返回值直接传给 `:definition`：

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
  <TTableRender :definition="table" row-key="id" />
</template>
```

## 本地分页与本地筛选

`data` 支持数组、`ref` 或 getter：数据变化会自动同步进引擎，排序与分页全部在本地完成。筛选建议使用外置 `defineForm` + `TFormRender`（`defineTable.search` 仅服务端模式生效），提交后替换/重算数据源即可；默认 `autoResetPageIndex: true` 会归位第 1 页。

<DemoPreview file="table-render/LocalFilterTableDemo.vue" />

选择判据：

- **本地分页**：数据已在前端（或一次性拉全量）、几千行以内；筛选/排序即时，不发请求。
- **服务端模式**：数据量大、筛选/排序需要服务端参与，或需要服务端分页统计。
- 本地分页会保留全量行；万行级请改用服务端，或使用大 `pageSize` + `virtual`（虚拟化只作用于当前页窗口）。
- **不要同时传 `onLoad`**：当前 `onLoad` 即服务端模式（引擎不做本地分页/排序）。"异步拉全量再本地分页"请用 `data: ref/getter` + 外部 fetch（如本示例），二者语义等价且无需新开关。

要点：

- `page.total` 在静态模式等于**引擎可见行数**（树形默认含展开子行，随展开/收起变化）；服务端模式仍为 `update(data, total)` 回写的总数。
- `page.pageCount` 为派生总页数（静态 = `ceil(可见行数/pageSize)`，服务端 = `ceil(total/pageSize)`），分页条可见性与页码窗口以它为准。
- 改每页条数默认归位第 1 页；`resetPageOnPageSizeChange: false` 沿用 TanStack v9 "保持首行"语义。
- `pageSize` 不在 `pageSizeOpts` 时，分页条下拉会自动补齐当前值。
- 静态模式数据引用变化默认回第 1 页；`autoResetPageIndex: false` 可保持当前页（仅在越界时钳到有效页）。
- 静态模式异步取数可传 `loading`（骨架）与 `error`（错误占位），例如 `defineTable({ data: rows, loading, error })`。
- 分页条在首帧/数据到达前按单页自隐藏，数据到达后出现；需要固定底部高度时请给容器预留空间（骨架只占位表格区）。

## 服务端模式

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
  <TTableRender :definition="table" row-key="id" @row-click="onRowClick" />
</template>
```

`update(data, total?)` 是回写数据的唯一入口：表格自身不发请求，请求库（axios / ofetch / TanStack Query…）完全由调用方决定。

## 搜索表单联动

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
  <TTableRender :definition="table" row-key="id" @search="onSearch" @reset="onReset" />
</template>
```

行为细则：

- **仅服务端模式生效**：`onLoad` 才有取数时机；静态模式（`data`）传入 `search` 时 DEV 警告并忽略（不做本地过滤）
- **校验先行**：「搜索」走 FormRender 完整校验流（`schema` 可选），校验失败不发 search 也不取数
- **重置即重载**：FormRender 将表单重置为 `items.default`（未配 `default` 的字段为 `null`）后，表格归位第 1 页重载；重置后的 defaults 会随 `onLoad` 下发
- **事件转发**：`search` / `reset` 事件携带当前表单值快照（`(values) => void`），便于上报埋点或同步外部状态
- **双模式装配**：`defineTable({ search })`（聚合式）或 `<TTableRender search>` prop（拆分式）皆可；两者同传时 definition 优先并 DEV 警告。definition 未配置时 prop 回填生效（与 rowSelection 的「聚合式忽略」不同）
- **按钮预设跟随**：`defineForm({ searchable: true })` 配置的 `actions` 存在时，内置搜索区跟随 actions 渲染按钮；`actions.searchable: false` → 内置区只渲染字段无按钮——「字段区在表格上方、按钮外置」的合法布局，查询走外置按钮 + `table.reload(true)`
- **`onSubmit` 纪律**：reload 归表格层（内置区点击 → 归位第 1 页重载，或组合式外置按钮），`onSubmit` 只做业务副作用（携带值上报等）；`defineForm({ onSubmit: () => table.reload(true) })` 的前引闭包虽合法但会双 onLoad，标为反例
- **不做**：查询按钮 loading、搜索区布局自定义插槽、`v-model` 受控——需要时先取 `search.form` 自行扩展

按钮预设示例——按钮配置随 definition 走，内置搜索区自动跟随（含缺省跟随的重置按钮），组件侧零 props：

```vue
<script setup lang="ts">
import { defineForm } from "@tu-design/vue";

const search = defineForm({
  items: [/* ... */],
  searchable: true, // actions 进 definition：搜索 + 重置按钮由内置搜索区渲染
});
</script>

<template>
  <TTableRender :definition="table" row-key="id" />
</template>
```

## 拆分式

不想（或不能）在 `setup` 里建内核时，可直接把配置拆成 props（`definition` 优先，存在时忽略其余）：

```vue
<TTableRender row-key="id" :columns="columns" :data="users" />
```

<DemoPreview file="table-render/SplitUsageDemo.vue" />

## 组合式布局（Form / Pagination 拆分组装）

复杂布局（如左侧搜索面板 + 表格撑满 + 独立分页条贴底）可在 `defineTable` 返回的 definition 上直接取三个消费面自行组装，布局完全归你的 DOM：

- **table**：`<TTableRender :definition>` 传 `show-search="false"` / `show-pagination="false"` 关闭对应内置区（数据链路不变，`onLoad` 的 `form` 仍自动携带表单值）；
- **form**：`definition.search` 是标准 FormRender definition，任意位置渲染（窄容器 + 小 `min-width` 即单列面板）；
- **pagination**：`<TTablePagination :definition>` 自动接线分页状态与动作，`show-total` / `show-size-select` / `nav-mode` 裁剪形态；definition 模式下单页自隐藏。

<DemoPreview file="table-render/CompositionDemo.vue" />

```vue
<script setup lang="ts">
import { defineForm, defineTable } from "@tu-design/vue";

const search = defineForm<{ keyword: string }>({
  items: [{ key: "keyword", title: "关键词", default: "" }],
});

const table = defineTable<Order>({
  columns: [/* ... */],
  search,
  onLoad: query, // params.form 自动携带 search 表单当前值
});

// 查询/重置链路：submit() 返回校验是否通过，通过才归位第 1 页重载
async function onSearch() {
  if (await table.search?.submit()) table.reload(true);
}
function onReset() {
  table.search?.resetToDefaults();
  table.reload(true);
}
</script>

<template>
  <div class="flex gap-3">
    <aside class="w-52 shrink-0 space-y-3">
      <TFormRender v-if="table.search" :definition="table.search" :min-width="200" />
      <TButton class="w-full" @click="onSearch">查 询</TButton>
      <TButton variant="outline" class="w-full" @click="onReset">重 置</TButton>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <TTableRender
        class="flex-1"
        :definition="table"
        row-key="id"
        :show-search="false"
        :show-pagination="false"
      />
      <TTablePagination :definition="table" :show-size-select="false" nav-mode="icon" />
    </div>
  </div>
</template>
```

注意：

- **`FormRenderDefinition` 新增必选 `submit()`（破坏性变更）**：自行手搭 definition 字面量（绕过工厂）的场景请改用 `defineForm` 统一产出（`items` / `form` / `resetToDefaults` / `submit`）；
- `show-search="false"` 后 `search` / `reset` 事件不再有内置触发源（二者由内置搜索区触发）——查询/重置的 reload 由外层按钮负责；
- `TTablePagination` 也可脱离 definition 手动传 `page-index` / `page-size` / `total` + `@update:page-index` / `@update:page-size` 使用（此时恒渲染，可见性自理；definition 与手动 props 同传时 definition 优先）；
- `definition.page` 是 reactive 投影，勿顶层解构——模板中保持 `table.page.pageIndex` 形式访问。

### TTablePagination API

`TablePagination` 已随 TableRender 一并公开，可在组合式布局中独立使用：

| prop             | 类型                    | 默认     | 说明                                                                                        |
| ---------------- | ----------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `definition`     | `TableRenderDefinition` | —        | 组合式自动接线：状态取 `definition.page`、动作接 `setPageIndex` / `setPageSize`；单页自隐藏 |
| `pageIndex`      | `number`                | —        | 手动模式当前页（1-based）                                                                   |
| `pageSize`       | `number`                | —        | 手动模式每页条数                                                                            |
| `pageSizeOpts`   | `number[]`              | —        | 手动模式每页条数选项                                                                        |
| `total`          | `number`                | —        | 手动模式总条数                                                                              |
| `showTotal`      | `boolean`               | `true`   | 「共 N 条」                                                                                 |
| `showSizeSelect` | `boolean`               | `false`  | 条/页 select                                                                                |
| `navMode`        | `"text" \| "icon"`      | `"text"` | 上一页/下一页形态：文字按钮或 chevron 图标                                                  |

事件：`update:page-index` / `update:page-size`——两种模式恒触发（动作幂等，重复回调无害）。definition 模式下若分页受控，非动作路径（越界钳制/自动归位）的投影变化也会 emit。组件根为 `flex justify-between p-2` 布局，**不带** `border-t`（位置样式归使用方；表格与分页条之间的分隔线由表格底线承担：`bordered` 外框 / `bottom-bordered`）。

模式语义：`definition` 与手动 props 同传时 definition 优先并 DEV 警告；仅手动时 `pageIndex` / `pageSize` / `total` 齐备才渲染（缺关键项 DEV 警告），且恒渲染、可见性由使用方控制。

手动模式示例（可见性自行控制）：

```vue
<TTablePagination
  v-if="(table.page.pageCount ?? Math.ceil(table.page.total / table.page.pageSize)) > 1"
  :page-index="table.page.pageIndex"
  :page-size="table.page.pageSize"
  :page-size-opts="table.page.pageSizeOpts"
  :total="table.page.total"
  show-size-select
  @update:page-index="table.setPageIndex"
  @update:page-size="table.setPageSize"
/>
```

半组合形态——只外置搜索表单，分页仍走内置（单页隐藏、列设置等内置行为全部保留）：

```vue
<TFormRender
  :definition="table.search"
  :min-width="200"
  @search="() => table.reload(true)"
  @reset="() => table.reload(true)"
/>
<TTableRender :definition="table" row-key="id" :show-search="false" />
```

## 行选择

开启 `rowSelection` 即注入首列选择列。**单选/多选同一入口**：`"radio"` / `"checkbox"` 字符串简写，或对象详写。批量操作示例见下方演示。

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
  <TTableRender :definition="table" row-key="id" @selection-change="onSelectionChange" />
</template>
```

### `rowSelection` 配置

| 字段                   | 类型                     | 默认   | 说明                                           |
| ---------------------- | ------------------------ | ------ | ---------------------------------------------- |
| `type`                 | `"radio" \| "checkbox"`  | —      | radio 单选互斥，checkbox 多选                  |
| `width?`               | `number`                 | `48`   | 选择列宽                                       |
| `selectable?`          | `(record: T) => boolean` | —      | 行级可选过滤；`false` 的行控件置灰且被全选跳过 |
| `cancelable?`          | `boolean`                | `true` | radio 再点已选行是否取消                       |
| `reserveOnPageChange?` | `boolean`                | `true` | 翻页/数据重载后是否保留选中                    |

### 设置默认选中值

`rowSelection` 没有 `defaultSelection` 配置项——默认选中走程序化出口 `setSelection(keys)`，在 `onMounted` 中预置即可（「行选择」演示中的两块表格均带默认选中）：

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
- **服务端模式**：首屏数据由 `onLoad` 异步回写，预置须等数据到达后执行——在 `onLoad` 的 `update` 回调里判断“仅首次”后调用 `setSelection`（键先落选中集，窗口索引刷新后 `selection.value` 解析为完整行）

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

- `setSelection` 允许传入当前数据中不存在的 key：既不在当前窗口也未驻留的 key 收窄为桩对象（`{ [rowKey]: key }`），**不参与 `selectable` 过滤**；`selectable` 只过滤能解析到行对象的 key
- radio 型预置多个 key 时只有最后一个生效（单选互斥）

行为细则（S 系列，编号对应设计文档 `docs/plans/table-selection-plan.md`）：

- **rowKey 是硬依赖**：rowSelection 启用但 rowKey 无效时 DEV 警告并禁用选择——组件内部以 `String(row[rowKey])` 作为行 id，缺失会跨页串选，不做索引兜底
- **全选是本页语义**：表头 checkbox 三态（全选/半选/未选）只作用于当前页的可选行，不选中未加载的行
- **跨页保留**：`reserveOnPageChange: true`（默认）时翻页/`update()` 重载不清空选中；`selection.value` 的行对象按 **当前数据窗口 → 已驻留的选中行 → 桩对象** 三级解析——窗口内的行取最新数据，跨页行沿用驻留对象（**可能是过期数据**），既不在窗口也未驻留的 key 返回仅含 rowKey 的桩对象（`{ [rowKey]: key }`）
- **radio 默认可取消**：再点已选行取消选中；`cancelable: false` 时该交互为空操作（程序化 `clearSelection` 不受限）
- **选择不冒泡**：点击选择控件不会触发行 `row-click`；`selection-change` / `update:selected-keys` 仅在选中键集变化时发出，排序/翻页/同页重载（键集不变）不触发，`selection.value` 仍随数据刷新
- **受控**：`update:selected-keys` 事件支持外部回写选中集；程序化出口 `setSelection(keys)` 允许暂不存在的 key（桩对象语义）、并过滤不可选行

### rowKey 重复告警

行标识与行选择以 `rowKey` 为准，重复值会让两行争用同一身份。DEV 下按**单批（单次数据窗口）**查重：

- 只在同一批数据内比对重复（覆盖树形子行，递归 `childrenKey`），**不做跨批次/跨页比对**——服务端分页视野独立，跨加载比对必然误报
- 同一重复集只上报一次（按重复集签名去重）：reload/翻页返回相同重复值时不刷屏，重复集变化才再次提示
- 告警文案：`[tu-design] <TableRender> rowKey "id" 存在重复值（2 条，例如 "1"、"2"），行标识与行选择以后出现的记录为准。`（最多列举前 3 个）
- 生产构建静默；未启用 `rowSelection` 时仍做批内查重（数据身份问题与选择无关）
- 缺 `rowKey` 字段的记录不参与查重，也不进入窗口索引（行选择场景下退化为桩对象）

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
    <TTableRender :definition="table" row-key="id" />
  </div>
</template>
```

行为细则：

- **offset 累计**：`fixed: "left"` 列偏移 = 之前所有 fixed-left 列宽之和（有选择列时先累加选择列宽 48）；`fixed: "right"` 从最右列反向累计。纯渲染层 computed，不写 TanStack pinning state
- **呈现分层**：sticky 单元格统一 `bg-background`（防滚动透出）；表头 z-index（20）高于表体（10）；每个 sticky 组朝滚动方向的交界列加分隔边框（左组 `border-r`、右组 `border-l`）
- **滚动容器**：`<table>` 外层的 `overflow-x-auto` 容器始终存在（分页条不参与横向滚动）；固定列只是 sticky 定位，不引入 `table-fixed`
- **列宽硬约束**：可见列数字 `width` 之和（含选择列）作为 `<table>` 的 `min-width` 下限——容器不足时表格被顶到列宽之和，横滚出现且**列渲染宽度 == 指定值**、sticky 偏移精确成立；容器充足时表格仍 100% 铺满（有宽列可能被拉伸，sticky 偏移按指定值累计的漂移为既有限制）；字符串 `width` 仅渲染提示值，不参与求和与 sticky；全列无数字 width 时和为 0 不挂，行为不变（≥10 列此配置 DEV 提示一次）。数字 `width` 以 `px` 单位渲染为真实 inline 硬约束
- **骨架同构**：加载骨架行的固定列同 sticky 同偏移；空态行是横跨全列的单单元格，不参与 sticky
- **不做**：纵向 sticky 表头、滚动位置动态阴影、`table-fixed`/`<colgroup>` 确定性列布局、TanStack pinning 状态接入

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
  <TTableRender :definition="table" row-key="id" />
</template>
```

行为细则：

- **height 必填**：`virtual: true` 但缺 `height` 时 DEV 警告「virtual 需要配置 height」并降级普通渲染；数字按 px，字符串（`"50vh"`）原样作为容器高度
- **仅表体纵向滚动**：滚动容器由组件接管（`virtual` 模式下外层容器获得 `height` + `overflow-y: auto`，横向滚动能力保留，分页条不参与滚动）；表头 sticky 钉住滚动容器顶部（不随内容滚走），与 `fillHeight` 模式共用同一套表头钉住机制
- **scrollMargin 前缀**：表头在滚动容器内占据的前缀高度会在挂载后测量并作为 `scrollMargin` 传入虚拟化，窗口计算以表体坐标系为准
- **交互保持**：`row-click`、行选择（radio/checkbox）、`ellipsis`、`render` 列、固定列 sticky 在虚拟行下行为不变；行高动态测量，无需配置固定行高
- **骨架与空态不虚拟化**：loading 骨架行与空态行保持普通渲染
- **不做**：表头虚拟化、横向虚拟、树形行虚拟展开

## 填充模式（fillHeight）

`fill-height` 开启填充模式：组件根容器 `h-full` 纵向 flex 布局，滚动区 `flex-1` 内滚，表头 sticky 钉住——表格填满外部容器、内部滚动（搜索区/分页条不参与滚动）。适合「表格填充外部容器」的页面布局。

**父链需有确定高度**（如页面布局的 `.table-body`）：`h-full` 依赖父链逐级传递高度；无确定高度时安全退化为自然高度（无危害）。

<DemoPreview file="table-render/FillTableDemo.vue" />

```vue
<template>
  <div class="flex h-full flex-col">
    <div class="table-body min-h-0 flex-1">
      <TTableRender :definition="table" row-key="id" fill-height />
    </div>
  </div>
</template>
```

行为细则：

- **显式 prop 优先于布局 provide**：`fillHeight` 未传时读取布局上下文 provide（见下方协议）；显式传 `false` 可强制关闭 provide 效果
- **表头 sticky**：th 获得不透明底 + 底部分隔线（钉住后行内容不透出）；表格切换分离边框模型（`border-separate`），规避 `border-collapse: collapse` 下 sticky 表头边框在 Chrome 中丢失的问题；普通模式保持 collapse；表体行分隔线统一画在单元格（`td border-b`）上，分离边框模型下同样生效（tr 边框在分离模型下按 CSS 规范不渲染）
- **setup 期定版**：不支持运行时切换（与 `virtual` / `search` 同约定）；纯布局属性，不进 `defineTable` 配置
- **与 `virtual` 同传**：以 fill 优先——滚动区交给 flex 分配高度，`height` 不再生效；且 `virtual` 无需显式 `height`（fill 模式自带真实滚动盒）

### 布局 provide 协议

页面布局容器可 provide 布尔值，使 slot 内所有 TableRender 自动进入填充模式（字符串 key 跨包约定，tu-design 对消费方零依赖）：

| 项      | 值                                                                                    |
| ------- | ------------------------------------------------------------------------------------- |
| key     | `tu-design:page-table-fill`（常量 `PAGE_TABLE_FILL_KEY`，可从 `@tu-design/vue` 导入） |
| payload | `boolean`                                                                             |
| 语义    | 此容器内的 TableRender 应填满容器、内部滚动、表头固定                                 |
| 优先级  | 显式 `fillHeight` prop > provide > `false`                                            |

```vue
<script setup lang="ts">
import { provide } from "vue";

provide("tu-design:page-table-fill", true);
</script>
```

## 边框与条纹

正交边框模型（词汇与语义对齐 naive-ui data-table）：`bordered` 仅控制外框，网格线由 `single-column` / `single-line` 独立开关，属性间零耦合、零优先级规则。所有边框线画在单元格（`th`/`td`）与 `table` 元素上——`border-collapse: collapse` 与 `border-separate`（fill/virtual sticky 表头）两种边框模型均渲染，`tr` 上不画线。

| 属性              | 默认    | 说明                                                                                                           |
| ----------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `bordered`        | `true`  | 表格外框。默认开启为 0.6.0 起的观感变化，`:bordered="false"` 可关闭                                            |
| `bottom-bordered` | `true`  | 表格底部边框（仅 `bordered: false` 时有意义；`bordered` 外框已含底边）                                         |
| `single-column`   | `false` | `true` 时不设定行的分割线（单元格无下边线）；表头底线不受影响（可读性硬底线）                                  |
| `single-line`     | `true`  | `true` 时不设定列的分割线（单元格无右边线）；全网格 = `:single-line="false"`                                   |
| `striped`         | `false` | 斑马线条纹，按**当前页显示位次**奇偶——排序/翻页后仍交替，虚拟滚动窗口滑动不漂移；sticky 列同步换不透明条纹底色 |

### 画线落位纪律

- **行线**：`td` 的 `border-b`，末行经 `tbody` 选择器置 0；**底线**：`table` 的 `border-b`（或外框含底边）——表格与内置分页条之间的分隔线由底线承担，分页条不再自带 `border-t`，像素位置重合；
- **列线**：`th`/`td` 的 `border-r`，行末排除（右缘归外框）；多级表头分组格的分隔线是**结构性硬边界**，不受 `single-line` 影响；
- **外框**：`table` 的 `border`；与固定列 sticky 交界线协同——列线开启时交界线由统一列线绘制，不会出现双线；
- **条纹**：`tr` 层 `bg-muted/30`，sticky 列单元格换 `color-mix` 不透明固色（保持防滚动透出）；
- **骨架行**：跟随行线/列线开关（默认形态骨架行有行线）；空态/错误态 colspan 单格由外框与底线在 `table` 层闭合。

### 已知限制

- 横向滚动时外框左右边随内容滚出视口（外框画在 `table` 元素上）；
- `fillHeight` + 稀疏内容时，分页条与表格底线之间留有空隙（底线贴内容而非贴分页条）。

### 迁移说明（自 0.6.0）

默认形态变化：① 表格默认新增外框；② 无分页/单页自隐藏时底部新增闭合线；③ 骨架行新增行线；④ 底线归属从分页条 `border-t` 转移到表格底线（分页条可见场景像素位置重合）。**主回退配方：`:bordered="false"`**——分页条可见场景逐像素还原旧观感；无分页场景会多一条底部线，可再加 `:bottom-bordered="false"` 去除（此时分页场景将以无分隔线呈现，二者不可兼得）。外置 `TTablePagination` 的使用方建议传 `:bottom-bordered="false"` 避免与表格底线叠成双线。

<DemoPreview file="table-render/BorderTableDemo.vue" />

## 树形数据

`tree` 配置开启树形数据（父子行）：子行字段默认 `children`，展开按钮（caret）位于**首个业务列单元格内**（对齐 antd/element 习惯，不加独立列），按 `depth × indentSize`（默认 16px）层级缩进。首列**恒左对齐**：caret 占据固定 16px 槽位（叶子行以等宽占位补齐），同层级标签左边缘严格对齐。底层走 TanStack expanded 行模型——展开后的子行进入当前页行序列，分页/选择/排序语义不变。

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
  <TTableRender :definition="table" row-key="id" />
</template>
```

### `tree` 配置

| 字段                    | 类型      | 默认         | 说明                                                   |
| ----------------------- | --------- | ------------ | ------------------------------------------------------ |
| `childrenKey?`          | `string`  | `"children"` | 子行字段名                                             |
| `defaultExpandAll?`     | `boolean` | `false`      | 初始是否全部展开                                       |
| `indentSize?`           | `number`  | `16`         | 每层缩进 px                                            |
| `paginateExpandedRows?` | `boolean` | `true`       | 展开子行是否参与分页；`false` 时子行始终跟随父行所在页 |

行为细则：

- **展开按钮在首列内（槽位固定）**：`getCanExpand()` 的行渲染 caret（`aria-expanded` + 展开态旋转），叶子行渲染**等宽占位**（`aria-hidden`、无文本）；缩进按 `depth × indentSize` 叠加在槽位外侧，含首层在内所有层级都预留槽位——caret 始终成列，同层级标签左边缘（`depth × indentSize + 20px`）对齐
- **首列恒左对齐**：树形首列由组件强制 `left`（覆盖该列 `align`），表头首列与加载骨架行同口径；暂不提供居中/右对齐开关
- **点击隔离**：caret 点击已阻断冒泡，不会误触发 `row-click`；展开/收起是纯客户端状态，不触发取数
- **子行参与分页/选择**：默认 `paginateExpandedRows: true`——展开后的子行与父行共享页码序列（可能被拆到下一页），`total/pageCount` 按展开后的可见行计算；`false` 时先分页再展开，子行始终跟随父行所在页，单页渲染行数可超过 `pageSize`，`total/pageCount` 按顶层行计算
- **子行选择**：展开后的子行是当前页行序列的独立行——`selection-change`/全选含展开子行；**不做父子级联勾选**（勾父带子/半选态），受控 `expanded` 与详情展开行暂不支持
- **服务端模式**：children 随行数据返回、展开为纯客户端状态；翻页/排序重取后展开态会被 TanStack autoReset 重置（收起），**建议树形数据配合静态模式或整树返回**
- **与其他能力叠加**：固定列（缩进在 sticky 首列内正常渲染）、虚拟滚动（展开后行数变化自动传导虚拟窗口）、行选择均可组合
- **配置防御**：`tree` 非对象或 `childrenKey` 非字符串时 DEV 警告并按普通表格渲染
- **升级注意**：树形首列此前随列 `align` 居中，现恒左对齐且标签起点右移 20px（含首层）；首列显式写的 `align` 对该列不再生效，需要居中观感的场景暂不支持
- **不做**：父子级联勾选、受控 expanded（程序化展开/收起 API）、详情展开行（expandable detail row）、懒加载子树

## 行拖拽排序

`draggable: true`（或对象配置）开启行拖拽排序：表体新增**把手列**（grip 图标，紧随选择列），仅把手可起拖（整行不可拖，不与 `row-click`/文本选择/单元格按钮冲突），**仅当前页内**拖拽。底层为原生 HTML5 DnD，零第三方依赖；不支持触屏（桌面管理后台场景）。

<DemoPreview file="table-render/DragSortDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable, type TableDragSortPayload } from "@tu-design/vue";
import { ref } from "vue";

const data = ref(apps);

const table = defineTable<App>({
  data,
  rowKey: "id",
  draggable: true, // 或 { draggable: (record) => record.editable, width: 40 }
  columns: [/* ... */],
});

function onDragSort(payload: TableDragSortPayload<App>) {
  // payload: { from, to, record, rows } —— from/to 为页内 0-based 索引，rows = 当前页新行序
  // 静态模式：引擎已先行重排内部数据，调用方应回写自身数据源（典型：按新行序重算 weight 批量提交）
  data.value = payload.rows.map((row, index) => ({ ...row, weight: (index + 1) * 10 }));
}
</script>

<template>
  <TTableRender :definition="table" row-key="id" @drag-sort="onDragSort" />
</template>
```

### `draggable` 配置

| 字段         | 类型                     | 默认 | 说明                                                                    |
| ------------ | ------------------------ | ---- | ----------------------------------------------------------------------- |
| `draggable?` | `(record: T) => boolean` | —    | 行级可拖过滤（对齐选择列 `selectable` 范式）；返回 `false` 的行把手置灰 |
| `width?`     | `number`                 | `32` | 把手列宽（px）；非数字时 DEV 警告并按默认处理                           |

### `drag-sort` 事件

仅**成功落位**（drop）时触发；取消路径（Esc / 拖出窗外 / 同源落位）不发。载荷 `TableDragSortPayload<T>`：

| 字段     | 类型     | 说明                                       |
| -------- | -------- | ------------------------------------------ |
| `from`   | `number` | 源行页内索引（0-based）                    |
| `to`     | `number` | 目标行页内索引（0-based）                  |
| `record` | `T`      | 被拖拽的行记录                             |
| `rows`   | `T[]`    | 当前页新行序（供批量重算 weight / 持久化） |

行为细则：

- **整行拖拽快照**：起拖时浏览器幽灵影为**带完整边框的整行截图**（离屏克隆 + `setDragImage`，抓取点与指针对齐），而非把手小图标
- **实时让位预览**：dragover 悬停即见表内行序实时移动（被拖行让位到悬停行位置，其余行相对序不变）；被拖行占位渲染半透明 + 逐格虚线描边，占位本身即落点提示。让位后被拖行恰落在光标下，天然不振荡
- **落位语义**：drop 提交最终预览序（落在自身占位 = 有效提交）；多跳预览等价于单次「源行原位移 → 最终预览位」。取消路径（Esc / 拖出窗外）预览序弹回原序、不发事件
- **静态模式**：引擎先行重排内部全量数据（页内索引自动映射全量位置，跨页数据不受影响）再发事件。**调用方应回写自身数据源**——引擎按 data 引用同步，不回写则后续任何 data 变更会覆盖拖拽结果
- **服务端模式**：只发事件、不改内部数据；调用方持久化（批量更新 weight 等）后 `reload()`
- **排序互斥（动态守卫）**：列排序激活期间把手置灰（排序视图下手动序无意义），取消排序后恢复；与 `defaultSort` / 受控 `sort` 初值同传时 DEV 警告
- **配置互斥**：与 `tree` / `virtual` 不能同时启用（DEV 警告并忽略 `draggable`）
- **rowKey 记录级守卫**：当前页任一记录缺 `rowKey` 字段时禁用拖拽并 DEV 警告一次（索引兜底态下行身份不稳定）；空表不触发
- **布局叠加**：把手列视作最左 sticky 列参与偏移累计（选择列 offset 0 → 把手列 → fixed-left 业务列），列宽计入表格 min-width；行选择、fill 模式、列显隐均可组合；加载骨架含把手列占位
- **已知限制**：让位为即时重排（无 FLIP 过渡动画）；预览期间页内位次派生的渲染器（如 `r.serial()`）短暂显示原序号，落位提交后即正确；行级谓词 `false` 仅限制不可起拖，仍可被让位越过（pinned 定位语义暂不支持）
- **不做**：跨页拖拽、触屏支持、键盘拖拽（a11y）、树形层级内拖拽

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
  <TTableRender
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

| 受控 prop      | 同步行为                                                                                                                                                    | 事件通知                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `pageIndex`    | 经受控 watch 同步 TanStack（1-based，最小归 1）                                                                                                             | `update:page-index`                         |
| `pageSize`     | 同步容量；**页码归位**（`resetPageOnPageSizeChange`，默认 true）：`pageIndex` 未受控时内部归位第 1 页并通知，两方都受控时由父层自行联动；开关关闭时保持首行 | `update:page-size` / `update:page-index`    |
| `sort`         | 经排序管线应用（服务端模式归位第 1 页 + 触发重载，不漏取数）；指向不可排序列时 DEV 警告并忽略                                                               | `sort-change`（内部交互时）                 |
| `selectedKeys` | 经 `setSelection` 写入（`selectable` 过滤、待定 key 语义继承）                                                                                              | `selection-change` / `update:selected-keys` |

细则：

- **传 prop 即受控**：非 `undefined` 才受控；四个 prop 可任意混用（如仅受控 `pageSize`，页码保持内部自治）
- **聚合式受控**：仅传 `defineTable({ pageIndex: ref })`（不传组件 prop）也算受控；非动作路径（越界钳制、数据缩水归位）的修正值会经 `update:page-index` 通知父层。初始越界值在挂载后钳制并回写。
- **等值守卫**：内部先行（动作已生效）或父层回写回弹时同步为空操作——不会死循环、不会重复 onLoad
- **事件不重复**：受控模式下内部交互仍只发一次通知；受控 `pageSize` 触发的页码归位会额外发一次 `update:page-index`（页码归位需要让父层知道）
- **服务端模式**：受控翻页/排序按既有语义重载（每次状态变化回调 `onLoad`）；初始受控值直接决定首次取数参数，不会先取第 1 页再跳转
- **`loading` / `virtual` / `tree` 等**其余 prop 不受受控模式影响，保持既有语义

## 列显隐

`columnSettings`（默认开启）提供「列设置」单例面板（工具栏 / 表头 ⋮ / 右键菜单三处共用同一实例）：勾选控制列的显隐、支持**最少一列**、「重置」恢复默认可见集。入口由 `columnSettingsPlacement` 决定：`auto` / `toolbar`（默认，**`auto ≡ toolbar`**）渲染为顶栏「列设置 n/m」文字链接；`header` 为 **opt-in**，改为表头叶子列右侧 `⋮`（`aria-label="列设置：<title>"`，多级表头只在叶子渲染），此时顶栏入口关闭。渲染（header/body/骨架/colspan）与 **fixed sticky 偏移全部基于可见列集重算**——隐藏 fixed 列后偏移自动收紧，sticky 组因隐藏变空则不输出该组边框。列显隐不触发 onLoad、不重置 pageIndex/sort/selectedKeys。

### 入口位置

三个入口打开的是**同一个面板实例**（同一份勾选状态与搜索/折叠状态），切换入口不会丢面板状态：

| 入口                | 触发方式                                               | 何时出现                                       | 备注                                                                    |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 顶栏文字链接        | `columnSettingsPlacement="auto"` / `"toolbar"`（默认） | `columnSettings !== false`                     | 文案「列设置 n/m」；无内置搜索区时独占表格上方一行、右对齐              |
| 表头叶子 `⋮`        | `columnSettingsPlacement="header"`（**opt-in**）       | 同上，且仅叶子表头（分组单元格不渲染）         | 绝对定位不参与布局；点击 `@click.stop` 不触发排序                       |
| 右键菜单「列设置…」 | `contextMenu` 显式开启                                 | `contextMenu` 为 `true` 或自定义项里包含该动作 | 从表头/单元格右键时自动高亮对应列；`columnSettings: false` 时该项被过滤 |

`auto` 与 `toolbar` 等价（`auto ≡ toolbar`）：即使没有任何顶栏/搜索区，也不自动改走表头入口——需要表头 `⋮` 请显式传 `columnSettingsPlacement="header"`。

面板以表格根节点为定位基准（`absolute`），页面滚动时随表格移动；表体滚动容器一滚动面板自动关闭。iframe 沙箱下退化为视口固定定位（与右键菜单同一策略）。

<DemoPreview file="table-render/ColumnSettingsPlacementDemo.vue" />

### 受控可见集与持久化

<DemoPreview file="table-render/ColumnVisibilityDemo.vue" />

```vue
<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

const table = defineTable<Dept>({
  columnVisibility: { defaultVisibleKeys: ["name", "lead"] }, // 聚合式默认可见集（重置基准）
  columns: [
    { key: "name", title: "部门", fixed: "left" },
    { key: "lead", title: "负责人" },
    // ...
  ],
});

// 可选：受控可见集（v-model:visible-keys），载荷可持久化
const visibleKeys = ref(["name", "lead"]);
</script>

<template>
  <TButton size="sm" @click="visibleKeys = ['name']">只看部门列</TButton>
  <TTableRender
    :definition="table"
    row-key="id"
    :visible-keys="visibleKeys"
    @update:visible-keys="visibleKeys = $event"
    @column-visibility-change="persist"
  />
</template>
```

### 配置与受控

| 入口                                               | 位置               | 说明                                                      |
| -------------------------------------------------- | ------------------ | --------------------------------------------------------- |
| `columnVisibility.defaultVisibleKeys`              | `defineTable` 配置 | 聚合式默认可见集（重置基准）；未知 key 静默忽略           |
| `defaultVisibleKeys`（prop）                       | `<TTableRender>`   | 拆分式默认可见集；与聚合式同传时 DEV 警告 definition 优先 |
| `visibleKeys`（prop）                              | `<TTableRender>`   | 受控可见列（columns 原序子集）；传入即受控                |
| `columnSettings`（prop）                           | `<TTableRender>`   | 触发器/面板开关，默认 `true`                              |
| `update:visible-keys` / `column-visibility-change` | 事件               | 可见列 key 有序数组；后者受控/非受控均触发，供持久化      |

行为细则：

- **面板**：清单 = 业务列（columns 原序，**排除选择列**）；列 title 超长 truncate；有效 fixed 列（数字 width）带 Pin 标识；项高 h-8 整行可点
- **搜索**：可见业务列数 **≥ 6** 时面板顶部出现搜索框（`data-column-search`），按 title / key 过滤；命中叶子时保留其祖先分组，无命中显示「无匹配列」
- **分组折叠**：分组行有 chevron（`data-column-group` + `data-collapsed`），折叠只影响面板投影，不改 `visibleKeys`、不影响表格渲染
- **三态勾选**：分组行按子树叶子可见数呈现 全选 / 半选 / 未选，勾选即批量写子树叶子
- **计数**：头部「已显示 n/m」（`data-column-count`）随显隐实时更新，m = 业务列总数（不含选择列）
- **高亮定位**：从表头 `⋮` 或右键「列设置…」打开时，`highlightKey` 对应行带 `data-highlight` 并滚动进视野
- **最少一列**：最后一枚选中项 Checkbox disabled；「全选」已全选时 disabled；禁止 0 列
- **展开控件跟随可见首列**：树形 caret 在首个可见业务列内（首列隐藏时顺延），选择列/展开控件恒可见不进清单
- **受控空数组**：钳制为首列可见 + DEV 警告一次；未知 key 静默忽略
- **面板 a11y**：Tab 遍历 + Space 切换（Checkbox 原生语义）；Esc 关闭（Ark 内建）后焦点归还触发器
- **不做**：列顺序拖拽调整、显隐持久化（业务用 `column-visibility-change` 自存）、列宽调整

## 右键命令菜单

`contextMenu` **默认关闭**（不挂根节点 `contextmenu` handler，右键行为零变化，不影响业务自己的右键逻辑）。显式传入 `true` 启用默认项，或传函数返回业务菜单项。整个表格只有一个菜单宿主（放在滚动容器外），不为每行/每列实例化。

### 接管与原生菜单

启用 `contextMenu` 即**接管表格区域的右键**：内置菜单会打开时同时 `preventDefault()`，浏览器原生菜单不再叠加弹出；即使菜单项为空（自定义函数返回 `[]`、或 `columnSettings: false` 导致默认项为空），该区域右键也被接管（仅屏蔽原生菜单，DEV 下警告一次）。

| 区域                                                           | 行为                                             |
| -------------------------------------------------------------- | ------------------------------------------------ |
| 表格元素内（行 / 单元格 / 表头 / 空态 / 错误态 / 骨架 / 空白） | 接管并屏蔽原生菜单                               |
| 分页条 `[data-table-pagination]`                               | 接管并屏蔽原生菜单                               |
| 表格外（工具栏、列设置面板内部等）                             | **不接管**，保留原生菜单                         |
| `input` / `textarea` / `select` / `[contenteditable]`          | **不接管**，保留原生菜单（搜索框可正常使用右键） |
| `[data-no-table-menu]`                                         | **不接管**，逐块豁免口                           |
| 菜单自身 / 列设置面板                                          | **不接管**，防止面板内右键二次打开               |

### 定位

- 菜单以**表格根节点为坐标基准**做绝对定位（锚点 `position: absolute`），页面滚动时随表格一起移动，不会悬停在视口原处
- 表体滚动容器（横向 / `fillHeight` 纵向 / `virtual` 纵向）一滚动即**关闭**菜单与列设置面板——锚点会与滚动内容脱节，关闭比错位更可靠
- iframe 沙箱（`TuProvider` 判定为 iframe realm）下 absolute 包含块会错位，自动回退 `position: fixed` + 视口坐标

### 默认项

`:context-menu="true"` 使用内置命令菜单，并按九态 `target` 自动分派：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { defineTable, type TableContextMenuContext } from "@tu-design/vue";

const lastTarget = ref("");

function onMenuOpen(ctx: TableContextMenuContext<Order>) {
  // ctx.target 为九态判别联合；ctx.selection / ctx.visibleKeys / ctx.columns 同时可得
  lastTarget.value = ctx.target.kind;
}
</script>

<template>
  <TTableRender :definition="table" row-key="id" :context-menu="true" @context-menu="onMenuOpen" />
</template>
```

<DemoPreview file="table-render/ContextMenuDemo.vue" />

默认项：**列设置…**（打开同一个列设置面板；从表头/单元格右键时高亮对应列）/ **重置列**（仅配置了 `defaultVisibleKeys` 时出现）/ **显示全部列**；`columnSettings: false` 时列相关项全部过滤，最终为空则不打开菜单。

### 自定义菜单项

传函数即完全接管菜单内容：返回的项按 `TableMenuItem` 描述，带 `onSelect` 的项先关菜单再执行，无 `onSelect` 的项点击后发 `context-menu-select`：

```vue
<TTableRender
  :definition="table"
  row-key="id"
  :context-menu="
    (ctx) => [
      { value: 'detail', label: '查看详情', onSelect: () => openDetail(ctx.target) },
      { value: 'toggle', label: '切换状态', onSelect: () => toggle(ctx.target) },
      { type: 'separator' },
      { value: 'export-row', label: '导出该行' }, // 无 onSelect → 走 context-menu-select
    ]
  "
  @context-menu-select="(value, ctx) => handleSelect(value, ctx)"
/>
```

<DemoPreview file="table-render/ContextMenuCustomDemo.vue" />

- **items 为空**（返回 `[]`）→ 不打开菜单、不 emit `context-menu`，但该区域右键仍被接管（原生菜单已屏蔽）。需要某区域保留原生菜单，请用 `data-no-table-menu` 豁免，或让该区域落在表格元素之外
- **`disabled`**：置灰但仍占位；**`label` / `group` / `separator`** 用于分组与说明行
- **业务数据**：`ctx.target` 携带 `record` / `rowKey` / `index`；`cell` 额外带 `columnKey` 与 `rawValue`（取自 `record[columnKey]`，不是渲染 VNode）；`ctx.selection` 是当前页选中快照

### target 判定与 DOM 钩子

判定自上而下、命中即停；`cell` 优先于 `row`（同一 `tr` 内）：

| 优先级 | 命中条件                                                                                    | `target.kind`                  | 关键字段                                                 |
| ------ | ------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------- |
| 1      | `input` / `textarea` / `select` / `[contenteditable]` / `[data-no-table-menu]` / 列设置面板 | **不接管**（返回 `undefined`） | —                                                        |
| 2      | `event.defaultPrevented` 为真                                                               | **不接管**                     | 业务已接管，内置菜单不打开                               |
| 3      | 菜单自身 `[data-scope="menu"]`                                                              | **不接管**                     | 防止菜单内右键二次打开                                   |
| 4      | `tr[data-row-key]` + `td[data-column-key]`                                                  | `cell`                         | `record` / `rowKey` / `index` / `columnKey` / `rawValue` |
| 5      | `tr[data-row-key]`                                                                          | `row`                          | `record` / `rowKey` / `index`                            |
| 6      | `th[data-column-key]`                                                                       | `header`（叶子）               | `columnKey` / `node`                                     |
| 7      | `th[data-column-group]`                                                                     | `header`（分组）               | `groupPath` / `node`                                     |
| 8      | `[data-table-empty]` / `[data-table-error]` / `[data-table-skeleton]`                       | `empty` / `error` / `skeleton` | —                                                        |
| 9      | `[data-table-pagination]`                                                                   | `pagination`                   | —                                                        |
| 10     | 兜底：**`table` 元素内**                                                                    | `table`                        | 表格外（工具栏/面板）返回 `undefined`，不接管            |

依赖的 DOM 钩子（也是业务自建菜单/自动化测试的稳定选择器）：

| 钩子                                                            | 落位                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `data-row-key` / `data-column-key`                              | 业务行 `<tr>` / 业务单元格 `<td>`（选择格与把手格不带 column-key） |
| `data-column-key` / `data-column-group`                         | 表头叶子 `<th>` / 分组 `<th>`                                      |
| `data-table-empty` / `data-table-error` / `data-table-skeleton` | 空态 / 错误态 / 骨架行                                             |
| `data-table-pagination`                                         | 分页条根节点                                                       |
| `data-column-settings`                                          | 列设置入口（顶栏按钮 / 表头 ⋮）                                    |
| `data-sort-button`                                              | 表头排序按钮（与列设置 ⋮ 区分）                                    |
| `data-column-search` / `data-column-count` / `data-column-item` | 面板搜索框 / 计数 / 每行                                           |
| `data-no-table-menu`                                            | 任意元素：标记该子树内右键**不接管**                               |

### 与 `row-contextmenu` 并存

内置菜单不主动 `preventDefault`：行右键事件照常发出（`(record, index, event)`）。业务在自己的处理器里调用 `event.preventDefault()` 即表示「我已接管」，内置菜单看到 `defaultPrevented` 后不打开——这比文档约定更可靠，也便于逐行/逐条件禁用。

### 扩展点（复制 / 导出由业务实现）

本轮只提供 `context` 与 `onSelect` 扩展点，**内置不含**复制行/列/单元格、复制表格、导出 CSV/Excel：

```ts
import {
  defaultTableMenuItems,
  type TableContextMenuContext,
  type TableMenuItem,
} from "@tu-design/vue";

function buildMenu(ctx: TableContextMenuContext<Order>): TableMenuItem<Order>[] {
  const items: TableMenuItem<Order>[] = [];
  const target = ctx.target;

  if (target.kind === "cell") {
    items.push({
      value: "copy-cell",
      label: "复制单元格",
      onSelect: () => void navigator.clipboard.writeText(String(target.rawValue ?? "")),
    });
  }
  if (target.kind === "row" || target.kind === "cell") {
    items.push({
      value: "copy-row-tsv",
      label: "复制该行（TSV）",
      // visibleKeys 决定列顺序；rawValue 口径与单元格一致
      onSelect: () =>
        void navigator.clipboard.writeText(
          ctx.visibleKeys.map((key) => String(target.record[key] ?? "")).join("\t"),
        ),
    });
  }
  // 导出等需要服务端全量数据的动作：在 onSelect 里自行请求，不依赖组件内置数据
  items.push({ value: "export", label: "导出当前页 CSV", onSelect: () => exportCsv(ctx) });
  return items;
}
```

`defaultTableMenuItems(ctx, options)` 也对外导出，供你在**自己的**菜单宿主里复用默认项文案与结构；其中「列设置…」依赖组件内部面板，业务自建菜单如需该入口，建议直接使用 `:context-menu="true"` 或另设业务入口。

### 限制

- **无 Teleport**：菜单与列设置面板都挂在表格根节点内（列设置 `portal=false`，为的是随表格滚动），表格若嵌在 `overflow: hidden` 的弹窗内可能被裁剪（后续计划补 portal），此场景请优先使用工具栏/表头入口
- **接管即屏蔽原生菜单**：启用 `contextMenu` 后表格区域内不再出现浏览器原生菜单；需要局部恢复请在目标元素标 `data-no-table-menu`
- **内层滚动关闭**：表体滚动容器一滚动，菜单与列设置面板都会关闭（避免锚点与内容错位）
- **鼠标隐藏功能**：不做触屏（长按）与键盘（ContextMenu 键）专项适配
- **不持久化**：菜单选择结果由业务自行处理（写 store / 请求接口）

## 表头分组

多级表头：`columns` 支持**任意层级**的列节点树——**叶子列**（原本的 `TableColumnOptions`）或**分组**（`{ title, align?, children }`）。分组节点只承载展示语义（标题、对齐），排序/宽度/固定等能力全部下沉到叶子列；`defineTable` 的扁平数组写法天然合法（即单级表头），**完全向后兼容**。

<DemoPreview file="table-render/HeaderGroupDemo.vue" />

```vue
<script setup lang="ts">
import { defineTable, type TableColumnNode } from "@tu-design/vue";

const columns: TableColumnNode<Metric>[] = [
  { key: "region", title: "区域", width: 100, fixed: "left" },
  {
    title: "上半年", // 分组：无 key、无 width
    children: [
      { key: "q1", title: "Q1", width: 90, sortable: true },
      { key: "q2", title: "Q2", width: 90, sortable: true },
    ],
  },
  { key: "ops", title: "操作", width: 100, fixed: "right" },
];

// 任意层级同理：分组下再嵌套分组即可（3 级、4 级…）
const table = defineTable<Metric>({ data: ROWS, columns });
</script>
```

行为细则：

- **表头矩阵**：表头深度 = 可见表头树的最大层级（无分组时为 1）；分组格 `colSpan` = 其子树下的**可见叶子数**、`rowSpan` = 1；叶子格贴底 `rowSpan` = 深度差。分组下可见叶子为 0 时**整支剔除**（与列显隐同口径），表头深度随之收缩，不产生空白行
- **可见树驱动**：矩阵与深度均由「按 `visibleKeys` 剪枝后的可见表头树」单一派生源计算——最大深度取**可见树**而非原始树，故隐藏深层列后表头行数会收缩
- **分组与固定列**：分组内可见叶子**同侧且连续固定**（均带数字 `width`）时，分组格整体 sticky 在该侧、偏移取首个可见叶子；**方向混合**（同时含 left/right）或组内夹非固定列时降级为普通格并 DEV 警告一次（单个 `<th>` 无法部分固定）
- **列显隐**：列设置面板以**树形缩进**呈现（分组行带 `data-column-group`、叶子行带 `data-column-key`），分组行 Checkbox 为三态（全选/半选/未选），点击批量显隐其子树；`visibleKeys` 契约不变（**只含叶子 key**），「最少一列」恒按叶子口径——批量隐藏将清空可见集时保留该组最后一枚叶子
- **多行 sticky 偏移**：`fillHeight` / `virtual` 下表头 sticky 时，逐表头行累积 `top` 偏移（行高实测，不可测时按 h-10=40px/行兜底），避免多行表头叠在顶边互相覆盖；虚拟滚动的 `scrollMargin` 取各行高之和，天然自适应
- **视觉规约**：横向底边线沿用既有机制（非 sticky 走 thead 行级 `[&_tr]:border-b`、sticky 走表头单元格 `border-b`），单级表头 DOM 零变化；分组表头下，分组格与其后单元格之间加竖向分隔线（同级末块除外）
- **DEV 校验**：分组节点误配 `key` / `sortable` / `fixed`、`children` 为空，或叶子列误配 `children`——各 DEV 警告一次并忽略
- **不做**：分组的折叠/展开交互、分组级 `width`/`fixed` 配置、列顺序拖拽

## 加载失败与错误态

服务端模式下 `onLoad` 抛错（或返回的 Promise rejects）时，表格进入**错误态**：表体区域渲染错误占位（默认 = 错误信息 + 「重试」按钮），优先于数据与空态；点击重试触发 `reload()`，**新一轮 load 开始时清除内部错误**。错误同时通过 `error` 投影（`Ref<Error | undefined>`）与 `load-error` 事件对外暴露，便于埋点上报。静态模式可传 `defineTable({ error })` 注入外部错误（显示同一错误态，`retry` 仍调用 `reload()`，外部 `error` 由调用方自行清除）。

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
  <TTableRender :definition="table" row-key="id" @load-error="report" />
</template>
```

行为细则：

- **判定顺序**：loading（骨架）优先，其次 error（占位），最后才是数据/空态；load 开始时旧错误即被清除，因此 loading 期间不会闪现错误占位
- **自定义占位**：`#error` 插槽（slot props `{ error, retry }`）替换默认占位内容；`retry` 即 `reload()`
- **实例出口**：`def().error`（只读投影）与组件 `expose.error` 供程序化读取；非 Error 抛出值（字符串等）会归一化为 `Error`
- **错误占位为整表单元格**（colspan 全列，不虚拟化）；`render` 列/选择列等在错误态不渲染

## 内置列渲染器

`defineForm` 的 widget 有 `r.input()`，表格列同样有 `r`：`column.render` 声明为 `(r: ColumnRenders<T>) => ColumnRender<T>` 工厂形态——**`r` 由 `defineTable<T>` 的列类型自动推断，无需手写泛型**。6 个预设渲染器覆盖高频样板：状态映射、日期/货币格式化、序号列、操作列、图片列。

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
| [`serial`](#r-serial-base-—-序号列)                    | `(base? = 1)`                            | 页内序号 `pageRowIndex + base`                   |
| [`button`](#r-button-items-—-操作列)                   | `(items)`                                | 操作列按钮行，字符串简写 + confirm 二次确认      |
| [`image`](#r-image-options-—-图片列)                   | `(options?)`                             | 图片缩略图，失败切 fallback / 占位盒，原生懒加载 |

约定：所有渲染器返回 `(record, index, column, context?) => VNodeChild`，与 `column.render` 同签名；`index` 为**数据源下标**（跨页连续、不受排序影响），`context` 为可选页内上下文（`{ pageRowIndex, pageIndex, pageSize }`，供 `serial` 与自定义渲染器使用）。需要字段值的渲染器（`dict`/`date`/`currency`/`image`）通过第三参 `column.key` 读取。`tag` 并入 `dict` 的 Badge 形态；`text` 即默认取值；`render` 就是自定义口；`progress` 暂不支持。

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

- **命中** → 显示映射文本（或 Badge）；**未命中** → 原始值原样显示；`null`/`undefined` → 空字符串
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

默认与 `base=0` 两种起始序号（翻页可观察页内序号重计与跨页连续序号）：

<DemoPreview file="table-render/SerialDemo.vue" />

| 参数   | 类型     | 默认 | 说明     |
| ------ | -------- | ---- | -------- |
| `base` | `number` | `1`  | 起始序号 |

行为细则：

- 显示 `pageRowIndex + base`：**翻页后从 `base` 重新计数（页内序号）**，排序后按当前页显示顺序连续
- 需要跨页连续序号时用第 4 参上下文：`(record, index, column, ctx) => (ctx.pageIndex - 1) * ctx.pageSize + ctx.pageRowIndex + base`（树形/变长页需按实际可见行口径校正）
- 不读取字段值，`key` 可为任意占位（如 `"seq"`）

### `r.button(items)` — 操作列

字符串简写、函数化 text、逐行 disabled、onClick 与 confirm 二次确认：

<DemoPreview file="table-render/ButtonDemo.vue" />

| 字段        | 类型                                    | 默认   | 说明                                                                                                                          |
| ----------- | --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `items`     | `Array<string \| TableActionButton>`    | —      | 按钮序列；**字符串简写等价 `{ text }`**                                                                                       |
| `text`      | `string \| ((record, index) => string)` | —      | 按钮文本，支持按行定制                                                                                                        |
| `onClick?`  | `(record, index) => unknown`            | —      | 点击回调（**不含事件对象**，见下方注意事项）；有 `confirm` 时仅在确认后触发，返回 Promise 获得 pending 语义（其余返回值忽略） |
| `variant?`  | `ButtonVariants["variant"]`             | `link` | 沿用 Button 组件全部变体                                                                                                      |
| `disabled?` | `(record, index) => boolean`            | —      | 逐行求值，返回真即渲染原生 `disabled`                                                                                         |
| `confirm?`  | `string \| TableActionConfirm`          | —      | 二次确认气泡（复用 Popconfirm）；**字符串简写 = 气泡标题**                                                                    |

`TableActionConfirm` 字段：`title`（必填，支持 `(record, index) => string`）、`description?`（同支持函数）、`confirmText?`（默认「确定」）、`cancelText?`（默认「取消」）、`variant?`（`default | destructive`，缺省时按钮 `variant: "destructive"` 自动推断红色确认钮）。

行为细则：

- 渲染为 `flex items-center gap-1` 的按钮行，`size="sm"`；**空数组渲染为空字符串**（不产生节点）
- 点击回调只携带 `(record, index)`；点击会**冒泡触发行 `row-click`**（行点击绑在 `<tr>` 上）——操作列与行点击并存时，请在 `row-click` 处理器里排除操作列来源，或对操作列所在表格不启用 `row-click`
- **有 `confirm` 时**：点击按钮只打开确认气泡，`onClick` 仅在点「确定」后执行；取消不触发回调。确认按钮在 Teleport 面板内，**点确认不冒泡 `row-click`**（触发按钮仍冒泡，适用上一条）。`confirm` 通常与 `onClick` 搭配（缺省时确认后空操作关闭）
- **异步 pending 语义**（与 Popconfirm/AlertDialog 对齐）：`onClick` 返回 Promise 时确认钮转 loading 并锁定全部关闭通道（ESC/点外部/取消钮），resolve 后自动关闭、reject 保持打开可重试
- `disabled` 按钮原生不派发 click，确认气泡天然打不开
- 空数组与全禁用是有意支持的合法形态（权限收敛后常整列禁用/隐藏）
- 已知限制：每个 confirm 按钮独立 Popover 实例（超大表格高频操作列留意开销）；气泡打开期间行拖拽重排可能错位、行删除随组件卸载关闭

```ts
r.button([
  { text: "编辑", onClick: (row) => edit(row) },
  { text: (row) => (row.locked ? "已锁定" : "解锁"), disabled: (row) => row.locked },
  "删除", // 简写，等价 { text: "删除" }
  // 二次确认：字符串简写 = 气泡标题
  { text: "发布", confirm: "确定发布该文档？", onClick: (row) => publish(row) },
  // 对象形态 + 异步 onClick（确认后 loading，成功自动关闭、失败保持打开）
  {
    text: "删除",
    variant: "destructive", // 确认钮自动推断 destructive
    confirm: {
      title: (row) => `删除「${row.name}」？`,
      description: "删除后不可恢复",
      confirmText: "删除",
    },
    onClick: (row) => api.delete(row.id), // 返回 Promise
  },
]);
```

### `r.image(options?)` — 图片列

缩略图展示（原生 `<img>`，零额外组件依赖）；加载失败切备用图、再失败显示占位盒：

<DemoPreview file="table-render/ImageDemo.vue" />

| 字段        | 类型                                                       | 默认      | 说明                                               |
| ----------- | ---------------------------------------------------------- | --------- | -------------------------------------------------- |
| `size?`     | `number`                                                   | `40`      | 方形边长 px（inline style）                        |
| `fit?`      | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `cover`   | 图片适应方式                                       |
| `shape?`    | `"rounded" \| "square" \| "circle"`                        | `rounded` | 外形（rounded-md / 直角 / 圆形）                   |
| `alt?`      | `string \| ((record, index) => string)`                    | `""`      | 替代文本（装饰图语义）；建议按行传入有意义描述     |
| `fallback?` | `string \| ((record, index) => string)`                    | —         | 加载失败时的备用图 URL（仅切换一次），支持按行求值 |

行为细则：

- 单元格值取自 `record[column.key]`；**非字符串（含 null/undefined/number）或空串渲染为空字符串**（不产生节点，与 dict 兜底一致）
- 四态闭环：加载中（img 自带 `bg-muted` 底色）→ 成功显示；失败且有 `fallback` → 切换备用图；失败无 `fallback` / 备用也失败 → 同尺寸 `bg-muted` 占位盒 + 图片图标
- **默认 `loading="lazy"`**：原生懒加载，大表格 / 虚拟滚动场景延迟离屏图片请求
- error 状态随 src 变化复位（虚拟滚动 / 分页行复用不串图）
- 图片列为 VNode 直通，`ellipsis` 对其无效果（图片无需截断，不必配置）
- 已知限制：v1 无点击放大预览 / 多图；行拖拽幽灵影中未加载完的图片可能空白（纯观感）。预览需求走下方自定义渲染器逃逸口

```ts
{ key: "cover", title: "封面", render: (r) => r.image({ size: 48, shape: "circle", alt: (row) => row.name }) }
```

### 自定义渲染器

进度条自定义工厂（SFC 内以 `h()` 实现，等价文档中的 TSX 写法）：

<DemoPreview file="table-render/CustomRenderDemo.vue" />

内置渲染器覆盖不到的形态（比如进度条、头像组），直接写同签名的函数即可，内置与自定义可以逐列混用（带确认弹窗的操作已内置：`r.button` 的 `confirm` 选项）：

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
  // r.render 是自定义渲染器逃逸口
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

图片点击放大预览（`r.image` v1 无预览，用逃逸口 + Dialog 自建 lightbox；触发元素记得 `stopPropagation` 防冒泡 `row-click`）：

```tsx
import type { TableColumnOptions } from "@tu-design/vue";
import { Dialog } from "@tu-design/vue";

interface Product {
  name: string;
  cover: string;
}

function imagePreviewColumn(): TableColumnOptions<Product>["render"] {
  return (r) =>
    r.render((record) => (
      <Dialog title={record.name}>
        {{
          trigger: () => (
            <img
              src={record.cover}
              alt={record.name}
              class="size-10 cursor-zoom-in rounded-md object-cover"
              onClick={(e: MouseEvent) => e.stopPropagation()}
            />
          ),
          default: () => (
            <img src={record.cover} alt={record.name} class="max-h-[70vh] w-full object-contain" />
          ),
        }}
      </Dialog>
    ));
}
```

选择顺序建议：**能 `formatter` 就不 `render`**（纯文本格式化走取值链更轻）；格式化不够了再上内置渲染器；内置也不够才手写 `render`。三者优先级：`render` > `formatter` > `record[key]`。

## 组件结构

| 成员                      | 说明                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TTableRender`            | 表格本体：包装 TanStack `useTable`，内置分页器（`TablePagination`，已公开、可独立使用，见下方组合式布局节）、行选择、固定列、虚拟滚动与树形展开；列单元格渲染见上文[内置列渲染器](#内置列渲染器) |
| `defineTable<T>(config)`  | 聚合函数：`useTableRender` 的别名，一步返回 `TableRenderDefinition`（须在组件 setup 中调用，TanStack 约束）                                                                                      |
| `useTableRender(options)` | 底层组合函数：包装 TanStack `useTable`，供已有实例 / 动态配置的高级场景                                                                                                                          |
| `defineColumns(columns)`  | 纯类型辅助：补全泛型推导，便于把列配置抽到独立文件；原样返回入参，裸数组同样可直接使用                                                                                                           |

### 源码结构（registry 源码分发）

组件以源码形式安装到项目内，下列文件可直接阅读/改动（升级时 `tu-design add table-render --overwrite` 会覆盖，定制实现请改业务层）：

| 文件                             | 职责                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| `TableRender.vue`                | 编排与布局：引擎接线、滚动容器、sticky 层级、body 行渲染、对外 API     |
| `TableHeader.vue`                | `thead`：表头矩阵、排序、固定/分组 sticky、表头 `⋮` 入口、表头测量回传 |
| `TableToolbar.vue`               | 搜索区 + 列设置文字链接（`showSearchArea` 与入口互斥关系在此落地）     |
| `TableColumnSettings.vue`        | 列设置**单例宿主**：受控 Popover、固定锚点、Esc/外点关闭               |
| `ColumnSettingsPanel.vue`        | 列设置**纯面板**：树形分组、三态、搜索、折叠、计数、高亮（不依赖引擎） |
| `TableContextMenu.vue`           | 右键菜单**单例宿主**：受控 DropdownMenu + 固定锚点                     |
| `useTableHeaderModel.ts`         | 可见表头树 / 深度 / 表头矩阵（colSpan/rowSpan）                        |
| `useStickyLayout.ts`             | sticky 映射、`tableMinWidth`、分组 sticky 降级（混合侧 DEV 警告）      |
| `useHeaderMeasurement.ts`        | 多行表头测量：`rowTop` 前缀和与 `theadOffset`（虚拟滚动 scrollMargin） |
| `useColumnSettingsPanel.ts`      | 面板行派生、三态勾选、搜索过滤、折叠投影、全选/重置                    |
| `useColumnSettingsController.ts` | 面板开合、锚点计算、`highlightKey`                                     |
| `useTableContextMenu.ts`         | 九态 target 解析、菜单项构建、先关后执行                               |
| `context-menu-types.ts`          | 右键目标/上下文/菜单项类型 + `defaultTableMenuItems`                   |

依赖关系：`TableRender` → 各 composable 与子组件；子组件只经显式 `model` / `actions` props 取数与回传（不依赖 `provide/inject`），便于单测与追踪数据流。

## API

按「组件 → 入口函数 → 数据类型」三组组织；单元格预设见上文 [内置列渲染器](#内置列渲染器)。

### Props

| prop                                                                                                                                                           | 类型                                  | 默认       | 说明                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `definition`                                                                                                                                                   | `TableRenderDefinition`               | —          | 聚合式内核（优先于其余 props）                                                                                                                                         |
| `rowKey`                                                                                                                                                       | `string`                              | **必填**   | 行主键字段名                                                                                                                                                           |
| `columns`                                                                                                                                                      | `TableColumnOptions[]`                | —          | 拆分式列配置                                                                                                                                                           |
| `onLoad`                                                                                                                                                       | 见上                                  | —          | 拆分式数据源                                                                                                                                                           |
| `data`                                                                                                                                                         | `T[]`                                 | —          | 拆分式静态数据源                                                                                                                                                       |
| `autoLoad`                                                                                                                                                     | `boolean`                             | `true`     | 同 config                                                                                                                                                              |
| `pageSize` / `pageSizeOpts`                                                                                                                                    | `number` / `number[]`                 | 同 config  | 同 config；**仅初始值生效**，运行期调整用实例的 `setPageSize`                                                                                                          |
| `resetPageOnPageSizeChange`                                                                                                                                    | `boolean`                             | `true`     | 改每页条数是否归位第 1 页；`false` 沿用 TanStack v9 保首行语义（拆分式）                                                                                               |
| `autoResetPageIndex`                                                                                                                                           | `boolean`                             | `true`     | 静态模式数据引用变化是否归位第 1 页；`false` 时保持当前页、仅越界钳制（拆分式）                                                                                        |
| `loading`                                                                                                                                                      | `boolean`                             | —          | 外部受控加载态，与内部 loading 取或                                                                                                                                    |
| `error`                                                                                                                                                        | `Error`                               | —          | 外部错误态（与内部 onLoad 错误取并，内部优先）；静态模式可注入                                                                                                         |
| `emptyText`                                                                                                                                                    | `string`                              | `暂无数据` | 空态文案（`#empty` 插槽优先）                                                                                                                                          |
| `search`                                                                                                                                                       | `FormRenderDefinition`                | —          | 搜索表单（defineForm 返回值）；拆分式直接传，聚合式请在 defineTable 配置（definition 优先，同传 DEV 警告）                                                             |
| `showSearch`                                                                                                                                                   | `boolean`                             | —          | `false` 关闭内置搜索区；数据链路不变（`onLoad` 的 `form` 仍携带表单值），`search` / `reset` 事件随之无触发源，见下方组合式布局节                                       |
| `showPagination`                                                                                                                                               | `boolean`                             | —          | `false` 关闭内置分页条；缺省时单页自动隐藏不变，见下方组合式布局节                                                                                                     |
| `columnSettingsPlacement`                                                                                                                                      | `"auto" \| "toolbar" \| "header"`     | `auto`     | 列设置入口位置：`auto`/`toolbar` = 顶栏文字链接（`auto ≡ toolbar`）；`header` = 表头叶子 ⋮（opt-in）                                                                   |
| `contextMenu`                                                                                                                                                  | `boolean \| (ctx) => TableMenuItem[]` | `false`    | 右键命令菜单；`true` 用默认项（列设置…/重置列/显示全部列），函数返回业务项；默认关闭不挂 handler，协议见[右键命令菜单](#右键命令菜单)                                  |
| `fillHeight`                                                                                                                                                   | `boolean`                             | —          | 填充模式：填满外部容器、内部滚动、表头 sticky 钉住；显式 prop > 布局 provide（key `tu-design:page-table-fill`）> `false`，见上方 [填充模式](#填充模式-fillheight) 节   |
| `bordered`                                                                                                                                                     | `boolean`                             | `true`     | 表格外框；网格线由 `single-column` / `single-line` 独立控制（正交模型），见上方 [边框与条纹](#边框与条纹) 节                                                           |
| `bottomBordered`                                                                                                                                               | `boolean`                             | `true`     | 表格底部边框（仅 `bordered: false` 时有意义）                                                                                                                          |
| `singleColumn`                                                                                                                                                 | `boolean`                             | `false`    | `true` 不设定行的分割线（单元格无下边线）；表头底线保留                                                                                                                |
| `singleLine`                                                                                                                                                   | `boolean`                             | `true`     | `true` 不设定列的分割线（单元格无右边线）；全网格配方 `:single-line="false"`                                                                                           |
| `striped`                                                                                                                                                      | `boolean`                             | `false`    | 斑马线条纹（按当前页显示位次奇偶，排序/翻页后仍交替，虚拟滚动安全）                                                                                                    |
| `rowSelection` / `virtual` / `height` / `tree` / `draggable` / `pageIndex` / `sort` / `selectedKeys` / `visibleKeys` / `defaultVisibleKeys` / `columnSettings` | 同 config                             | —          | 拆分式直传，语义见上方 `defineTable` 配置表与对应特性小节；`rowSelection` / `draggable` 仅拆分式生效——聚合式请在 `defineTable` 配置，同传时 definition 优先并 DEV 警告 |

### Events

`defineEmits` 声明的全部事件：

| 事件                                               | 载荷                                   | 说明                                                                                           |
| -------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `update:page-index` / `update:page-size`           | `(pageIndex)` / `(pageSize)`           | 分页状态单向通知；配对回写即 v-model，见「受控模式（v-model）」                                |
| `sort-change`                                      | `(sort: SortableOptions \| undefined)` | 排序变化；受控/非受控的内部交互均经此通知                                                      |
| `row-click` / `row-dblclick` / `row-contextmenu`   | `(record, index, event)`               | 行交互；`index` = 数据源下标（跨页连续、不受排序影响）；contextmenu 不主动 preventDefault      |
| `cell-click`                                       | `(record, columnKey, index, event)`    | 单元格点击（columnKey 定位列）；与 `row-click` 冒泡并存——cell 触发时 row-click 也会触发        |
| `selection-change`                                 | `(rows)`                               | 选中行集变化（含跨页保留行）                                                                   |
| `update:selected-keys`                             | `(keys)`                               | 选中主键集回写（v-model 可用）                                                                 |
| `search` / `reset`                                 | `(values)`                             | 搜索表单联动：校验通过后搜索 / 重置为 defaults 后重载时触发，载荷为当前表单值快照              |
| `load-error`                                       | `(error)`                              | `error` 投影变为有值时触发（内部 onLoad 失败或外部 `error`）；内部错误在下一次 load 开始时清除 |
| `update:visible-keys` / `column-visibility-change` | `(keys)`                               | 列显隐；前者支持 v-model，后者受控/非受控均触发供持久化                                        |
| `drag-sort`                                        | `(payload: TableDragSortPayload)`      | 行拖拽成功落位（取消路径不发）；`{ from, to, record, rows }`，见[行拖拽排序](#行拖拽排序)      |
| `context-menu`                                     | `(ctx: TableContextMenuContext)`       | 右键菜单已打开（`contextMenu` 显式开启时）；`ctx.target` 为九态判别联合                        |
| `context-menu-select`                              | `(value, ctx)`                         | 业务菜单项无 `onSelect` 时点击的通知出口                                                       |

### Slots

| 插槽    | 说明                                                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `empty` | 空态；缺省渲染 `emptyText`（默认「暂无数据」）                                                                                                                   |
| `error` | 错误态占位（内部 onLoad 失败或外部 `error` 时渲染，优先于数据区）；slot props `{ error, retry }`，`retry` 即 `reload()`，见[加载失败与错误态](#加载失败与错误态) |

单元格完全自定义走列 `render`，无额外内容插槽。

### defineTable / useTableRender

`defineTable` 是 `useTableRender` 的聚合别名（后者供「已有内核、动态切换数据源」的场景）。两者均须在组件 `setup` 中调用。

| config 字段                  | 类型                                              | 默认             | 说明                                                                                                  |
| ---------------------------- | ------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `columns`                    | `TableColumnNode<T>[]`                            | —                | 列节点树：叶子列或分组（多级表头），任意层级；`key` 为取值字段                                        |
| `data?`                      | `T[] \| Ref \| () => T[]`                         | —                | 静态模式数据源；ref/getter 自动跟随                                                                   |
| `onLoad?`                    | `(params: TableLoadParams<T>) => void \| Promise` | —                | 服务端模式数据源；与 `data` 冲突时以此为准                                                            |
| `autoLoad?`                  | `boolean`                                         | `true`           | 挂载后是否自动取数（仅服务端模式生效）                                                                |
| `loading?`                   | `boolean \| Ref \| () => boolean`                 | —                | 受控加载态（与内部 load 取或）；静态模式异步取数用于骨架                                              |
| `error?`                     | `Error \| Ref \| () => Error`                     | —                | 外部错误态（内部 onLoad 错误优先）；静态模式可注入                                                    |
| `pageSize?`                  | `number`                                          | `10`             | 每页条数                                                                                              |
| `pageSizeOpts?`              | `number[]`                                        | `[10,20,50,100]` | 每页条数下拉选项（当前 pageSize 不在其中时组件自动补齐）                                              |
| `resetPageOnPageSizeChange?` | `boolean \| Ref \| () => boolean`                 | `true`           | 改每页条数是否归位第 1 页；`false` 沿用 v9 保首行                                                     |
| `autoResetPageIndex?`        | `boolean \| Ref \| () => boolean`                 | `true`           | 静态模式数据引用变化是否归位第 1 页（仅客户端分页生效）                                               |
| `rowSelection?`              | `"radio" \| "checkbox" \| TableSelectionOptions`  | —                | 行选择；字符串为简写                                                                                  |
| `rowKey?`                    | `string`                                          | —                | 行主键字段；rowSelection 依赖                                                                         |
| `search?`                    | `FormRenderDefinition`                            | —                | 搜索表单（`defineForm` 返回值）；仅服务端模式生效，静态模式传入时 DEV 警告并忽略                      |
| `virtual?`                   | `boolean`                                         | —                | 表体行虚拟化渲染（当前页行窗口内，分页语义不变）；须同时配置 `height`，否则 DEV 警告并降级            |
| `height?`                    | `number \| string`                                | —                | 虚拟滚动容器高度（数字 px 或 CSS 高度）；仅 `virtual: true` 时生效                                    |
| `tree?`                      | `TreeOptions`                                     | —                | 树形数据（子行展开/收起）；配置无效时 DEV 警告并忽略，见[树形数据](#树形数据)                         |
| `draggable?`                 | `boolean \| TableDraggableOptions<T>`             | —                | 行拖拽排序（把手列页内 DnD + `drag-sort` 事件）；与 tree/virtual 互斥，见[行拖拽排序](#行拖拽排序)    |
| `columnVisibility?`          | `ColumnVisibilityOptions`                         | —                | 聚合式列显隐：`{ defaultVisibleKeys?: string[] }`（重置基准）；未知 key 静默忽略                      |
| `pageIndex?`                 | `number`                                          | —                | 受控页码（1-based）：传入即受控，缺省非受控；内部翻页经 `update:page-index` 通知                      |
| `pageSize?`                  | `number`                                          | —                | 受控每页条数：传入即受控；`pageIndex` 未受控时页码归位内部处理并通知                                  |
| `sort?`                      | `SortableOptions`                                 | —                | 受控排序：传入即受控；内部/外部变化均经 `sort-change` 通知                                            |
| `selectedKeys?`              | `(string \| number)[]`                            | —                | 受控选中集（数组，与 `update:selected-keys` 载荷同构）；传入即受控                                    |
| `visibleKeys?`               | `string[]`                                        | —                | 受控可见列 key（columns 原序子集）：传入即受控；内部显隐经 `update:visible-keys` 通知                 |
| `defaultVisibleKeys?`        | `string[]`                                        | —                | 拆分式默认可见列集；与聚合式 `columnVisibility.defaultVisibleKeys` 同传时 DEV 警告（definition 优先） |
| `columnSettings?`            | `boolean`                                         | `true`           | 列设置触发器/面板开关；`false` 时不渲染 UI，受控 API 不受影响                                         |

返回 `TableRenderDefinition<T>`：

| 字段                                      | 说明                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `columns`                                 | 扁平叶子列配置（下游消费口径）                                                                                          |
| `columnTree`                              | 原始列节点树（表头矩阵与面板树形结构来源；手工构造定义为可选）                                                          |
| `table`                                   | TanStack 表格实例（逃逸舱口：列聚合、rowSelection 等）                                                                  |
| `page`                                    | 只读投影 `{ pageIndex(1-based), pageSize, total, pageSizeOpts, pageCount? }`；`total` 静态=可见行数、服务端=回写总数    |
| `pageControlled?`                         | `{ pageIndex: boolean; pageSize: boolean }`；聚合式分页受控标识（TableRender 据此通知钳制/归位修正）                    |
| `sort`                                    | 只读投影 `{ key, direction } \| undefined`                                                                              |
| `loading`                                 | 只读布尔（内部取数中 ∪ options.loading）                                                                                |
| `error`                                   | 只读错误投影（内部 onLoad 失败优先，其次 options.error）                                                                |
| `reload(resetPage?)`                      | 重新取数/重同步数据源；`resetPage` 为真时先回到第 1 页                                                                  |
| `toggleSort(key)`                         | 排序三态切换：无 → asc → desc → 取消                                                                                    |
| `setPageIndex(n)` / `setPageSize(n)`      | 1-based 页码（越界按 `pageCount` 钳制）；改每页条数默认归位第 1 页（`resetPageOnPageSizeChange: false` 时保首行）       |
| `selection`                               | 只读选中行投影 `{ value: T[], enabled, type, width }`；行对象按「当前窗口 → 已驻留选中行 → 桩对象」解析（含跨页保留行） |
| `selectedKeys`                            | 只读选中主键集合 `Ref<Set<string>>`                                                                                     |
| `setSelection(keys)` / `clearSelection()` | 程序化设置/清空选中集                                                                                                   |
| `toggleRowSelected(key, checked)`         | 行控件切换；radio 受 `cancelable` 约束                                                                                  |
| `search`                                  | 校验后的搜索表单定义（未配置或被忽略时为 `undefined`），供组件渲染搜索区                                                |
| `draggable`                               | 解析后的行拖拽配置（冲突被忽略时为 `undefined`）                                                                        |
| `reorderRows(from, to)`                   | 页内重排动作（0-based 页内索引）；返回 `drag-sort` 载荷，守卫不通过时 `undefined`                                       |

辅助函数 `defineColumns<T>(columns)`：可选的类型辅助（便于把列配置抽到独立文件），入参为列节点树（叶子或分组），纯类型推导、原样返回——裸数组同样可直接传给 `defineTable`。

### 对齐规则

- **默认居中**：未配置 `align` 时，业务列单元格与表头默认水平居中（表头/表体一致）；显式 `"left"` / `"right"` 覆盖默认。
- **选择列恒居中**：checkbox/radio 窄列不随 `align` 配置，表头与表体控件始终居中。
- **操作列按钮组**：`r.button()` 渲染的按钮组为行内级（inline-flex），随单元格 `align` 对齐。
- **树形首列恒左对齐**：启用 `tree` 后首列内容（缩进 + caret 槽位 + 标签）强制贴左，列上的 `align` 对该列不生效；表头首列同步，caret 槽位固定以保证同层级标签左边缘对齐。

### 类型速查

#### `TableColumnOptions<T>`

| 字段           | 类型                                       | 说明                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`          | `string`                                   | 列标识，同时作为默认取值字段                                                                                                                                                                                                                                                          |
| `title`        | `string`                                   | 表头文本                                                                                                                                                                                                                                                                              |
| `align?`       | `"left" \| "center" \| "right"`            | 单元格对齐；默认居中（表头/表体一致），显式 `"left"` 退出默认；树形首列恒左对齐，此字段对该列无效                                                                                                                                                                                     |
| `width?`       | `number \| string`                         | 列宽                                                                                                                                                                                                                                                                                  |
| `render?`      | `(r: ColumnRenders<T>) => ColumnRender<T>` | 自定义渲染器**工厂**：返回 `(record, index, column, context?) => VNodeChild`；`index` 为数据源下标，`context` 提供 `{ pageRowIndex, pageIndex, pageSize }`。优先于 `formatter`；内置 `r.dict(...)` / `r.button(...)` / `r.date(...)` 即此形态，第三参 `column` 供内置渲染器读取字段值 |
| `formatter?`   | `(record: T) => string \| number \| Date`  | 纯数据格式化                                                                                                                                                                                                                                                                          |
| `ellipsis?`    | `boolean \| "tooltip"`                     | 截断处理：`true` = truncate + 原生 title；`"tooltip"` = 库内 Tooltip（无原生 title），见下方行为细则                                                                                                                                                                                  |
| `sortable?`    | `boolean`                                  | 是否可排序（渲染为 `<button>`，带 `aria-sort`）                                                                                                                                                                                                                                       |
| `defaultSort?` | `"asc" \| "desc"`                          | 初始排序方向；须同时 `sortable: true`                                                                                                                                                                                                                                                 |
| `fixed?`       | `"left" \| "right"`                        | 固定列方向；须同时提供数字 `width`（见[固定列](#固定列)）                                                                                                                                                                                                                             |

取值优先级：`render` > `formatter` > `record[key]`（`null`/`undefined` 显示为空）。

#### `TableColumnGroupOptions<T>` / `TableColumnNode<T>`

| 字段       | 类型                            | 说明                                 |
| ---------- | ------------------------------- | ------------------------------------ |
| `title`    | `string`                        | 分组标题（表头单元格文本）           |
| `align?`   | `"left" \| "center" \| "right"` | 分组单元格对齐；默认居中             |
| `children` | `TableColumnNode<T>[]`          | 子列节点（叶子或更深分组），任意层级 |

`TableColumnNode<T> = TableColumnOptions<T> | TableColumnGroupOptions<T>`——`columns` 的元素类型（见[表头分组](#表头分组)）。

#### `TableContextTarget<T>`

右键目标判别联合（九态），由 `ctx.target.kind` 收窄；字段随 kind 不同：

| kind                                                              | 字段                                                                                       | origin                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `"table"` / `"empty"` / `"error"` / `"skeleton"` / `"pagination"` | 无额外字段                                                                                 | 表格空白处 / 空态 / 错误态 / 骨架 / 分页条      |
| `"header"`                                                        | `columnKey?`（叶子）/ `groupPath?`（分组）/ `node`                                         | `th[data-column-key]` / `th[data-column-group]` |
| `"row"`                                                           | `record` / `index` / `rowKey`                                                              | `tr[data-row-key]`                              |
| `"cell"`                                                          | `record` / `index` / `rowKey` / `columnKey` / `rawValue`（=`record[columnKey]`，非 VNode） | `td[data-column-key]`                           |

#### `TableContextMenuContext<T>`

| 字段          | 类型                               | 说明                                               |
| ------------- | ---------------------------------- | -------------------------------------------------- |
| `target`      | `TableContextTarget<T>`            | 九态目标（见上）                                   |
| `event`       | `MouseEvent`                       | 原始右键事件（可用于 `preventDefault()` 或读坐标） |
| `selection`   | `{ keys: string[]; rows: T[] }`    | 当前页选中快照（跨页选中行不在 `rows` 内）         |
| `visibleKeys` | `readonly string[]`                | 当前可见列 key（columns 原序）                     |
| `columns`     | `readonly TableColumnOptions<T>[]` | 扁平叶子列配置                                     |
| `close`       | `() => void`                       | 关闭菜单（内部通常已先关后执行）                   |

#### `TableMenuItem<T>`

| 形态                             | 字段                                                      | 说明                                          |
| -------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| 普通项（`type` 缺省为 `"item"`） | `value` / `label` / `disabled?` / `onSelect?`             | `onSelect` 缺省时点击发 `context-menu-select` |
| 说明行                           | `{ type: "label"; label }`                                | 纯文本，不可点                                |
| 分隔线                           | `{ type: "separator" }`                                   | —                                             |
| 分组                             | `{ type: "group"; label?; children: TableMenuItem<T>[] }` | 子菜单/分组                                   |

`defaultTableMenuItems(ctx, options)` 返回默认项数组（列设置… / 重置列 / 显示全部列），选项含 `columnSettingsEnabled` / `hasDefaultVisibleKeys` 与三个动作回调。

#### `TableLoadParams<T>`

| 字段     | 类型                                  | 说明                                                                                      |
| -------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `page`   | `PageableOptions`                     | `{ pageIndex(1-based), pageSize, total, pageSizeOpts }`；`total` 为上一次值，仅供请求参考 |
| `sort?`  | `SortableOptions`                     | 无排序或已取消排序时为 `undefined`                                                        |
| `form`   | `Record<string, unknown>`             | 搜索表单当前值；未配置 `search` 时为 `{}`                                                 |
| `update` | `(data: T[], total?: number) => void` | 回写数据；`total` 缺省时保留旧值                                                          |

## 常见问题

- **为什么我的布尔枚举映射不生效？** —— `Record` 的键约束不支持 `boolean`，把字段规整为 `0`/`1` 或字符串（`"true"`/`"false"`）再配 `dict`。
- **点了操作列按钮，行点击也触发了？** —— 行点击绑在 `<tr>` 上，按钮点击会冒泡；操作列与 `row-click` 并存时需在行点击处理器中区分来源（事件目标是否在操作列单元格内）。例外：`confirm` 确认气泡的「确定/取消」钮在 Teleport 面板内，点击不冒泡到行。
- **`onClick` 能拿到事件对象吗？** —— 不能，回调签名是 `(record, index)`。这是有意收敛：需要事件的特殊场景请用自定义 `render` 完全接管。
- **`date` 的时区行为是什么？** —— 走浏览器本地时区解析与显示；服务端返回 UTC 字符串且需要固定时区展示时，请先在自己的数据层转换为目标时区的 `Date`。
- **`serial` 翻页后重头计数正常吗？** —— 正常，这是页内序号的设计语义（`pageRowIndex + base`）；跨页连续序号可用渲染上下文 `(pageIndex - 1) * pageSize + pageRowIndex + base`，树形/变长页按实际可见行校正。
- **外置了查询按钮但点击没反应？** —— `show-search="false"` 后内置 `search` / `reset` 事件不再触发（二者由内置搜索区发出）；外层按钮请直接调 `table.reload(true)`（需校验时用 `await table.search.submit()`）。
- **`TTablePagination` 的 `definition` 和手动 props 同时传了？** —— definition 优先并 DEV 警告；混传没有意义，二选一。
- **金额带千分位但想要 `1,234.50`（无货币符号）？** —— `currency` 固定走货币格式；纯千分位请自定义 `render` 用 `Intl.NumberFormat({ style: "decimal" })`。
- **右键没有出现命令菜单？** —— 先确认 `contextMenu` 已显式开启（默认 `false`）；再看是否在 `input` / `textarea` / `select` / `[contenteditable]` / `[data-no-table-menu]` 区域内（这些区域一律不接管），或业务行处理器已 `event.preventDefault()`；自定义函数返回 `[]`、或 `contextMenu: true` 且 `columnSettings: false` 时不会打开菜单（DEV 下会警告一次）。
- **原生右键菜单怎么不见了？** —— 启用 `contextMenu` 后表格区域右键由组件接管（含 items 为空的区域），原生菜单被屏蔽。需要对某些单元格/区域恢复原生菜单，请在其元素上标 `data-no-table-menu`；表单控件区内始终保留原生菜单。
- **页面滚动后菜单为什么还贴着原来的行？** —— 这是预期行为：菜单以表格根节点为基准绝对定位，随表格滚动；表体滚动容器滚动时则直接关闭菜单与列设置面板。
- **表头 `⋮` 找不到？** —— 需显式 `columnSettingsPlacement="header"`；`⋮` 平时按 `group-hover` / `focus-visible` 显示（触屏设备常显），且只在叶子表头渲染。
- **列显隐怎么持久化？** —— 监听 `column-visibility-change`（受控/非受控都触发）写入 localStorage/后端；恢复时作为 `visibleKeys` 或 `defaultVisibleKeys` 传入。`update:visible-keys` 配对回写即 `v-model:visible-keys`。
- **右键菜单在 Dialog/Drawer 里被裁掉？** —— 菜单与列设置面板都无 Teleport（面板为随表格滚动而 `portal=false`），嵌在 `overflow: hidden` 的浮层内可能被裁剪；此场景请改用工具栏/表头入口，或把 `contextMenu` 关闭由业务自建浮层。

## 注意事项

- **须在 `setup` 中调用 `defineTable`**：TanStack `useTable` 依赖组件挂载。拆分式 props 则无此限制（内核在 TableRender 内部创建）。
- **两种模式互斥**：同时传 `onLoad` 与 `data` 时按服务端模式处理，并在 DEV 下给出警告。
- **`onLoad` 抛错不会打断表格**：内部 `console.error` 并保持空态，请在自己的 `onLoad` 里做错误提示。
- **竞态已内置**：同一表格的多次取数带序号守卫，先发后到的旧响应不会覆盖新结果，无需自行 debounce（但也不会替你做节流）。
- **页码越界自动钳制**：服务端 total 缩水、树形收起、改每页条数等导致页数减少时，页码钳制到有效页；受控模式会经 `update:page-index` 回写修正值（聚合式仅 `defineTable` ref 受控同样生效）。
- **`data` 快照语义**：普通数组为快照（原地修改后调用 `reload()` 可重同步；整体替换外部变量不会被感知）。需要响应式/异步数据请传 `ref`/getter；深改嵌套后调用 `reload()` 或整体替换顶层引用。
- **排序改的是页码**：服务端模式下切换排序会自动回到第 1 页；`setPageSize` 默认同样归位第 1 页，`resetPageOnPageSizeChange: false` 时改为保持当前首行（v9 语义）。
- **本地分页的 total 口径**：静态模式 `page.total` = 引擎可见行数（树形默认含展开子行；`tree.paginateExpandedRows: false` 时为顶层行数），随展开/收起变化；服务端模式仍为 `update(data, total)` 回写值。分页条可见性与页码窗口统一看 `page.pageCount`（手工构造 definition 时按 `ceil(total/pageSize)` 兜底）。
- **`rowKey` 字段缺失**时按行索引兜底，并在 DEV 下警告一次（仅一次，不会刷屏）；但**行选择场景例外**：rowKey 无效时禁用选择而非兜底（索引作行 id 会跨页串选）。
- **固定列需要数字 `width`**：`fixed` 列缺数字宽度时 DEV 警告并按普通列渲染（sticky 偏移无法从字符串/百分比宽度推算）；固定列是纯渲染层 sticky，不写 TanStack pinning 状态。
- **虚拟滚动需要 `height`**：`virtual: true` 缺容器高度时 DEV 警告并降级普通渲染；大分页（如 `pageSize: 10000`）配合虚拟化使用，避免窗口外行进入 DOM。
- **树形数据的展开是纯客户端状态**：children 随行数据返回即可；`tree` 配置无效（非对象 / `childrenKey` 非字符串）时 DEV 警告并忽略。父子级联勾选、受控 expanded、详情展开行暂不支持。
- **列显隐基于可见列集**：隐藏 fixed 列后 sticky 偏移自动重算（组空无残留边框）；`columnSettings: false` 只隐藏 UI，受控 `visibleKeys` 不受影响；显隐不触发 onLoad、不重置分页/排序/选择。
- **列设置是单例**：三个入口共享同一个面板实例与状态；`columnSettingsPlacement="header"` 时顶栏入口关闭（二者互斥），`auto` 与 `toolbar` 等价。
- **右键命令菜单默认关闭**：开启后只接管表格自身区域；表单控件区、`[data-no-table-menu]`、菜单自身与已 `preventDefault()` 的右键一律交还原生/业务。行级 `row-contextmenu` 载荷与触发不变，两者可并存。
- **复制 / 导出不在内置范围**：`ctx.target.rawValue`、`ctx.visibleKeys`、`ctx.selection` 已随上下文提供，动作由业务在 `onSelect` 内实现（服务端全量数据同理）。
- **`ellipsis: "tooltip"`**：单元格改用库内 Tooltip（悬停显示完整文本），不再设置原生 `title`；`render` 工厂列同样支持（VNode 经 cloneVNode 复制进 Tooltip，交互保持）；树形缩进列暂不支持 tooltip 形态（请用 `ellipsis: true`）。
- **错误态来源**：服务端 `onLoad` 失败自动产生；静态模式可通过 `defineTable({ error })` 注入。`#error` 插槽可完全自定义占位，重试即 `reload()`（外部错误需调用方清除）。
- **`TTablePagination` 两种模式的可见性语义不同**：`definition` 模式单页自隐藏；手动模式恒渲染（缺关键 props 时 DEV 警告并不渲染），可见性由使用方控制。
- **DEV 兜底提示**：`columns` 为空、`data` 非数组、`defaultSort` 未配 `sortable`、`search` 用于静态模式等都会在控制台提示并降级运行；生产构建静默。
- 暂不支持：列宽拖拽、导出、编辑态、`image`/`progress` 渲染器、跨页连续序号。

## 主题定制

表格本体直接使用以下 CSS 变量（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `--background`                       | sticky 固定列单元格底色（防滚动透出）                           |
| `--border`                           | 行分隔线、sticky 组交界分隔边框、分页条与页码按钮边框           |
| `--muted`                            | 行 hover 底色（`hover:bg-muted/50`）；树形展开按钮 hover        |
| `--muted-foreground`                 | 表头文字、空态 / 错误占位文字、树形 caret、列设置与分页统计文字 |
| `--foreground`                       | 表头排序按钮、列设置「全选 / 重置」hover 文字                   |
| `--accent`                           | 列设置面板选项 hover 底色（`hover:bg-accent/50`）               |
| `--primary` / `--primary-foreground` | 分页当前页码高亮（`data-[selected]:bg-primary` 等）             |
| `--radius`                           | 圆角基准（分页按钮 / 每页条数下拉的 `rounded-md` 派生）         |

行选择 Checkbox、操作列 Button、列设置 Popover、搜索区 FormRender 等由内部引用组件承接样式，主题变量见对应文档。

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TTableRender :definition="table" row-key="id" />
</div>
```
