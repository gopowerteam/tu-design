<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", ""]);

function onComplete(v: string[]) {
  console.log("验证码填写完成", v);
}
</script>

<template>
  <div class="space-y-2">
    <TPinInput v-model="value" type="numeric" otp @complete="onComplete">
      <TPinInputInput v-for="(_, i) in value" :key="i" :index="i" />
    </TPinInput>
    <p class="text-sm text-muted-foreground">
      已填 {{ value.filter(Boolean).length }} / {{ value.length }}
    </p>
  </div>
</template>
