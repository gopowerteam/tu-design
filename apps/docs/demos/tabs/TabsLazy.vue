<script setup lang="ts">
import { ref } from "vue";

const lazyMounts = ref(0);

const items = [
  { value: "lazy", label: "懒加载面板", lazyMount: true, unmountOnExit: true },
  { value: "static", label: "常驻面板" },
];
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TTabs default-value="lazy" :items="items" class="w-96">
      <template #panel="{ item }">
        <p
          v-if="item.value === 'lazy'"
          class="pt-3 text-sm text-muted-foreground"
          @vue:mounted="lazyMounts++"
        >
          懒加载面板已挂载 {{ lazyMounts }} 次——切走即卸载，切回重新挂载。
        </p>
        <p v-else class="pt-3 text-sm text-muted-foreground">
          未配置懒挂载的面板切换后保持挂载，状态不丢失。
        </p>
      </template>
    </TTabs>
    <p class="text-xs text-muted-foreground">
      item 级 lazyMount：首次激活才挂载；unmountOnExit：切走即卸载。切换标签观察挂载次数变化。
    </p>
  </div>
</template>
