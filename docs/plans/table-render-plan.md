# TableRender 落地方案 v7.1（定稿，替代 v6）

> 任务：t-mv942296-y5ajsn「新增：开发Table组件功能」
> 参考实现：`x-render/packages/table-render`（Arco 版高阶表格，仅数据协议层同构）
> 本库范式：FormRender（TanStack 无头引擎 + `defineXxx` 聚合入口 + Render 组件双模式）
> 状态：用户已批准，worktree `feat/table-render` 实施中

## 0. 已核实的技术前提

| 前提              | 结论                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Ark UI Table 原语 | ❌ 无 → 原生语义 `<table>` + tokens 类                                                      |
| Ark UI Pagination | ✅ `Root/Item/PrevTrigger/NextTrigger/FirstTrigger/LastTrigger/Ellipsis`（5.39.2 实测导出） |
| 新增依赖          | 仅 `@tanstack/vue-table@^8.21.3`，已入 catalog 并安装                                       |
| 本库范式          | FormRender：`definition ?? 拆分 props` 归一 + DEV 警告 + `defineForm` 包 `useFormRender`    |
| 测试基建          | `@vue/test-utils` + `happy-dom`，`cd packages/vue && vp test --run <filter>`                |
| registry          | 改组件后必须 `vp run generate:registry`；resolver 白名单与 index.ts 同步                    |

## 1. 设计决策汇总

| #   | 决策                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | 命名 `defineTable`（聚合入口），同构 `defineForm`                                                                                                                                                                                                                                                            |
| D2  | 回调命名 `onLoad`（on* = 事件函数，同 `onSubmit`）                                                                                                                                                                                                                                                           |
| D3  | `defineColumns` 保留为类型助手；**移除** `defineTableLoad`                                                                                                                                                                                                                                                   |
| D4  | 双模式渲染：`:definition`（推荐）+ `:columns`/`:on-load`/`:data` 拆分式                                                                                                                                                                                                                                      |
| D5  | 交互/可视层用 Ark 原语 + 现有组件（Skeleton/Button），风格零漂移                                                                                                                                                                                                                                             |
| D6  | 数据协议层与 x-render 同构（columns/onLoad/page/sort/update、rowKey、autoLoad、reload）                                                                                                                                                                                                                      |
| D7  | 二期预留：搜索表单联动、行选中、列固定、导出、编辑态、折叠列、虚拟滚动                                                                                                                                                                                                                                       |
| D8  | `defineColumns` **可选**：`defineTable<User>({ columns: [裸数组] })` 直传，泛型锚点提供上下文类型；`keyof T` 收窄用双臂 union 尽力（推断不佳则裸数组 `key: string`，强约束走 `defineColumns<User>()` 重载）                                                                                                  |
| D9  | `columns: () => [...]` 函数形式**不做**（无语法增益；响应式列需求走二期列级 `visible`）                                                                                                                                                                                                                      |
| D10 | **命名总纲（可读性定案）**：性质/能力 prop 用 `-able` 形容词族（`sortable`），事件回调用 `on*`（`onLoad`），配置值用名词；词根共享（`sortable`/`sort-change`/`defaultSort`/`toggleSort`）；不引入 `allow-*`。判据：词性槽位一致 > 正极性（`!disabled` 绑定无双重否定）> 取值扩展（形容词带补语）> 词根族共享 |
| D11 | emits 单向通知**非受控**（v-model 留二期）；骨架行固定 5 行；`page` 只读对象含 `pageSizeOpts`；不做 `pageLayouts`                                                                                                                                                                                            |
| D12 | 分页条：页码导航用 **Ark Pagination**，每页条数用**原生 `<select>`**（tokens 样式，shadcn table 分页同款）+「共 N 条」                                                                                                                                                                                       |

## 2. 分层与文件清单

```
defineTable / defineColumns      声明入口（setup 调用；defineTable 包 useTableRender）
        ↓
useTableRender(options)          数据服务：TanStack 组装、双模式、竞态守卫、分页/排序动作
        ↓
TableRender.vue                  渲染层（definition ?? useTableRender(props) 归一后渲染）
  └ TablePagination.vue          Ark Pagination + 原生 select + 总数
        ↓
@tanstack/vue-table              无头引擎
```

`packages/vue/src/components/table-render/`（9 文件）：

