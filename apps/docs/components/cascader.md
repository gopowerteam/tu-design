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

## 说明

- 键盘：`↑`/`↓` 列内移动、`→` 进入下级列、`←` 返回上级列、`Enter` 选中、`Escape` 关闭
- a11y：列 `role="listbox"`、节点 `role="option"`，勾选模式带 `aria-checked` 与展开路径 `aria-expanded`
- 安装时自动携带 `tree-shared`（树数据层）依赖
