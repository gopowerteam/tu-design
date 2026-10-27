<template>
  <div class="flex flex-col items-center gap-3">
    <TTabs default-value="lazy" lazy-mount unmount-on-exit class="w-96">
      <TTabsList>
        <TTabsTrigger value="lazy">懒加载面板</TTabsTrigger>
        <TTabsTrigger value="static">常驻面板</TTabsTrigger>
      </TTabsList>
      <TTabsContent value="lazy" class="pt-3 text-sm text-muted-foreground">
        <div @vue:mounted="lazyMounts++">
          懒加载面板已挂载 {{ lazyMounts }} 次——切走即卸载，切回重新挂载。
        </div>
      </TTabsContent>
      <TTabsContent value="static" class="pt-3 text-sm text-muted-foreground">
        未加 lazy-mount 的面板切换后保持挂载，状态不丢失。
      </TTabsContent>
    </TTabs>
    <p class="text-xs text-muted-foreground">
      lazy-mount：首次激活才挂载；unmount-on-exit：切走即卸载。切换标签观察挂载次数变化。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const lazyMounts = ref(0);
</script>
