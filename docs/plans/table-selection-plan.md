# TableRender 行选择（rowSelection）设计 v1（已实施）

> 任务：t-mv942296-y5ajsn「新增：开发Table组件功能」后续迭代。
> 前置：`table-render-plan.md` v7.1；对标 x-render `table-selection-render.tsx`（Arco 适配层）。
> 本稿为交叉验证后的修订版，修正三点：① 不依赖 TanStack 默认 row id（其为数组下标，跨页必串）；
> ② `Checkbox` 组件需放宽 `checked` 类型至 `boolean | 'indeterminate'`；③ 选择列注入需同步引擎列、
> 模板列数（空态 colspan、骨架行 td 数）两处。
> 规则编号续用 R 系列，选择专属行为用 **S 系列**（S1–S12），避免与既有 R1–R17 混排。
>
> **实施变更记录 2026-10-20**
>
> 1. 受控状态落地为自持 `rowSelectionState` ref（`get state()` 注入 + `onRowSelectionChange`
>    仅通知）。原方案"TanStack state 为真相源"在 vue-table 下不可行：`setRowSelection` 会回调
>    `onRowSelectionChange`，回调内再落盘即无限递归。
> 2. S4 守卫从 `onRowSelectionChange` 移入 `toggleRowSelected`（程序化 `clearSelection` 不受限）。
> 3. S10 表头三态由自身状态派生（`selectableKeys` ∩ `selectedKeys`）：TanStack
>    `getIsAllPageRowsSelected` 等在 computed 内依赖追踪不稳。
> 4. radio 行控件用原生 input + `@click`（按当前态取反）：原生 radio 重复点击不触发 `change`。
> 5. 聚合式 rowKey 由 `TableRender` 调 `setRowKey()` 回填（definition 构建早于组件 setup），
>    回填后补建快照；S1 的"rowKey 无效"终审在 onMounted。
> 6. `selectedKeys` 键统一为 `String(rowKey 值)`（与 TanStack row id 同构）。
> 7. 全选实现为"本页可选行全选"，跨页保留默认开启（S6）。

## 一、决策记录（相对 x-render 的取舍）

| x-render 实现                                     | 本设计                                                                   | 原因                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| keys + rows 双轨受控（4 对 v-model）              | 仅 `selected-keys` 单轨受控；rows 为只读快照输出                         | keys/rows 可互相推导，双轨可脱同步，reloadSelection 被迫定义隐式优先级 |
| 跨页行快照外包给调用方（`checkboxRows` 回退查找） | 内置 `Map<key, record>` 快照                                             | 中后台批量操作必需完整行对象，不应转嫁给使用方（S6）                   |
| `reloadSelection` + `nextTick` 回填               | TanStack state 为单一真相源，watch 回流做值相等短路                      | 消除时序补丁；受控环显式处理（S9）                                     |
| selection 为独立 prop，列由 Arco 内部注入         | `__selection__` 列在引擎列与模板列同步注入                               | 我们模板手写 th/td，必须自行管理列数一致（S8）                         |
| Arco radio 不可取消                               | radio 默认**可取消**（TanStack toggle 语义），`cancelable: false` 加守卫 | 对齐 R8"取消"三态风格；默认值贴合内核，零成本（S4）                    |

沿用 x-render 的部分：`selection` 字符串简写 + 对象详写双形态；行级 `selectable` 谓词；全选语义为**本页全选**（`toggleAllPageRowsSelected`，非全量行）。

## 二、API

```ts
// DefineTableOptions / UseTableRenderOptions 增量
export interface TableSelectionOptions<T extends DataRecord> {
  type: "radio" | "checkbox";
  /** 选择列宽，默认 48 */
  width?: number;
  /** 行级可选过滤；false 的行 checkbox 置灰、不可交互（S5） */
  selectable?: (record: T) => boolean;
  /** radio 再点已选中行是否取消；默认 true（S4） */
  cancelable?: boolean;
  /** 翻页/重载后是否保留选中；默认 true（S6） */
  reserveOnPageChange?: boolean;
}
rowSelection?: "radio" | "checkbox" | TableSelectionOptions<T>;

// TableRenderDefinition 增量
selection: Readonly<{ value: T[] }>;            // 完整选中行快照（含跨页行，S6）
selectedKeys: Readonly<Ref<Set<string | number>>>;
setSelection: (keys: Array<string | number>) => void;
clearSelection: () => void;

// 组件事件
"selection-change": [rows: T[]];
"update:selected-keys": [keys: Array<string | number>];   // 可选受控口
```

## 三、状态流（单一真相源）

