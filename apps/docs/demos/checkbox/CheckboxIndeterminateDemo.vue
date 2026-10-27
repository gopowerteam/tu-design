<script setup lang="ts">
import { computed, ref } from "vue";

const items = ref([
  { label: "邮件", checked: true },
  { label: "短信", checked: true },
  { label: "站内信", checked: false },
]);

const allChecked = computed(() => items.value.every((item) => item.checked));
// 全选 → true，全不选 → false，否则半选（indeterminate 短横线）
const parentChecked = computed<boolean | "indeterminate">(() =>
  allChecked.value ? true : items.value.some((item) => item.checked) ? "indeterminate" : false,
);

function toggleAll(checked: boolean) {
  items.value = items.value.map((item) => ({ ...item, checked }));
}
</script>

<template>
  <div class="flex w-60 flex-col items-stretch gap-2">
    <TCheckbox :checked="parentChecked" @update:checked="toggleAll"> 通知方式（全选） </TCheckbox>
    <div class="ml-6 flex flex-col gap-2 border-l pl-4">
      <TCheckbox
        v-for="(item, index) in items"
        :key="item.label"
        :checked="item.checked"
        @update:checked="
          (checked) => {
            items[index] = { ...item, checked };
          }
        "
      >
        {{ item.label }}
      </TCheckbox>
    </div>
    <p class="text-muted-foreground text-xs">父项勾选/半选/未选随子项联动</p>
  </div>
</template>
