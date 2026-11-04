# defineForm 按钮预设（actions 进 definition）设计 v1.1

> 对标方案：`table-composition-plan.md` v1.1 的独立后置迭代。`onSubmit` 已存在于
> `DefineFormOptions`（→ TanStack `onSubmit`，本迭代零改动）；本稿把按钮配置
> （`searchable` 等七项）从 `<FormRender>` 组件 props 迁入 definition，表单定义自包含。
> 状态：已实施。

## 修订记录（v1.0 → v1.1，依验证报告）

1. **解析语义定案为块级互斥**（修正 v1.0 中 A1 与 D3 伪码的字段级 fallback 矛盾）：`actions`
   存在 → 七项全量在 actions 域内解析（含缺省跟随），props 域完全不参与；`actions` 未配置 →
   现状 props 域解析。文案项归属随域定案。
2. 测试矩阵补 **D4 正向分支**（`actions.searchable=true` 内置区仍渲染按钮）并点名
   `submitable`/`cancelable` 组合用例。
3. DEV 警告触发条件细化（A6）：仅 `actions` 存在**且**显式传了至少一个按钮 prop 时警告。
4. 交付物补 `FormActionsConfig` 类型导出 + `define-form.ts` docstring 同步。
5. A3 边界组合（内置区 + `actions.searchable=false`）写入文档显式说明。

## 一、决策记录

| #   | 决策                                                                                                       | 理由                                                |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| D1  | `DefineFormOptions`/`UseFormRenderOptions` 增按钮预设七项，缺省语义与现有 props 完全一致                   | 行为等价迁移，零学习成本                            |
| D2  | `FormRenderDefinition` 增**可选** `actions` 投影（引擎直传，undefined 字段即未配置；未配置整体 undefined） | 可选成员不破坏现有消费者                            |
| D3  | **块级互斥解析**（见上修订 1）                                                                             | 「全量以 actions 为准」语义清晰，避免部分覆盖中间态 |
| D4  | `TableRender` 内置搜索区 `:searchable="search.actions ? undefined : true"` 条件传递                        | 防止内置硬编码与用户 actions 配置误触发冲突警告     |
| D5  | 「内置区 + `actions.searchable=false`」= 字段区在表格上方、按钮外置的合法布局，不警告、文档显式说明        | 组合式布局的正常形态                                |
| D6  | `onSubmit` 纪律（纯文档）：reload 归表格层，`onSubmit` 只做业务副作用；前引闭包标为反例                    | 防内置/组合双 onLoad                                |
| D7  | `#actions` 插槽与程序化 `submit()` 不受影响                                                                | 插槽覆盖默认按钮；submit() 汇入同一 handleSubmit    |
| D8  | 警告触发条件：`actions` 存在**且**七项按钮 prop 至少一项显式传值                                           | actions + props 全缺省是正常用法，不告警            |

## 二、API

```ts
// DefineFormOptions / UseFormRenderOptions 增量（七项）
searchable?: boolean; submitable?: boolean;
resetable?: boolean;   // 缺省跟随 searchable
cancelable?: boolean;  // 缺省跟随 submitable
searchText?: string; submitText?: string; resetText?: string;

// form-render/types.ts
export interface FormActionsConfig { /* 同上七项 */ }
export interface FormRenderDefinition<T> {
  // ...items / form / resetToDefaults / submit（组合式 v1.1）
  actions?: FormActionsConfig;
}

// FormRender.vue 解析（块级互斥单点实现）
const actions = props.definition?.actions;
const searchable = computed(() => (actions ? actions.searchable : props.searchable) ?? false);
const submitable = computed(() => (actions ? actions.submitable : props.submitable) ?? false);
const showReset  = computed(() => (actions ? actions.resetable : props.resetable) ?? !!searchable.value);
const showCancel = computed(() => (actions ? actions.cancelable : props.cancelable) ?? !!submitable.value);
// 文案 resolvedSearchText/SubmitText/ResetText 同构（域内 ?? 缺省文案）
```

## 三、行为规则（A 系列）

| #   | 规则                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | **块级互斥**：actions 存在 → 七项全量 actions 域解析，组件按钮 props 完全不参与（同传 DEV 警告）；未配置 → 现状 props 行为逐字节不变 |
| A2  | 缺省跟随（resetable 跟随 searchable、cancelable 跟随 submitable）在所在域内解析，跨域不混用                                          |
| A3  | 内置区条件传递 searchable；`actions.searchable=false` 时内置区只渲染字段无按钮（合法外置布局）                                       |
| A4  | 按钮 → `handleSubmit` → TanStack `onSubmit({ value })` → emit `search`/`submit`；内置区/外置 FormRender/程序化 `submit()` 三路同源   |
| A5  | `#actions` 插槽存在时覆盖默认按钮（现状不变）                                                                                        |
| A6  | DEV 警告仅 actions 存在且七项按钮 prop 至少一项显式传值时触发一次                                                                    |

## 四、测试矩阵（11 项，已实施）

| #   | 用例                                                                             |
| --- | -------------------------------------------------------------------------------- |
| 1   | actions 域 `searchable=true` → 搜索+重置（resetable 域内缺省跟随），无提交/取消  |
| 2   | actions `searchable=false` 显式 → 无按钮（字段照常）                             |
| 3   | actions `submitable=true` → 提交+取消（cancelable 缺省跟随）                     |
| 4   | **块级互斥**：actions + 组件 `resetable=false` 同传 → 以 actions 为准 + DEV 警告 |
| 5   | actions 存在 + props 全缺省 → 无 DEV 警告（A6）                                  |
| 6   | 文案三项域内生效                                                                 |
| 7   | `#actions` 插槽在 actions 存在时仍覆盖默认按钮（A5 回归）                        |
| 8   | actions 未配置 → 既有 props 行为回归（既有用例全绿为准入）                       |
| 9   | **D4 正向**：definition 配 `actions.searchable=true` → 内置区渲染按钮            |
| 10  | **D4 反向**：`actions.searchable=false` → 内置区字段无按钮（A3）                 |
| 11  | actions 未配置 → 内置区行为与现状一致（回归）                                    |

## 五、交付物

- form-render：`types.ts`（FormActionsConfig/actions）/ `useFormRender.ts`（七项直传投影）/
  `FormRender.vue`（块级互斥 + A6）/ `index.ts`（FormActionsConfig 导出）/ `FormRender.test.ts`（+7 用例）
- table-render：`TableRender.vue`（L564 条件传递，唯一适配点）/ `TableRender.test.ts`（+3 用例，helper 加 formConfig 第 4 参）
- `define-form.ts` docstring 同步（含 actions/submit 完整形态）
- 文档：`form-render.md`「提交与重置」节增「按钮预设进 definition」；`table-render.md` 搜索表单联动节增 A3/A4 纪律注记
- 无新组件导出、无 resolver 变更、无新 registry 项（`generate:registry` 仍需执行——form-render/table-render 源码变更）

## 六、不做的事

按钮 loading、按钮位置配置（归 `#actions` 插槽/样式）、`v-model` 受控、`actions` 在
`DefineTableOptions` 层的透传简写、跨域字段级 fallback（v1.0 矛盾点，已定案排除）。

## 七、风险与兼容

- **准入硬标准**：actions 未配置时既有用例全绿（矩阵 8/11）——props 域路径逐字节不变
- 块级互斥是行为约定（actions 存在时组件按钮 props 被忽略 + 警告），对既有消费者零影响（此前 actions 不存在）
- 与组合式方案（table-composition-plan v1.1）正交：外置按钮/按钮预设两条路都可与 `showSearch=false` 组合
