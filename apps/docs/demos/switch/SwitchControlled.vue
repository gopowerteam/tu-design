<script setup lang="ts">
import { ref } from "vue";

const enabled = ref(true);
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <TSwitch v-model:checked="enabled">飞行模式</TSwitch>
    <p class="text-sm text-muted-foreground">当前状态：{{ enabled ? "开启" : "关闭" }}</p>
  </div>
</template>
