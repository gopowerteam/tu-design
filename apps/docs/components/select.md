# Select

下拉选择框：基于 Ark UI Select 原语，内置键盘导航、选中回显与勾选指示。`TSelectTrigger` 支持 `asChild`。

## 演示

<DemoPreview file="select/SelectDemo.vue" />

## 安装

```bash
npx tu-design add select
```

## 用法

`TSelect` 通过 `items` 声明选项（用于键盘导航与回显的 collection），面板内用 `TSelectItem` 逐项渲染：

```vue
<script setup lang="ts">
import { ref } from "vue";

const framework = ref();
const frameworks = [
  { label: "Vue", value: "vue" },
  { label: "React", value: "react" },
  { label: "Svelte", value: "svelte" },
];
</script>

<template>
  <TSelect v-model="framework" :items="frameworks" class="w-48">
    <TSelectTrigger>
      <TSelectValueText placeholder="选择框架" />
    </TSelectTrigger>
    <TSelectContent>
      <TSelectItem v-for="item in frameworks" :key="item.value" :item="item" />
    </TSelectContent>
  </TSelect>
</template>
```

`items` 也接受字符串数组（label 与 value 相同）。

## Props

### TSelect

| Prop                             | 类型                                        | 默认值  | 说明                 |
| -------------------------------- | ------------------------------------------- | ------- | -------------------- |
| `items`                          | `(string \| { label, value, disabled? })[]` | 必填    | 选项列表             |
| `v-model`                        | `string`                                    | —       | 当前值；不传为非受控 |
| `default-value`                  | `string`                                    | —       | 非受控时的初始值     |
| `lazy-mount` / `unmount-on-exit` | `boolean`                                   | `false` | 内容挂载策略         |

### TSelectTrigger / TSelectItem

| Prop                  | 类型                         | 默认值  | 说明               |
| --------------------- | ---------------------------- | ------- | ------------------ |
| `as-child`（Trigger） | `boolean`                    | `false` | 以子元素为渲染目标 |
| `item`（Item）        | `string \| { label, value }` | 必填    | 对应选项           |
| `class`               | `string`                     | —       | 追加/覆盖样式      |

## 说明

- 单选语义：`v-model` 为 `string`（zag 内部以数组表示，包装层已转换）
- `TSelectValueText` 自含选中回显，不要向其传插槽内容
- 键盘 `↑`/`↓` 高亮、`Enter` 选中、`Escape` 关闭
