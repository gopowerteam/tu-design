<script setup lang="ts">
import { ref } from "vue";

interface Item {
  value: string;
  label: string;
  closable?: boolean;
}

const items = ref<Item[]>([
  { value: "draft", label: "草稿", closable: true },
  { value: "review", label: "评审", closable: true },
  { value: "done", label: "已完成", closable: true },
  { value: "settings", label: "设置" },
]);

const value = ref("draft");

// 关闭单个：移除 item；若关闭的是激活项，选中前一个邻居（受控模式需自行同步 value）
function handleClose(v: string) {
  const idx = items.value.findIndex((i) => i.value === v);
  items.value = items.value.filter((i) => i.value !== v);
  if (value.value === v) {
    value.value = items.value[Math.max(0, idx - 1)]?.value ?? "";
  }
}

// 关闭全部：由 #suffix 插槽中的按钮触发
function closeAll() {
  items.value = items.value.filter((i) => !i.closable);
  if (!items.value.some((i) => i.value === value.value)) {
    value.value = items.value[0]?.value ?? "";
  }
}

function reset() {
  value.value = "draft";
  items.value = [
    { value: "draft", label: "草稿", closable: true },
    { value: "review", label: "评审", closable: true },
    { value: "done", label: "已完成", closable: true },
    { value: "settings", label: "设置" },
  ];
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <TTabs
      v-if="items.length"
      v-model:value="value"
      :items="items"
      class="w-96"
      @close="handleClose"
    >
      <template #suffix>
        <button
          class="text-muted-foreground hover:text-foreground ml-1 px-1 text-xs whitespace-nowrap"
          @click="closeAll"
        >
          关闭全部
        </button>
      </template>
      <template #panel="{ item }">
        <p class="text-muted-foreground pt-3 text-sm">{{ item.label }}面板内容。</p>
      </template>
    </TTabs>
    <p v-else class="text-muted-foreground flex items-center gap-2 text-sm">
      所有可关闭标签已关闭
      <button class="text-foreground underline" @click="reset">重置</button>
    </p>
  </div>
</template>
