<script setup lang="ts">
const items = [
  { value: "overview", label: "概览" },
  { value: "analytics", label: "分析（暂不可用）", disabled: true },
  { value: "reports", label: "报告" },
];
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TTabs default-value="overview" :items="items" class="w-96">
      <template #panel="{ item }">
        <p class="pt-3 text-sm text-muted-foreground">
          {{
            item.value === "overview"
              ? "禁用的标签不可点击，键盘 ←/→ 导航也会自动跳过它。"
              : "导出周期性报告与订阅设置。"
          }}
        </p>
      </template>
    </TTabs>
    <p class="text-xs text-muted-foreground">
      在 items 项上设置 disabled 即可禁用单个标签，禁用项不参与键盘导航。
    </p>
  </div>
</template>
