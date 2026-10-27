---
title: TreeSelect 树选择
description: 树形下拉选择：一站式 props 驱动，支持单/多选、勾选级联（checkStrategy）、键盘导航、搜索过滤与多标签折叠。
---

# TreeSelect

树形下拉选择：一站式 props 驱动，支持单/多选、勾选级联（checkStrategy）、键盘导航、搜索过滤与多标签折叠。

安装：

```bash
npx tu-design add tree-select
```

## 基础用法

`options` 声明树形数据（`key` 必填，`label` 展示名，`children` 子级）；`checkable` + `cascade` 勾选级联（值恒为数组），`filterable`/`clearable` 开启搜索与清空：

<DemoPreview file="tree-select/TreeSelectDemo.vue" />

## 多选与标签折叠

`multiple` 多选，`max-tag-count` 折叠超出标签：

<DemoPreview file="tree-select/TreeSelectMultiple.vue" />

## 组件结构

TreeSelect 为单组件，无子组件对外导出（树面板由内部 `TreePanel` 渲染，不进入公共 API）；触发器与面板样式由常量类（`controlCls`）+ Tailwind 工具类拼装，无 cva 变体。

## API

### Props

| Prop                    | 类型                           | 默认值     | 说明                                |
| ----------------------- | ------------------------------ | ---------- | ----------------------------------- |
| `options`               | `TreeOption[]`                 | 必填       | 树形选项                            |
| `v-model`               | `Key` \| `Key[]`               | —          | 当前值；checkable/multiple 时为数组 |
| `default-value`         | `Key` \| `Key[]`               | —          | 非受控时的初始值                    |
| `multiple`              | `boolean`                      | `false`    | 多选（值恒为数组）                  |
| `checkable`             | `boolean`                      | `false`    | 勾选模式（隐含多选，值恒为数组）    |
| `cascade`               | `boolean`                      | `false`    | 级联勾选：父子联动                  |
| `check-strategy`        | `"all" \| "child" \| "parent"` | `"all"`    | 勾选值收敛策略                      |
| `filterable`            | `boolean`                      | `false`    | 触发器内嵌搜索框，按 `label` 过滤   |
| `clearable`             | `boolean`                      | `false`    | 展示清空按钮                        |
| `disabled`              | `boolean`                      | —          | 禁用                                |
| `placeholder`           | `string`                       | `"请选择"` | 占位文案                            |
| `max-tag-count`         | `number`                       | —          | 多选标签折叠阈值                    |
| `expanded-keys`         | `Key[]`                        | —          | 受控展开                            |
| `default-expanded-keys` | `Key[]`                        | `[]`       | 非受控初始展开                      |
| `default-expand-all`    | `boolean`                      | `false`    | 默认展开全部                        |
| `open` / `default-open` | `boolean`                      | —          | 弹层开合                            |
| `class`                 | `string`                       | —          | 追加/覆盖样式                       |

### Events

| 事件                   | 载荷                        | 说明                                        |
| ---------------------- | --------------------------- | ------------------------------------------- |
| `update:model-value`   | `Key \| Key[] \| undefined` | 值变化；清空单选为 `undefined`，多选为 `[]` |
| `update:show`          | `boolean`                   | 弹层开合                                    |
| `update:expanded-keys` | `Key[]`                     | 展开变化                                    |

### Slots

TreeSelect 不声明自定义插槽：树节点由 `options` props 声明式渲染（节点文案取自 `label`），搜索框、勾选框、展开箭头与空状态（"无数据"）均为内置渲染，无插槽出口；触发器样式可通过 `class` prop 追加/覆盖。

## 说明

- **checkable 值语义**：`checkable` 时 `v-model` 恒为数组（等价多选）；传单个 `Key` 会按无选中处理并警告
- 单选可点任意非禁用节点；勾选值由 `cascade` + `check-strategy` 计算父子联动
- 键盘：`↑`/`↓` 移动、`→` 展开、`←` 折叠回父级、`Enter` 选中、`Escape` 关闭
- `options` 变更后残留的失效 key 会被静默忽略（不回显、不报错）
- 安装时自动携带 `tree-shared`（树数据层）/ `utils` / `date-shared` 依赖

## 主题定制

TreeSelect 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `--input`                            | 触发器边框色；勾选框未选态边框色                     |
| `--ring`                             | 触发器聚焦环（`border-ring` / `ring-ring/50`）       |
| `--destructive`                      | 校验无效态（`data-invalid`）边框与光晕               |
| `--popover` / `--popover-foreground` | 弹层面板底色/文字                                    |
| `--border`                           | 弹层边框色（裸 `border` 的全局兜底）                 |
| `--accent`                           | 节点 hover/键盘/选中高亮底色；多选标签底色           |
| `--accent-foreground`                | 多选标签文字色                                       |
| `--primary`                          | 勾选框选中/半选态底色与边框色                        |
| `--background`                       | 勾选框未选态底色与对勾颜色                           |
| `--muted-foreground`                 | 占位文案、搜索框占位、展开箭头、清空按钮、空状态文字 |
| `--foreground`                       | 清空按钮 hover 文字色                                |
| `--radius`                           | 圆角基准（`rounded-md`/`rounded-sm` 派生）           |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TTreeSelect v-model="value" :options="options" checkable cascade />
</div>
```