```
TanStack options:
  enableRowSelection: selectable ?? true
  enableMultiRowSelection: type === "checkbox"
  getRowId: (row) => String(row[rowKey])          ← 强制，见 S1
  state.rowSelection + onRowSelectionChange

内部：
  snapshot = Map<string, T>      // key → 最近一次出现的行对象，onRowSelectionChange 与数据回写时更新
  dirtyKeys = Set<string>        // reserveOnPageChange 下新数据中已不存在的 key

受控回流：
  watch(() => props.selectedKeys) → 与 state.rowSelection 的 key 集合相等则短路，否则 setRowSelection
```

## 四、行为规则（S 系列）

- **S1**（修正项）：开启 `rowSelection` 而 `rowKey` 未配置或非 string 时，DEV 警告并**禁用选择**
  （不渲染选择列）。禁止索引兜底——TanStack 默认 row id 为 `String(index)`，服务端翻页会跨页串选。
- **S2**：`selection` 支持 `"radio" | "checkbox"` 字符串简写，等价 `{ type }`（对齐 x-render，D10 名词配置值）。
- **S3**：选择列 `id: "__selection__"`，`enableSorting: false`、`enableHiding: false`，注入为引擎列首位；
  表头渲染全选框（仅 checkbox 型），radio 型表头为占位。
- **S4**：radio 型基于 `enableMultiRowSelection: false` 的 toggle 语义，默认再点已选行可取消；
  `cancelable: false` 时 `onRowSelectionChange` 守卫：解绑结果为空集则保持原状。
- **S5**：`selectable(record) === false` 的行 checkbox 置灰（`disabled`），全选跳过该行；
  行点击不触发选择（选择只由 checkbox/单选框交互驱动）。
- **S6**：`reserveOnPageChange: true`（默认）时翻页/`update()` 重载保留选中 key；跨页行从
  `snapshot` 快照返回，快照可能是**过期数据**（文档标注）。key 在新数据中再次出现时以新行对象覆盖快照。
  `reserveOnPageChange: false` 时数据变更即清空选中。
- **S7**：`selection-change` 与 `update:selected-keys` 在每次选中集变化时各 emit 一次；
  静态模式排序/过滤引起的行序变化不触发（选中集未变）。
- **S8**（修正项）：选择列注入同步三处：引擎 `columns` 首位、模板 th/td 循环、
  空态 colspan 与骨架行 td 数（R14 用例断言随之扩展）。`aria-sort`、ellipsis 逻辑排除该列。
- **S9**（修正项）：受控 `selected-keys` 回流经 key 集合相等短路，杜绝
  props → setRowSelection → onRowSelectionChange → emit 回环。
- **S10**：表头全选框三态：`checked = getIsAllPageRowsSelected()`、
  `indeterminate = getIsSomeSelected() && !checked`；点击调 `toggleAllPageRowsSelected()`。
  半选态依赖 `Checkbox.checked` 放宽为 `boolean | "indeterminate"`（Ark UI CheckedState 对齐，
  属共享组件类型扩展，无行为破坏）。
- **S11**：rowKey 值跨页撞车（同 key 不同行）时 Map 后写覆盖 + DEV 警告一次。
- **S12**：`clearSelection()` / `setSelection(keys)` 为程序化出口；`setSelection` 含不存在的 key
  不报错，进入 dirtyKeys（仅 reserveOnPageChange 语义下展示）。

## 五、实施步骤

1. `Checkbox.vue`：`checked?: boolean | "indeterminate"` 类型放宽 + test 用例 + `generate:registry`。
2. `types.ts`：`TableSelectionOptions`、definition/事件增量。
3. `useTableRender.ts`：getRowId 强制注入、selection state、snapshot Map、S4/S6/S9/S11 守卫。
4. `TableRender.vue`：`__selection__` 列注入（S8）+ 表头/行 checkbox、radio 渲染（复用 Ark Checkbox）。
5. `TableRender.test.ts` 增量（见下）。
6. `docs` 组件文档 + `vp run generate:registry`；`vp check` + `vp run -r typecheck` + 全量 test。

## 六、测试清单

- 配置：字符串简写 / 对象 / radio / checkbox；S1 无 rowKey 警告且不渲染选择列。
- 全选：本页全选/取消、半选态（S10）、selectable 行被全选跳过（S5）。
- radio：单选互斥、再点取消（S4）、`cancelable: false` 不可取消。
- 跨页：checkbox 翻页保留、`selection.value` 含跨页行对象（S6）、
  `reserveOnPageChange: false` 翻页清空、服务端 `update()` 重载后保留（含 S11 撞 key 警告）。
- 受控：`selected-keys` 双向、回流不回环（S9）、`setSelection` / `clearSelection`。
- 事件：`selection-change` 载荷为完整行数组（S7）；排序后选中不变。
- 模板：空态 colspan = 业务列 + 1、骨架行 td 数同步（S8/R14）。
