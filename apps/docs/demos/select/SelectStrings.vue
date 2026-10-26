<script setup lang="ts">
import { ref } from "vue";

const city = ref<string>();
const cities = ["杭州", "上海", { label: "深圳", value: "sz", disabled: true }];
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <TSelect v-model="city" :items="cities" class="w-48">
      <TSelectTrigger>
        <TSelectValueText placeholder="选择城市" />
      </TSelectTrigger>
      <TSelectContent>
        <TSelectItem v-for="(item, i) in cities" :key="i" :item="item" />
      </TSelectContent>
    </TSelect>
    <p class="text-sm text-muted-foreground">当前值：{{ city ?? "（未选）" }}</p>
  </div>
</template>
