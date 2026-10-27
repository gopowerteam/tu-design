---
title: "Cascader 级联选择"
description: 级联选择：多列联动面板，一站式 props 驱动，支持单/多选、勾选级联、路径回显、悬停展开与键盘导航。
---

# Cascader

级联选择：多列联动面板，一站式 props 驱动，支持单/多选、勾选级联、路径回显、悬停展开与键盘导航。

安装：

```bash
npx tu-design add cascader
```

## 基础用法

`options` 声明树形数据（`key` 必填，`label` 展示名，`children` 子级，类型 `TreeOption`）；单选时点击父级仅展开、点击叶子才选中，回显按 `getPath` 拼接完整路径（`show-path` 关闭后仅显示叶子名）：

```ts
import type { TreeOption } from "@tu-design/vue";

const regions: TreeOption[] = [
  {
    key: "zj",
    label: "浙江省",
    children: [{ key: "hz", label: "杭州市", children: [{ key: "xh", label: "西湖区" }] }],
  },
];
```

<DemoPreview file="cascader/CascaderDemo.vue" />

## 组件结构

Cascader 为单组件，无子组件对外导出（多列面板由内部 `CascaderPanel` 渲染，不进入公共 API）；触发器与面板样式由常量类（`controlCls`）+ Tailwind 工具类拼装，无 cva 变体。

## API

### Props

| Prop                    | 类型                           | 默认值     | 说明                                |
| ----------------------- | ------------------------------ | ---------- | ----------------------------------- |
| `options`               | `TreeOption[]`                 | 必填       | 树形选项                            |
| `v-model`               | `Key` \| `Key[]`               | —          | 当前值；checkable/multiple 时为数组 |
| `default-value`         | `Key` \| `Key[]`               | —          | 非受控时的初始值                    |
| `multiple`              | `boolean`                      | `false`    | 多选（值恒为数组）                  |
| `checkable`             | `boolean`                      | `false`    | 勾选模式（隐含多选）                |
| `cascade`               | `boolean`                      | `false`    | 级联勾选：父子联动                  |
| `check-strategy`        | `"all" \| "child" \| "parent"` | `"all"`    | 勾选值收敛策略                      |
| `expand-trigger`        | `"click" \| "hover"`           | `"click"`  | 下级展开触发方式                    |
| `show-path`             | `boolean`                      | `true`     | 回显拼接完整路径                    |
| `separator`             | `string`                       | `" / "`    | 路径分隔符                          |
| `clearable`             | `boolean`                      | `false`    | 展示清空按钮                        |
| `disabled`              | `boolean`                      | —          | 禁用                                |
| `placeholder`           | `string`                       | `"请选择"` | 占位文案                            |
| `max-tag-count`         | `number`                       | —          | 多选标签折叠阈值                    |
| `open` / `default-open` | `boolean`                      | —          | 弹层开合                            |
| `class`                 | `string`                       | —          | 追加/覆盖样式                       |

### Events

| 事件                 | 载荷                        | 说明                                        |
| -------------------- | --------------------------- | ------------------------------------------- |
| `update:model-value` | `Key \| Key[] \| undefined` | 值变化；清空单选为 `undefined`，多选为 `[]` |
| `update:show`        | `boolean`                   | 弹层开合                                    |

### Slots

Cascader 不声明自定义插槽：选项由 `options` props 声明式渲染（节点文案取自 `label`），多列面板、勾选框与空状态（"无数据"）均为内置渲染，无插槽出口；触发器样式可通过 `class` prop 追加/覆盖。

## 说明

- 键盘：`↑`/`↓` 列内移动、`→` 进入下级列、`←` 返回上级列、`Enter` 选中、`Escape` 关闭
- a11y：列 `role="listbox"`、节点 `role="option"`，勾选模式带 `aria-checked` 与展开路径 `aria-expanded`
- 安装时自动携带 `tree-shared`（树数据层）依赖

## 主题定制

Cascader 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                           |
| ------------------------------------ | ---------------------------------------------- |
| `--input`                            | 触发器边框色；勾选框未选态边框色               |
| `--ring`                             | 触发器聚焦环（`border-ring` / `ring-ring/50`） |
| `--destructive`                      | 校验无效态（`data-invalid`）边框与光晕         |
| `--popover` / `--popover-foreground` | 弹层面板底色/文字                              |
| `--border`                           | 列分隔线与弹层边框色（裸 `border` 的全局兜底） |
| `--accent`                           | 节点 hover/键盘高亮底色；多选标签底色          |
| `--accent-foreground`                | 多选标签文字色                                 |
| `--primary` / `--primary-foreground` | 勾选框选中态底色/对勾色                        |
| `--muted-foreground`                 | 占位文案、清空/展开图标、空状态文字            |
| `--foreground`                       | 清空按钮 hover 文字色                          |
| `--radius`                           | 圆角基准（`rounded-md`/`rounded-sm` 派生）     |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TCascader v-model="value" :options="options" checkable cascade />
</div>
```