| 文件                  | 内容                                                   |
| --------------------- | ------------------------------------------------------ |
| `types.ts`            | §3 全部类型                                            |
| `define-columns.ts`   | `defineColumns<T>` 双重载身份函数                      |
| `define-table.ts`     | `defineTable<T>` 聚合入口                              |
| `useTableRender.ts`   | 核心逻辑（含 1-based ↔ TanStack 0-based 映射）         |
| `TableRender.vue`     | 表格渲染 + 排序表头 + 骨架/空态 + 事件                 |
| `TablePagination.vue` | D12 分页条                                             |
| `index.ts`            | 导出组件/函数/类型                                     |
| `registry.meta.json`  | registry 元数据（dependencies 声明 tanstack + ark-ui） |
| `TableRender.test.ts` | 12 项测试                                              |

配套改动：`src/index.ts` 追加导出、`resolver.ts` 白名单加 `TableRender`、`vp run generate:registry`。

## 3. 类型与 API 全量

```ts
export interface DataRecord {
  [key: string]: any;
}

export interface TableColumnOptions<T extends DataRecord = DataRecord> {
  key: string;
  title: string;
  align?: "left" | "center" | "right";
  width?: number | string;
  /** 自定义单元格，优先级高于 formatter > 默认 String(value) */
  render?: (record: T, index: number) => VNodeChild;
  formatter?: (record: T) => string | number | Date | undefined;
  ellipsis?: boolean;
  sortable?: boolean; // 能力开关
  defaultSort?: "asc" | "desc"; // 初始方向，需 sortable: true，否则 DEV 警告忽略
}

export interface PageableOptions {
  pageIndex: number; // 1-based（对外 API 唯一口径）
  pageSize: number;
  total: number;
  pageSizeOpts: number[];
}
export interface SortableOptions {
  key: string;
  direction: "asc" | "desc";
}

export interface TableLoadParams<T extends DataRecord = DataRecord> {
  form: DataRecord; // v1 恒 {}
  page: PageableOptions;
  sort?: SortableOptions; // 无排序/已取消时 undefined
  update: (data: T[], total?: number) => void; // total 缺省 → 保留旧值
}

export interface DefineTableOptions<T extends DataRecord = DataRecord> {
  columns: TableColumnOptions<T>[];
  onLoad?: (params: TableLoadParams<T>) => void | Promise<any>;
  data?: T[];
  autoLoad?: boolean; // 默认 true，仅服务端模式
  pageSize?: number; // 默认 10
  pageSizeOpts?: number[]; // 默认 [10, 20, 50, 100]
}

export interface TableRenderDefinition<T extends DataRecord = DataRecord> {
  columns: TableColumnOptions<T>[];
  table: Table<T>; // TanStack 实例（逃逸舱口）
  page: Readonly<PageableOptions>;
  sort: Readonly<Ref<SortableOptions | undefined>>;
  loading: Readonly<Ref<boolean>>;
  reload: (resetPage?: boolean) => void;
  toggleSort: (key: string) => void;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
}
```

```ts
// TableRender.vue —— 运行时 props 声明，boolean 一律 default: undefined 禁 casting（FormRender 约定）
props: {
  definition?: TableRenderDefinition
  rowKey: string                              // 必填
  columns?: TableColumnOptions[]
  onLoad?: (params: TableLoadParams) => void | Promise<any>
  data?: DataRecord[]
  autoLoad?: boolean | undefined              // undefined → 内部默认 true
  pageSize?: number
  pageSizeOpts?: number[]
  loading?: boolean | undefined               // 外部加载态叠加
  emptyText?: string                          // 默认 "暂无数据"
}
emits: "update:page-index"(n) / "update:page-size"(n) / "sort-change"(sort | undefined)
       / "row-click"(record, index, event)
slots: #empty
expose: 归一实例（page/sort/loading/table/reload/setPageIndex/setPageSize/toggleSort）
```

## 4. 双模式判定与状态归一

```
definition 传？──是→ 聚合模式（columns/onLoad/data 等拆分 props 全忽略）
                └─否→ onLoad 传？──是→ 服务端（manualPagination + manualSorting）
                        └─否→ data 传？──是→ 静态（getPaginationRowModel + getSortedRowModel）
                                └─否→ DEV 警告，渲染空表
```

- 冲突警告：definition+columns → definition 优先 + DEV 警告；onLoad+data → onLoad 优先 + DEV 警告（前缀 `[tu-design] <TableRender> ...`）
- definition/拆分**不支持运行时切换**（setup 一次性读取，FormRender 同款）
- 0/1 基映射：对外 `page.pageIndex` 恒 1-based；喂 TanStack 时 `state.pagination.pageIndex = page.pageIndex - 1`，服务端模式 `pageCount = Math.ceil(total / pageSize)`
- `defaultSort`：静态模式 → TanStack 初始 `sorting` state；服务端模式 → 首次 onLoad 的 `sort` 参数；多列 defaultSort 仅首个生效 + DEV 警告一次

## 5. 行为规则表

