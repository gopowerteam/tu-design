<script setup lang="ts">
import { ref } from "vue";
import { columnRenders, defineTable } from "@tu-design/vue";

interface User {
  id: number;
  name: string;
  role: string;
  status: "active" | "pending" | "banned";
  createdAt: string;
}

const USERS: User[] = Array.from({ length: 86 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  role: ["运营", "客服", "研发"][i % 3]!,
  status: (["active", "pending", "banned"] as const)[i % 3]!,
  createdAt: `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
}));

const picked = ref<User>();

const r = columnRenders<User>();

const table = defineTable<User>({
  data: USERS,
  pageSize: 10,
  columns: [
    { key: "id", title: "ID", width: 80 },
    { key: "name", title: "姓名", sortable: true, defaultSort: "asc" },
    { key: "role", title: "角色", sortable: true },
    {
      key: "status",
      title: "状态",
      render: r.dict({
        active: { label: "启用", variant: "default" },
        pending: { label: "待审", variant: "secondary" },
        banned: { label: "禁用", variant: "destructive" },
      }),
    },
    { key: "createdAt", title: "创建时间", ellipsis: true },
    {
      key: "ops",
      title: "操作",
      render: r.button([{ text: (row) => `编辑 ${row.name}` }]),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" @row-click="picked = $event[0]" />
    <p v-if="picked" class="text-muted-foreground mt-3 text-sm">
      选中行：<code>{{ picked.name }}</code
      >（id={{ picked.id }}）
    </p>
  </div>
</template>
