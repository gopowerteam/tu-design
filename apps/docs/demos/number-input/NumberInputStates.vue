<script setup lang="ts">
import { ref } from "vue";

const disabledValue = ref<number | null>(10);
const invalidValue = ref<number | null>(10);
</script>

<template>
  <div class="w-72 space-y-3">
    <TNumberInput v-model="disabledValue" disabled />
    <TNumberInput v-model="invalidValue" invalid />
  </div>
</template>
