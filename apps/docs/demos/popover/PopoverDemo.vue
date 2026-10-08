<template>
  <div class="flex flex-col items-center gap-4">
    <TPopover>
      <TPopoverTrigger>
        <TButton variant="outline">非受控开关</TButton>
      </TPopoverTrigger>
      <TPopoverContent>
        <div class="text-sm font-medium">尺寸说明</div>
        <p class="text-muted-foreground mt-1 text-sm">默认宽度 w-72，可通过 class 覆盖。</p>
      </TPopoverContent>
    </TPopover>

    <TPopover v-model:open="open">
      <TPopoverTrigger as-child>
        <TButton variant="outline">{{ open ? "受控：已展开" : "受控：已收起" }}</TButton>
      </TPopoverTrigger>
      <TPopoverContent class="w-56">
        <p class="text-sm">配合 v-model:open 的受控用法。</p>
      </TPopoverContent>
    </TPopover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
