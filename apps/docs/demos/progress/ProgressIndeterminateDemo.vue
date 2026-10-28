<script setup lang="ts">
import { ref } from "vue";

const indeterminate = ref(true);
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <TProgress :indeterminate="indeterminate" label="连接服务器" />
    <TButton variant="outline" size="sm" @click="indeterminate = !indeterminate">
      {{ indeterminate ? "切换为确定态" : "切换为不确定态" }}
    </TButton>
  </div>
</template>