| #   | 规则                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------- |
| R1  | `columns` 空 → DEV 警告 + 空表不抛错                                                                                      |
| R2  | `data` 非数组 → 回退 `[]` + DEV 警告                                                                                      |
| R3  | `rowKey` 值缺失 → `getRowId` 索引兜底；字段缺失 → 索引 + DEV 警告**一次**                                                 |
| R4  | definition/columns、onLoad/data 冲突 → 优先级 + DEV 警告                                                                  |
| R5  | `onLoad` 抛错 → 捕获 + `console.error` + 保持空态，不炸组件                                                               |
| R6  | 竞态守卫：自增请求序号，旧响应丢弃                                                                                        |
| R7  | `defaultSort` 无 `sortable: true` → DEV 警告并忽略                                                                        |
| R8  | 排序三态 `无 → asc → desc → 无`；服务端模式每次变化：`pageIndex=1` + 重调 onLoad + `sort-change`；取消时 `sort=undefined` |
| R9  | `pageSize` 变更 → `pageIndex=1`                                                                                           |
| R10 | `update(data, total?)`：total 缺省保留旧值                                                                                |
| R11 | `autoLoad`（默认 true）：服务端模式 onMounted 触发一次                                                                    |
| R12 | `reload(resetPage = false)`：true → 先 `pageIndex=1`；静态模式仅重同步 data                                               |
| R13 | 单页（`ceil(total/pageSize) ≤ 1` / 静态 `rows.length ≤ pageSize`）→ 隐藏分页条                                            |
| R14 | 加载态 = 内部 loading ∪ `props.loading` → **5 行** Skeleton 骨架                                                          |
| R15 | `ellipsis` → `truncate` 类 + 原生 `title` 属性                                                                            |
| R16 | 可达性：排序表头 `<button>` + `aria-sort="ascending/descending"`（未排序不加）+ 原生键盘                                  |
| R17 | 单元格取值链：`render > formatter > String(record[key] ?? "")`                                                            |

## 6. 测试矩阵（12 项）

| #   | 用例                                                                              |
| --- | --------------------------------------------------------------------------------- |
| 1   | 基础渲染：title 表头 / formatter / 默认取值（R17）                                |
| 2   | `render` VNode 渲染与交互                                                         |
| 3   | 静态模式：本地分页（R9）与本地排序三态（R8）                                      |
| 4   | 服务端模式：autoLoad 触发 onLoad；`update` 回写渲染与 total（R10/R11）            |
| 5   | 分页交互：翻页 → onLoad 收到新 pageIndex                                          |
| 6   | 排序交互：onLoad 收到 `{key, direction}` 且 pageIndex 重置；取消 → undefined      |
| 7   | 竞态：慢旧响应不覆盖新响应（R6）                                                  |
| 8   | onLoad 抛错 → 空态 + console.error（R5）                                          |
| 9   | DEV 警告组：columns 空 / data 非数组 / 冲突传参 / defaultSort 非法（R1/R2/R4/R7） |
| 10  | ellipsis → title 属性（R15）                                                      |
| 11  | loading 骨架行 ∪ 外部 loading（R14）                                              |
| 12  | `reload(true)` 重置页码重载 + `row-click` + `#empty` 插槽                         |

## 7. 实施步骤（TDD，红→绿每轮）

1. 本文档落盘并提交
2. **轮次 A**：types + defineColumns + useTableRender 静态模式 → 用例 1/3 红→绿
3. **轮次 B**：服务端模式（onLoad/竞态/错误）→ 用例 4–8 红→绿
4. **轮次 C**：TablePagination + 交互（reload/row-click/#empty/ellipsis/loading）→ 用例 5/10/11/12 红→绿
5. **轮次 D**：DEV 警告与兜底 → 用例 9 红→绿
6. 验收链：`cd packages/vue && vp test --run TableRender` → `vp check` → `vp run -r typecheck` → `vp test` → `vp run generate:registry`
7. 交接：执行报告 → 评论 → 勾选 3 项 DoD → 移 in_review

## 8. 二期预留

搜索表单联动（FormRender/列 `form`）、行选中、列固定、导出、编辑态、折叠列、虚拟滚动、列级 `visible` 动态显隐、受控 `v-model:page-index/page-size`、分页条 `pageLayouts`。

## 9. 风险与缓解

| 风险                         | 缓解                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| TanStack 泛型 + vue-tsc 推断 | 显式标注（FormRender `useForm<T, any×11>` 已有先例）         |
| Ark Pagination 受控语义      | 实现时以 dist 类型为准，TablePagination 内部消化             |
| keyof 双臂 union 推断不佳    | 已声明兜底：裸数组 `key: string`，收窄走 defineColumns（D8） |
