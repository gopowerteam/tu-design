<script setup lang="ts">
import { computed, ref } from "vue";

const password = ref("");

// 组件本身不内置强度指示，这里在组件外部组合一个提示条
const strength = computed(() => {
  const value = password.value;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
});

const levels = [
  { label: "至少 8 位，含字母与数字、符号更佳", width: "w-0", bar: "" },
  { label: "弱：再补充字母或数字", width: "w-1/3", bar: "bg-destructive" },
  { label: "中：加入符号可进一步提升", width: "w-2/3", bar: "bg-primary/50" },
  { label: "强：强度良好", width: "w-full", bar: "bg-primary" },
] as const;

const level = computed(() => levels[strength.value]);
</script>

<template>
  <div class="space-y-2">
    <TPasswordInput
      v-model="password"
      auto-complete="new-password"
      placeholder="设置密码"
      class="w-72"
    />
    <div class="h-1 w-72 overflow-hidden rounded-full bg-muted">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="[level.width, level.bar]"
      ></div>
    </div>
    <p class="text-xs text-muted-foreground">{{ level.label }}</p>
  </div>
</template>
