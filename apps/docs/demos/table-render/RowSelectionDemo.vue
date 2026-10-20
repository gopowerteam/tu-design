<script setup lang="ts">
import { computed, onMounted } from "vue";
import { defineTable } from "@tu-design/vue";

interface User {
  id: number;
  name: string;
  role: string;
  online: boolean;
}

const USERS: User[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  role: ["运营", "客服", "研发"][i % 3]!,
  online: i % 2 === 0,
}));

// checkbox 多选：offline 行不可选（selectable 谓词），翻页后选中保留
const multi = defineTable<User>({
  data: USERS,
  pageSize: 10,
  rowSelection: {
    type: "checkbox",
    selectable: (row) => row.online,
  },
  columns: [
    { key: "id", title: "ID", width: 80 },
    { key: "name", title: "姓名", sortable: true, defaultSort: "asc" },
    { key: "role", title: "角色" },
    { key: "online", title: "在线", formatter: (row) => (row.online ? "在线" : "离线") },
  ],
});

const count = computed(() => multi.selection.value.length);

// 默认选中：挂载后程序化预置选中集（selectable=false 的行会被引擎忽略）
onMounted(() => {
  multi.setSelection([1, 3]);
});

// radio 单选：再点已选行可取消；默认选中第 1 行
const single = defineTable<User>({
  data: USERS.slice(0, 5),
  pageSize: 5,
  rowSelection: "radio",
  columns: [
    { key: "id", title: "ID", width: 80 },
    { key: "name", title: "姓名" },
    { key: "role", title: "角色" },
  ],
});

onMounted(() => {
  single.setSelection([2]);
});
</script>

<template>
  <div class="w-full space-y-6">
    <div>
      <TTableRender :definition="multi" row-key="id" />
      <p class="text-muted-foreground mt-3 text-sm">
        已选 <code>{{ count }}</code> 人（离线行不可选，翻页后选中保留）
        <button
          v-if="count > 0"
          type="button"
          class="text-primary ml-2 hover:underline"
          @click="multi.clearSelection()"
        >
          清空选择
        </button>
      </p>
    </div>

    <div>
      <p class="text-muted-foreground mb-2 text-sm">radio 单选（再点已选行可取消）：</p>
      <TTableRender :definition="single" row-key="id" />
    </div>
  </div>
</template>
