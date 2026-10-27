<script setup lang="ts">
import { ref } from "vue";

const password = ref("");
const visible = ref(false);
</script>

<template>
  <div class="space-y-2">
    <TPasswordInput v-model="password" v-model:visible="visible" class="w-72">
      <template #visibility-icon="{ visible: isVisible }">
        <span class="text-xs">{{ isVisible ? "隐藏" : "显示" }}</span>
      </template>
    </TPasswordInput>
    <p class="text-xs text-muted-foreground">
      visibility-icon 插槽作用域为 { visible }，可整体替换默认的 Eye / EyeOff 图标。
    </p>
  </div>
</template>
