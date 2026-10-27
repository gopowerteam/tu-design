<script setup lang="ts">
import { computed, ref } from "vue";

const skills = ref<string[]>(["vue"]);

const skillOptions = [
  { label: "Vue", value: "vue" },
  { label: "TypeScript", value: "ts" },
  { label: "Rust", value: "rust" },
];

const selectedLabels = computed(() =>
  skillOptions
    .filter((opt) => skills.value.includes(opt.value))
    .map((opt) => opt.label)
    .join("、"),
);
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-col gap-2">
      <TCheckbox
        v-for="opt in skillOptions"
        :key="opt.value"
        :checked="skills.includes(opt.value)"
        @update:checked="
          (checked) => {
            skills = checked ? [...skills, opt.value] : skills.filter((v) => v !== opt.value);
          }
        "
      >
        {{ opt.label }}
      </TCheckbox>
    </div>
    <p class="text-muted-foreground text-xs">已选：{{ selectedLabels || "无" }}</p>
  </div>
</template>
