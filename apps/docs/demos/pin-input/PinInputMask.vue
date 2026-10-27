<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", "", "", ""]);
</script>

<template>
  <div class="space-y-3">
    <TPinInput v-model="value" mask :length="6" disabled class="w-72" />
    <TPinInput v-model="value" mask :length="6" invalid>
      <template #separator>
        <span class="text-muted-foreground text-sm">–</span>
      </template>
    </TPinInput>
    <p class="text-xs text-muted-foreground">
      mask 以密码形态显示；separator 插槽渲染 length − 1 次；invalid 套 destructive 边框与焦点环。
    </p>
  </div>
</template>
