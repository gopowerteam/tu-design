<template>
  <div class="flex justify-center">
    <TSelect v-model="framework" :items="frameworks" class="w-48">
      <TSelectTrigger>
        <TSelectValueText placeholder="选择框架" />
      </TSelectTrigger>
      <TSelectContent>
        <TSelectItem v-for="item in frameworks" :key="item.value" :item="item" />
      </TSelectContent>
    </TSelect>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const framework = ref<string>();
const frameworks = [
  { label: "Vue", value: "vue" },
  { label: "React", value: "react" },
  { label: "Svelte", value: "svelte" },
];
</script>
