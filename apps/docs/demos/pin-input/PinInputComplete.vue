<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", "", "", ""]);
const completed = ref<string[] | null>(null);

function onComplete(v: string[]) {
  completed.value = v;
}

function reset() {
  value.value = ["", "", "", "", "", ""];
  completed.value = null;
}
</script>

<template>
  <div class="space-y-3">
    <TPinInput v-model="value" type="numeric" :length="6" blur-on-complete @complete="onComplete" />
    <p v-if="completed" class="text-xs text-muted-foreground">
      填满触发 complete：{{ completed.join("") }}（blur-on-complete 自动失焦）
    </p>
    <TButton variant="outline" size="sm" @click="reset">重置</TButton>
  </div>
</template>
