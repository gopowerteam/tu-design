<script setup lang="ts">
import { h, ref } from "vue";
import { Badge, Button, defineTable } from "@tu-design/vue";

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

const STATUS_TEXT = { active: "启用", pending: "待审", banned: "禁用" } as const;
const STATUS_VARIANT = {
  active: "default",
  pending: "secondary",
  banned: "destructive",
} as const;

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
      render: (record) =>
        h(Badge, { variant: STATUS_VARIANT[record.status] }, () => STATUS_TEXT[record.status]),
    },
    { key: "createdAt", title: "创建时间", ellipsis: true },
    {
      key: "ops",
      title: "操作",
      render: (record) =>
        h(Button, { size: "sm", variant: "outline" }, () => `编辑 ${record.name}`),
    },
  ],
});

const picked = ref<User>();
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
