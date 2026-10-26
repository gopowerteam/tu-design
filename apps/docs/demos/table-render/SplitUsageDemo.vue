<script setup lang="ts">
// 拆分式：不经 defineTable，直接把配置拆成 props（内核由 TableRender 内部创建）
const columns = [
  { key: "id", title: "ID", width: 80 },
  { key: "name", title: "姓名", sortable: true },
  { key: "dept", title: "部门" },
];

const users = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `成员${i + 1}`,
  dept: ["平台", "业务", "中台"][i % 3]!,
}));
</script>

<template>
  <div class="w-full">
    <TTableRender row-key="id" :columns="columns" :data="users" />
    <p class="text-muted-foreground mt-2 text-xs">
      无 <code>setup</code> 内核约束；已有 <code>definition</code> 时拆分 props 会被忽略（definition
      优先）。
    </p>
  </div>
</template>
