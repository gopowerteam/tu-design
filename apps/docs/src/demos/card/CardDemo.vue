<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tu-design/vue";
</script>

<template>
  <Card class="w-80">
    <CardHeader>
      <CardTitle>创建项目</CardTitle>
      <CardDescription>一分钟内部署 tu-design 组件库。</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">基于 Ark UI 与 Tailwind CSS v4。</p>
    </CardContent>
    <CardFooter class="gap-2">
      <Button>确认</Button>
      <Button variant="outline">取消</Button>
    </CardFooter>
  </Card>
</template>
