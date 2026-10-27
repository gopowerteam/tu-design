<script setup lang="ts">
import { ref } from "vue";

// length 6 + alphanumeric + 自定义占位符
const value = ref<string[]>(["", "", "", "", "", ""]);
</script>

<template>
  <div class="space-y-2">
    <TPinInput v-model="value" type="alphanumeric" :length="6" placeholder="·" class="w-72" />
    <p class="text-xs text-muted-foreground">
      length 控制格数；alphanumeric 接受字母与数字，placeholder 自定义空格占位符。
    </p>
  </div>
</template>
