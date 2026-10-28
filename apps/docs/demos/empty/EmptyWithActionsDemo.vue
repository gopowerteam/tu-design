<script setup lang="ts"></script>

<template>
  <div>
    <TEmpty description="列表暂无数据，创建第一项试试">
      <TButton size="sm">新建项目</TButton>
      <TButton size="sm" variant="ghost">导入</TButton>
    </TEmpty>
    <p class="text-xs text-muted-foreground">default 插槽放置操作按钮，常用于首启引导与空列表。</p>
  </div>
</template>
