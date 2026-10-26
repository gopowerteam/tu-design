# TableRender 内置列渲染器（columnRenders）设计

> 对标 x-render `table-render/src/table-columns` 的 12 个内置列渲染器；经用户确认：
> [变更记录 2026-10-15] 实现演进为 `(r) => r.xxx()` 工厂形态：`column.render` 类型为
> `(r: ColumnRenders<T>) => ColumnRender<T>`，`r` 由 `defineTable<T>` 列类型自动推断，
> 无需手动 `columnRenders<Order>()`（原文示例保留为设计时快照，旧写法已废弃）。
> 原始决策：> API 采用 `columnRenders<T>()` 工厂形态（与 FormRender 的 `r.input()` 范式共词根），
> v1 范围为核心 5 个：**dict / date / currency / serial / button**。

## 一、动机

现有 `TableColumnOptions.render: (record, index) => VNodeChild` 是完全自定义口，
dict 状态映射、日期/货币格式化、操作列按钮均为高频样板（每处需手写 `h(Badge, …)` /
`Intl.NumberFormat` 等）。x-render 以工厂函数提供预设，本设计引入同能力、Vue 形态。

与 x-render 的差异（有意为之）：

| x-render                                                | 本设计                                               | 原因                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `TableColumnRenders<T>()` 集合对象                      | `columnRenders<T>()` 单数命名                        | 与 FormRender widget 范式（`render: (r) => r.input()`）共词根，D10                                          |
| `createColumnRender` 打 `$type/$disableColumnMode` 标记 | 无标记，工厂直接返回 `(record, index) => VNodeChild` | 我们无列模式/视图模式切换；返回值即现有 render 签名，零管道                                                 |
| 12 个渲染器（含 image/progress/tag/text/render）        | 5 个                                                 | tag 并入 dict（带 Badge 变体）、text 即默认取值、render 即现有自定义口；image/progress 库内无对应组件，二期 |

## 二、API

```ts
import { columnRenders, defineTable } from "@tu-design/vue";

const r = columnRenders<Order>();

defineTable<Order>({
  columns: [
    {
      key: "status",
      title: "状态",
      render: r.dict({ paid: "已付款", pending: { label: "待付款", variant: "outline" } }),
    },
    { key: "createdAt", title: "日期", render: r.date("yyyy-MM-dd HH:mm") },
    { key: "amount", title: "金额", render: r.currency("CNY") },
    { key: "index", title: "#", render: r.serial() },
    { key: "ops", title: "操作", render: r.button([{ text: "编辑", onClick: edit }, "删除"]) },
  ],
});
```

放置位置：`packages/vue/src/components/table-render/column-renders.ts`，
由 `table-render/index.ts` 导出 `columnRenders` 与相关类型。

## 三、各渲染器语义（验收口径）

所有渲染器返回 `(record: T, index: number) => VNodeChild`，可直接填入 `column.render`。

### 1. `r.dict(mapping, options?)`

- `mapping: Record<string | number | boolean, string | { label: string; variant?: BadgeVariant }>`
- 命中 → 文本（或 `Badge`，当条目带 `variant` 或 `options.badge === true` 时）；未命中 → 原样显示值（与 x-render `dict.get(value) || value` 一致）
- `options.badge?: BadgeVariant | true`：整列统一 Badge 形态时的简写；条目级 `variant` 优先

### 2. `r.date(pattern = "yyyy-MM-dd")`

- 输入 `Date | string | number`；非法输入（NaN/无法解析）→ 原样显示，不抛错
- 支持令牌：`yyyy` `MM` `dd` `HH` `mm` `ss`（内置迷你格式化，不引入 date-fns）
- `MM/dd/HH/mm/ss` 均补零

### 3. `r.currency(currencyCode = "CNY", locale?)`

- `Intl.NumberFormat(locale ?? "zh-CN", { style: "currency", currency: currencyCode })`
- 输入 `string | number`；非法（NaN）→ 原样显示

### 4. `r.serial(base = 1)`

- 显示 `index + base`（默认 1 起序号；配合分页为页内序号，跨页连续序号属二期）

### 5. `r.button(items)`

- `items: Array<TableActionButton<T>>`：
  `{ text: string | ((record, index) => string); onClick?: (record, index) => void; variant?: ButtonVariants["variant"]; disabled?: (record, index) => boolean }`
  或字符串简写（等价 `{ text }`）
- 渲染 `flex items-center gap-1` 的 `Button variant="link" size="sm"` 行；空数组返回空字符串
- 无事件、无受控状态——纯展示工厂，组件无新增响应式依赖

## 四、类型清单（全部由 `column-renders.ts` 导出）

`ColumnRenders<T>`（工厂返回值）、`DictColumnMapping`、`DictColumnOptions`、
`DateColumnOptions`、`CurrencyColumnOptions`、`SerialColumnOptions`、`TableActionButton<T>`。

## 五、测试矩阵（TDD，先行失败用例）

1. dict：命中映射渲染 label；带 variant 条目渲染 Badge；未命中显示原始值；`options.badge: true` 整列 Badge
2. date：`Date`/ISO 字符串/时间戳按 pattern 格式化；非法输入原样显示；默认 pattern
3. currency：CNY 默认；自定义 currency/locale；NaN 原样
4. serial：默认从 1 起；base 生效
5. button：字符串简写渲染文本；onClick 收到 `(record, index)`；disabled 函数生效；空数组不渲染节点
6. 集成：经 `defineTable` 列配置进入 TableRender 后各渲染器真实渲染（挂载组件）

## 六、交付物

- `column-renders.ts` + `ColumnRenders.test.ts`
- `table-render/index.ts` 导出；`resolver.test.ts` nonComponentExports 追加 `columnRenders`
- `generate:registry` 重生成
- 文档：`table-render.md` API 增「内置列渲染器」节 + `StaticTableDemo` 的手写 Badge/Button 样板替换为 `r.dict`/`r.button`
