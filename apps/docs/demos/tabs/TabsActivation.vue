<script setup lang="ts">
const items = [
  { value: "one", label: "第一个" },
  { value: "two", label: "第二个" },
];
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <TTabs default-value="one" :items="items" class="w-full">
        <template #panel="{ item }">
          <p class="pt-3 text-sm text-muted-foreground">
            {{
              item.value === "one"
                ? "聚焦即切换。"
                : "automatic（默认）：←/→ 移动焦点时立即切换面板。"
            }}
          </p>
        </template>
      </TTabs>
      <p class="text-xs text-muted-foreground">activation-mode="automatic"（默认）</p>
    </div>
    <div class="flex flex-col gap-2">
      <TTabs default-value="one" activation-mode="manual" :items="items" class="w-full">
        <template #panel="{ item }">
          <p class="pt-3 text-sm text-muted-foreground">
            {{
              item.value === "one"
                ? "需确认切换。"
                : "manual：←/→ 只移动焦点，按 Enter 或点击才切换。"
            }}
          </p>
        </template>
      </TTabs>
      <p class="text-xs text-muted-foreground">activation-mode="manual"</p>
    </div>
  </div>
</template>
