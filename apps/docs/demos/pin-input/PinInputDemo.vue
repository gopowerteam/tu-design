<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", ""]);
const completed = ref(false);

function onComplete() {
  completed.value = true;
}

function onInput() {
  completed.value = false;
}
</script>

<template>
  <div class="space-y-2">
    <TPinInput
      v-model="value"
      type="numeric"
      otp
      :length="4"
      @complete="onComplete"
      @update:model-value="onInput"
    />
    <p class="text-xs text-muted-foreground">
      已填 {{ value.filter(Boolean).length }} / {{ value.length }}
      {{ completed ? "· 填满触发 complete" : "" }}
    </p>
  </div>
</template>
