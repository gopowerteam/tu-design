# TableRender 组合式布局（Form/Pagination 拆分组装）实施方案 v1.1（定稿）

> 任务：TableRender 组合式布局——搜索表单与分页条可拆出组件 DOM，由调用方自由布局（对标截图：外层 flex，左列 Form 固定宽度，右列表格撑满剩余空间 + 分页条固定高度贴底）。
> 选型结论：**B 组合式**（淘汰 layout prop 与 ProTable）。核心认知：`defineTable` 返回的 `TableRenderDefinition` 本就同时携带三个可消费面——definition 本身（table）、`search`（FormRenderDefinition）、`page` + `setPageIndex`/`setPageSize`（pagination）。本方案只补「渲染出口开关 + 分页组件公开化 + 校验动作糖」。
>
> **修订记录（v1.0 → v1.1，依验证报告）**
>
> 1. 新增 D9/R29：`TablePagination` 必填 props 放宽为可选 + DEV 校验（修正「必填 props 与 definition 模式冲突」缺口）
> 2. 验收链重排：`generate:registry` 提前到全量 `vp test` 之前（drift.test 在全量测试内，后置必红）
> 3. D6 定案：`submit` 保持必选成员，changelog 注明迁移（否决 optional 变体）
> 4. R29 补充：definition 模式 emit 保留并注明幂等；definition 与手动 props 同传时 definition 优先 + DEV 警告（对齐 R4）
> 5. 轮次 B 收口要求：内部适配与组件改造同轮完成，轮末先跑 TableRender 回归
>
> **关联（独立后置，不在本稿范围）**：`defineForm` 按钮预设（actions 进 definition）作为独立小迭代另行设计；`DefineFormOptions.onSubmit` 已存在，零改动。

## 一、决策记录

| #   | 决策                                                                                     | 理由                                                                                                               |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| D1  | 两个渲染开关 `showSearch` / `showPagination`（boolean，`default: undefined` 禁 casting） | 正交：可只关其一（外置 Form + 内置分页等组合）                                                                     |
| D2  | 淘汰 `#pagination` 插槽与 `layout` prop                                                  | 组合式下用户直接从 `table.page` 取数，插槽冗余；布局归用户 DOM                                                     |
| D3  | `TablePagination` 留在 `table-render/` 目录内公开，不做独立 registry 项                  | generator 一目录一 registry 项；组件仅依赖 Ark Pagination + `cn`，随 table-render 项分发                           |
| D4  | 新增可选 `definition` prop（type-only 引用 `TableRenderDefinition`）                     | 组合式零样板：自动接线 + R13 自隐藏；同目录 type-only import，registry 自洽                                        |
| D5  | 内置使用处保持手动 props 接线（不用 definition 模式）                                    | 须经 `onPageIndex`/`onPageSize` 包装器（受控模式 `lastEmittedPage` 去重 + emit），`definition.setPageIndex` 会绕过 |
| D6  | `submit` 为必选成员，实现单点化（`useFormRender`），FormRender 内部复用                  | 与现有成员风格一致、定义仅由工厂产出；外部手搭字面量的破坏性变更经 changelog 注明迁移                              |
| D7  | 不新增 `defineTableSchema`                                                               | 重新打包无语义增量；文档注明 `page` 勿顶层解构（reactive 对象）                                                    |
| D8  | 去掉模板写死的 `border-t`，内置使用处显式补                                              | 公开组件布局归使用方                                                                                               |
| D9  | `TablePagination` 四项分页 props 放宽为可选                                              | definition 模式下强制必填会破坏零样板；缺关键入参走 DEV 校验兜底                                                   |

## 二、API 全量

