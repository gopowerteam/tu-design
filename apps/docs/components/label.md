# Label

表单标签。

## 演示

<DemoPreview file="label/LabelDemo.vue" />

## 安装

```bash
npx tu-design add label
```

## Props

| Prop    | 类型     | 默认值 | 说明                          |
| ------- | -------- | ------ | ----------------------------- |
| `class` | `string` | —      | 追加/覆盖样式（经 `cn` 合并） |

渲染 `<label>`（`text-sm font-medium leading-none`），默认插槽为文字内容；`for`/`@click` 等原生属性透传。

## 用法

```vue
<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label for="email">邮箱</Label>
    <Input id="email" type="email" placeholder="you@example.com" />
  </div>
</template>
```
