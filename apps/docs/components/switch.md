# Switch

开关：基于 Ark UI Switch 原语，滑块动效由 `data-[state]` + transition 驱动。

## 演示

<DemoPreview file="switch/SwitchDemo.vue" />

## 安装

```bash
npx tu-design add switch
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const enabled = ref(true);
</script>

<template>
  <TSwitch v-model:checked="enabled">飞行模式</TSwitch>
</template>
```

## Props

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:checked` | `boolean` | —       | 开关状态；不传为非受控 |
| `default-checked` | `boolean` | `false` | 非受控时的初始状态     |
| `disabled`        | `boolean` | `false` | 禁用                   |
| `class`           | `string`  | —       | 追加/覆盖根样式        |