```ts
// 1. TableRender 新增 props（运行时声明，default: undefined，无 DEV 警告——组合即预期用法）
showSearch?: boolean      // false → 不渲染内置搜索区；数据链路不变
showPagination?: boolean  // false → 不渲染内置分页条（无视 R13）；缺省行为不变

// 2. TablePagination 改造（defineProps 转运行时声明以落实禁 casting 约定）
definition?: TableRenderDefinition<any>  // 组合式：自动接线 + R13 自隐藏；同传时手动分页 props 忽略（DEV 警告，对齐 R4）
pageIndex?: number                       // 由必填放宽为可选（D9）
pageSize?: number
pageSizeOpts?: readonly number[]
total?: number
showTotal?: boolean                      // 缺省 true（共 N 条）
showSizeSelect?: boolean                 // 缺省 false（条/页 select；内置使用处显式传 true 保持现状）
navMode?: "text" | "icon"                // 缺省 "text"（上一页/下一页文字；icon 为 ‹ › 内联 SVG，带 aria-label）
// 根类去掉 border-t；事件协议不变（update:pageIndex / update:pageSize）
// definition 模式下事件仍 emit（幂等：重复 setPageIndex 同值无害）

// 3. FormRenderDefinition 增量（form-render/types.ts）
submit: () => Promise<boolean>  // await form.handleSubmit() + 返回 state.isFieldsValid；不触发 search/submit 事件
```

**DEV 校验（R29 兜底）**：`definition` 与手动四项均缺省，或缺 `pageIndex`/`pageSize`/`total` 任一 → `console.warn("[tu-design] <TablePagination> ...")` 且不渲染。

## 三、行为规则（R27–R31，接续现有 R26）

| #   | 规则                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R27 | `showSearch: false` → 不渲染内置搜索区；`onLoad` 的 `form` 仍自动携带 `search.form.state.values`；`@search`/`@reset` 仅由内置区触发，关闭后无触发源（文档注明）                                                                                                                                                     |
| R28 | `showPagination: false` → 不渲染内置分页条；缺省模式下 R13（单页隐藏）不变                                                                                                                                                                                                                                          |
| R29 | `TablePagination` 输入解析：definition 同传 → 全部以 `definition.page` 为准、手动四项忽略 + DEV 警告；仅手动 → 可选 props 直读，缺关键项 DEV 警告不渲染。动作接线：definition 模式经 `definition.setPageIndex`/`setPageSize`；事件恒 emit（幂等）。可见性：definition 模式 R13 自隐藏；手动模式恒渲染（可见性自理） |
| R30 | `submit()` = `await form.handleSubmit()` + 返回 `form.state.isFieldsValid`；外部查询标准链路 `if (await table.search.submit()) table.reload(true)`；FormRender 内部 `submit()` 改为复用（拆分式 `:form + :items` 无 definition 时走原内联逻辑）                                                                     |
| R31 | `TablePagination` 不带 `border-t`；`TableRender` 内置使用处显式 `class="border-t"` + `:show-size-select="true"` 保持现状视觉与行为                                                                                                                                                                                  |

## 四、实施步骤（TDD，红→绿）

**轮次 A：`FormRenderDefinition.submit()`**

1. `form-render/types.ts` 增必选 `submit`；`useFormRender.ts` 返回对象挂载实现
2. `FormRender.vue` `submit()` 重构：definition 存在时调 `definition.submit()`；拆分式 `:form + :items` 走原内联逻辑
3. 测试矩阵 1–2 红→绿；既有 searchable 用例为回归守卫

**轮次 B：TablePagination 增强（同轮收口）**

1. `defineProps` 转运行时声明；四项分页 props 放宽可选（D9）；新增 `definition`/`showTotal`/`showSizeSelect`/`navMode`；`border-t` 移除；R29 输入解析 + DEV 校验 + R13 自隐藏
2. 同轮完成 `TableRender.vue` 内置使用处适配（`class="border-t"` + `:show-size-select="true"`，手动接线不变）
3. 新建 `TablePagination.test.ts`（矩阵 3–10）红→绿
4. 轮末回归：`vp test --run TableRender` 全绿后方可进入轮次 C

**轮次 C：TableRender 渲染开关**

1. 两 prop + 两个 computed：`showSearchArea = search && showSearch !== false`（顶行条件改 `showSearchArea || showColumnSettings`，列设置触发器不受影响）；`showPaginationBar = showPagination && showPagination !== false`
2. `TableRender.test.ts` 增量（矩阵 11–15）红→绿

**轮次 D：导出与配套**

