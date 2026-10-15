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

## 安装

```bash
npx tu-design add table-render
```

会自动安装 `@tanstack/vue-table` 与 `@ark-ui/vue`。

## 用法

### 聚合式（推荐）

`defineTable` 须在组件 `setup` 中调用（TanStack `useVueTable` 依赖组件挂载），返回值直接传给 `:definition`：

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

### 拆分式

不想（或不能）在 `setup` 里建内核时，可直接把配置拆成 props（`definition` 优先，存在时忽略其余）：

```vue
<TableRender row-key="id" :columns="columns" :data="users" />
```

## API

按「入口函数 → 组件 → 数据类型」三组组织；单元格预设见下一节 [内置列渲染器](#内置列渲染器)。

### `defineTable<T>(config)` / `useTableRender(options)`

`defineTable` 是 `useTableRender` 的聚合别名（后者供「已有内核、动态切换数据源」的场景）。两者均须在组件 `setup` 中调用。

| config 字段     | 类型                                              | 默认             | 说明                                       |
| --------------- | ------------------------------------------------- | ---------------- | ------------------------------------------ |
| `columns`       | `TableColumnOptions<T>[]`                         | —                | 列配置；`key` 为取值字段                   |
| `data?`         | `T[] \| Ref \| () => T[]`                         | —                | 静态模式数据源；ref/getter 自动跟随        |
| `onLoad?`       | `(params: TableLoadParams<T>) => void \| Promise` | —                | 服务端模式数据源；与 `data` 冲突时以此为准 |
| `autoLoad?`     | `boolean`                                         | `true`           | 挂载后是否自动取数（仅服务端模式生效）     |
| `pageSize?`     | `number`                                          | `10`             | 每页条数                                   |
| `pageSizeOpts?` | `number[]`                                        | `[10,20,50,100]` | 每页条数下拉选项                           |

返回 `TableRenderDefinition<T>`：

| 字段                                 | 说明                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| `columns`                            | 列配置                                                           |
| `table`                              | TanStack 表格实例（逃逸舱口：列聚合、rowSelection 等）           |
| `page`                               | 只读投影 `{ pageIndex(1-based), pageSize, total, pageSizeOpts }` |
| `sort`                               | 只读投影 `{ key, direction } \| undefined`                       |
| `loading`                            | 只读布尔（内部取数中）                                           |
| `reload(resetPage?)`                 | 重新取数/重同步数据源；`resetPage` 为真时先回到第 1 页           |
| `toggleSort(key)`                    | 排序三态切换：无 → asc → desc → 取消                             |
| `setPageIndex(n)` / `setPageSize(n)` | 1-based 页码；改每页条数会归位到第 1 页                          |

辅助函数 `defineColumns<T>(columns)`：可选的类型辅助（便于把列配置抽到独立文件），纯类型推导、原样返回——裸数组同样可直接传给 `defineTable`。

### `TableRender` props

| prop                        | 类型                    | 默认       | 说明                                |
| --------------------------- | ----------------------- | ---------- | ----------------------------------- |
| `definition`                | `TableRenderDefinition` | —          | 聚合式内核（优先于其余 props）      |
| `rowKey`                    | `string`                | **必填**   | 行主键字段名                        |
| `columns`                   | `TableColumnOptions[]`  | —          | 拆分式列配置                        |
| `onLoad`                    | 见上                    | —          | 拆分式数据源                        |
| `data`                      | `T[]`                   | —          | 拆分式静态数据源                    |
| `autoLoad`                  | `boolean`               | `true`     | 同 config                           |
| `pageSize` / `pageSizeOpts` | `number` / `number[]`   | 同 config  | 同 config                           |
| `loading`                   | `boolean`               | —          | 外部受控加载态，与内部 loading 取或 |
| `emptyText`                 | `string`                | `暂无数据` | 空态文案（`#empty` 插槽优先）       |

事件：`update:page-index` / `update:page-size`（单向通知，非受控）、`sort-change`、`row-click`（`(record, index, event)`）。
插槽：`empty`（空态）、以及列 `render` 返回的任意 VNode（完全自定义逃逸口）。

### 类型速查

#### `TableColumnOptions<T>`

| 字段           | 类型                                               | 说明                                                                     |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `key`          | `string`                                           | 列标识，同时作为默认取值字段                                             |
| `title`        | `string`                                           | 表头文本                                                                 |
| `align?`       | `"left" \| "center" \| "right"`                    | 单元格对齐                                                               |
| `width?`       | `number \| string`                                 | 列宽                                                                     |
| `render?`      | `(record: T, index: number, column) => VNodeChild` | 自定义单元格；优先于 `formatter`；第三参 `column` 供内置渲染器读取字段值 |
| `formatter?`   | `(record: T) => string \| number \| Date`          | 纯数据格式化                                                             |
| `ellipsis?`    | `boolean`                                          | 超宽截断 + 原生 `title` 提示                                             |
| `sortable?`    | `boolean`                                          | 是否可排序（渲染为 `<button>`，带 `aria-sort`）                          |
| `defaultSort?` | `"asc" \| "desc"`                                  | 初始排序方向；须同时 `sortable: true`                                    |

取值优先级：`render` > `formatter` > `record[key]`（`null`/`undefined` 显示为空）。

#### `TableLoadParams<T>`

| 字段     | 类型                                  | 说明                                                    |
| -------- | ------------------------------------- | ------------------------------------------------------- |
| `page`   | `PageableOptions`                     | `{ pageIndex(1-based), pageSize, total, pageSizeOpts }` |
| `sort?`  | `SortableOptions`                     | 无排序或已取消排序时为 `undefined`                      |
| `form`   | `Record<string, unknown>`             | 搜索表单值，**v1 恒为 `{}`**（二期接 FormRender）       |
| `update` | `(data: T[], total?: number) => void` | 回写数据；`total` 缺省时保留旧值                        |

## 内置列渲染器

`defineForm` 的 widget 有 `r.input()`，表格列同样有 `r`：`columnRenders<T>()` 返回 5 个预设单元格渲染器，返回值直接填入 `column.render`。高频样板——状态映射、日期/货币格式化、序号列、操作列——不再手写 `h(...)`。

```ts
import { columnRenders, defineTable } from "@tu-design/vue";

const r = columnRenders<Order>();

const table = defineTable<Order>({
  columns: [
    // 字典映射：未命中的值原样显示；条目带 variant 或 options.badge 时渲染 Badge
    {
      key: "status",
      title: "状态",
      render: r.dict({ paid: "已付款", pending: { label: "待付款", variant: "outline" } }),
    },
    // 日期：迷你令牌 yyyy MM dd HH mm ss（非法输入原样显示，不抛错）
    { key: "createdAt", title: "日期", render: r.date("yyyy-MM-dd HH:mm") },
    // 货币：Intl.NumberFormat，默认 CNY / zh-CN
    { key: "amount", title: "金额", render: r.currency("CNY") },
    // 序号：页内序号，默认从 1 起
    { key: "seq", title: "#", render: r.serial() },
    // 操作列：字符串简写或对象；onClick/disabled/text 均收到 (record, index)
    {
      key: "ops",
      title: "操作",
      render: r.button([{ text: "编辑", onClick: (row) => edit(row) }, "删除"]),
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

```ts
r.dict({ paid: "已付款", pending: { label: "待付款", variant: "outline" } });
```

### `r.date(pattern?)` — 日期格式化

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

```ts
r.date(); // "2026-01-15"
r.date("yyyy/MM/dd HH:mm"); // "2026/01/15 09:05"
```

### `r.currency(currency?, locale?)` — 货币格式化

| 参数       | 类型     | 默认    | 说明                      |
| ---------- | -------- | ------- | ------------------------- |
| `currency` | `string` | `CNY`   | ISO 4217 币种代码         |
| `locale`   | `string` | `zh-CN` | Intl 地区（决定符号位置） |

行为细则：

- 等价 `new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)`，输出如 `¥1,234.50`、`$1,234.50`
- 输入接受数字或数字字符串（`"1234.5"` 会被 `Number()` 转换）；**NaN / 非数字原样显示**
- 依赖运行时的 `Intl.NumberFormat`（现代浏览器均支持）

```ts
r.currency(); // ¥1,234.50
r.currency("USD", "en-US"); // $1,234.50
```

### `r.serial(base?)` — 序号列

| 参数   | 类型     | 默认 | 说明     |
| ------ | -------- | ---- | -------- |
| `base` | `number` | `1`  | 起始序号 |

行为细则：

- 显示 `index + base`；**翻页后从 `base` 重新计数（页内序号）**——跨页连续序号需要总行数偏移，属二期
- 不读取字段值，`key` 可为任意占位（如 `"seq"`）

### `r.button(items)` — 操作列

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

## 注意事项

- **须在 `setup` 中调用 `defineTable`**：TanStack `useVueTable` 依赖组件挂载。拆分式 props 则无此限制（内核在 TableRender 内部创建）。
- **两种模式互斥**：同时传 `onLoad` 与 `data` 时按服务端模式处理，并在 DEV 下给出警告。
- **`onLoad` 抛错不会打断表格**：内部 `console.error` 并保持空态，请在自己的 `onLoad` 里做错误提示。
- **竞态已内置**：同一表格的多次取数带序号守卫，先发后到的旧响应不会覆盖新结果，无需自行 debounce（但也不会替你做节流）。
- **排序改的是页码**：服务端模式下切换排序会自动回到第 1 页；`setPageSize` 同样归位第 1 页。
- **`rowKey` 字段缺失**时按行索引兜底，并在 DEV 下警告一次（仅一次，不会刷屏）。
- **DEV 兜底提示**：`columns` 为空、`data` 非数组、`defaultSort` 未配 `sortable` 等都会在控制台提示并降级运行；生产构建静默。
- 二期规划：搜索表单联动（`form` 接 FormRender）、行选择、列固定与显隐、列宽拖拽、导出、编辑态、`image`/`progress` 渲染器、跨页连续序号。
