# Card

卡片容器族：Header/Title/Description/Content/Footer。

## 演示

<DemoPreview file="card/CardDemo.vue" />

## 安装

```bash
npx tu-design add card
```

## 组件与 Slots

| 组件              | 渲染元素 | 说明                                                  |
| ----------------- | -------- | ----------------------------------------------------- |
| `Card`            | `div`    | 容器：`rounded-xl border bg-card shadow-sm`，默认插槽 |
| `CardHeader`      | `div`    | 头部：`flex flex-col gap-1.5 p-6`，默认插槽           |
| `CardTitle`       | `h3`     | 标题：`font-semibold leading-none`，默认插槽          |
| `CardDescription` | `p`      | 描述文字，默认插槽                                    |
| `CardContent`     | `div`    | 内容区 `p-6`，默认插槽                                |
| `CardFooter`      | `div`    | 底部 `flex items-center p-6`，默认插槽                |

以上组件均接受 `class` prop 追加/覆盖样式（经 `cn` 合并）。

## 用法

```vue
<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
</script>

<template>
  <Card class="w-80">
    <CardHeader>
      <CardTitle>创建项目</CardTitle>
      <CardDescription>一键部署你的应用。</CardDescription>
    </CardHeader>
    <CardContent>这里放表单或内容。</CardContent>
    <CardFooter>
      <Button>确认创建</Button>
    </CardFooter>
  </Card>
</template>
```