1. `table-render/index.ts` 导出 `TablePagination` → `resolver.ts` 白名单字母序插入 `"TablePagination"`（P < R，置于 TableRender 前）→ 根 `index.ts` `export *` 自动透传 → `resolver.test.ts` 强制同步
2. 文档：`apps/docs/demos/table-render/CompositionDemo.vue`（复刻截图布局）+ `table-render.md` 增「组合式布局」节（R27 事件语义、`page` 勿顶层解构、emit 幂等注明）
3. changelog/文档注明：`FormRenderDefinition` 新增必选 `submit` 的迁移方式（D6）

**验收链（v1.1 重排）**：

```
cd packages/vue
vp test --run TablePagination → vp test --run TableRender → vp test --run FormRender
→ vp run generate:registry        # 必须先于全量测试：drift.test 在全量内，registry 滞后必红
→ vp check → vp run -r typecheck → vp test
```

（`generate:sources` 不触发——无 tokens.css/utils.ts 改动）

## 五、测试矩阵（15 项）

| #   | 用例                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------- |
| 1   | `submit()`：校验通过 → `true`；schema 校验失败 → `false`                                                  |
| 2   | FormRender searchable 重构回归（既有用例全绿）                                                            |
| 3   | definition 模式：渲染 `definition.page` 数据；点页码 → `setPageIndex(2)` 被调 + emit `update:pageIndex`   |
| 4   | definition 模式 R13：`total ≤ pageSize` → 不渲染                                                          |
| 5   | 手动模式：单页仍渲染                                                                                      |
| 6   | `showTotal: false` → 无「共 N 条」                                                                        |
| 7   | `showSizeSelect` 缺省无 select；`true` 有且 change → emit `update:pageSize`                               |
| 8   | `navMode: "icon"` → chevron SVG（带 aria-label）无文字；缺省保持「上一页/下一页」                         |
| 9   | definition + 手动四项同传 → 以 definition 为准 + DEV 警告（R29/R4 对齐）                                  |
| 10  | definition 与手动 props 均缺省（或缺关键项）→ DEV 警告 + 不渲染                                           |
| 11  | `showSearch: false`：内置 FormRender 不渲染；外部 FormRender 改值 + `reload(true)` → onLoad form 携带新值 |
| 12  | `showPagination: false`：多页时不渲染分页条                                                               |
| 13  | 缺省（未传开关）：行为与现状一致（既有用例回归）                                                          |
| 14  | `showSearch: false` 后列设置触发器仍渲染                                                                  |
| 15  | 组合式 + 受控分页：外部 TablePagination 翻页 → `update:page-index` 经 pageControlled watch 正常通知       |

## 六、组合式用法（交付形态）

```vue
<div class="flex gap-4">
  <aside class="w-56 shrink-0 space-y-3">
    <FormRender v-if="table.search" :definition="table.search" :min-width="200" />
    <Button class="w-full" @click="onSearch">查 询</Button>
    <Button variant="outline" class="w-full" @click="onReset">重 置</Button>
  </aside>
  <div class="flex min-w-0 flex-1 flex-col gap-3">
    <TTableRender :definition="table" row-key="id" :show-search="false" :show-pagination="false" />
    <TTablePagination :definition="table" :show-size-select="false" nav-mode="icon" />
  </div>
</div>

<script setup lang="ts">
async function onSearch() {
  if (await table.search.submit()) table.reload(true);
}
function onReset() {
  table.search.resetToDefaults();
  table.reload(true);
}
</script>
```

## 七、不做的事（划界）

- 不新增 `defineTableSchema`、不做 `#search`/`#pagination` 插槽、不做 `layout` prop（选型淘汰，协议不冲突，未来可叠加）
- 不做独立 `table-pagination` registry 项、不做 FormRender 布局 prop、列设置触发器位置不提供自定义
- 手动模式不提供 `hideOnSinglePage`（v1 从简，需要时走 definition 模式）
- `defineForm` 按钮预设（独立后置迭代，另行设计）

## 八、风险与兼容

- 默认行为零变化（开关 `default: undefined`），既有测试全绿为硬性准入（轮次 B/C 各设回归门）
- `TablePagination` 公开化后事件命名成为公开 API 承诺
- `FormRenderDefinition` 新增必选 `submit` 对手搭字面量消费者是破坏性变更（D6 已定案 + changelog 注明）
- `definition` 为 type-only 引用，无运行时耦合；无 grid/virtual 改动
