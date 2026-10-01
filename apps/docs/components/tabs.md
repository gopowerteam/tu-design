# Tabs

选项卡：基于 Ark UI Tabs 原语，支持键盘导航与受控/非受控双模式。

## 演示

<DemoPreview file="tabs/TabsDemo.vue" />

## 安装

```bash
npx tu-design add tabs
```

## 用法

```vue
<template>
  <TTabs default-value="overview">
    <TTabsList>
      <TTabsTrigger value="overview">概览</TTabsTrigger>
      <TTabsTrigger value="analytics">分析</TTabsTrigger>
    </TTabsList>
    <TTabsContent value="overview">概览内容</TTabsContent>
    <TTabsContent value="analytics">分析内容</TTabsContent>
  </TTabs>
</template>
```

### 受控用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref("overview");
</script>

<template>
  <TTabs v-model:value="value">...</TTabs>
</template>
```

## Props

### TTabs

| Prop                             | 类型                      | 默认值        | 说明                       |
| -------------------------------- | ------------------------- | ------------- | -------------------------- |
| `v-model:value`                  | `string`                  | —             | 当前激活 tab；不传为非受控 |
| `default-value`                  | `string`                  | —             | 非受控时的初始 tab         |
| `activation-mode`                | `'automatic' \| 'manual'` | `'automatic'` | 聚焦即切换 / 需确认切换    |
| `lazy-mount` / `unmount-on-exit` | `boolean`                 | `false`       | 内容挂载策略               |

### TTabsTrigger

| Prop       | 类型      | 默认值  | 说明         |
| ---------- | --------- | ------- | ------------ |
| `value`    | `string`  | 必填    | 对应面板的值 |
| `disabled` | `boolean` | `false` | 禁用该 tab   |

## 说明

- 激活态样式挂在 `data-[selected]` 上（zag 语义），自定义主题时同理
- 键盘 `←`/`→` 导航，`Home`/`End` 跳转首尾
