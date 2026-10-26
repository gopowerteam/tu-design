<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", "", "", ""]);
</script>

<template>
  <div class="space-y-2">
    <TPinInput v-model="value" mask :length="6">
      <template #separator>
        <span class="text-muted-foreground text-sm">–</span>
      </template>
    </TPinInput>
    <p class="text-sm text-muted-foreground">掩码显示 · 分隔符渲染 length − 1 次</p>
  </div>
</template>
