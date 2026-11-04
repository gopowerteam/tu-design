<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TPopover trigger="hover" :open-delay="150" :close-delay="150">
      <TButton variant="outline" size="sm">悬停（hover）</TButton>
      <template #content>
        <p class="text-sm">鼠标移入 150ms 后打开，移出 150ms 后关闭；悬浮面板保持打开。</p>
      </template>
    </TPopover>

    <TPopover trigger="focus">
      <TButton variant="outline" size="sm">聚焦（focus）</TButton>
      <template #content>
        <p class="text-sm">键盘 Tab 或点击聚焦触发；焦点移入面板保持打开，离开面板后关闭。</p>
      </template>
    </TPopover>

    <TPopover trigger="manual" v-model:open="manualOpen">
      <TButton variant="outline" size="sm" @click="manualOpen = !manualOpen">
        手动（manual，{{ manualOpen ? "点击关闭" : "点击打开" }}）
      </TButton>
      <template #content>
        <p class="text-sm">manual 纯受控：不响应 hover/focus，完全由 v-model:open 驱动。</p>
      </template>
    </TPopover>

    <TPopover trigger="hover" disabled>
      <TButton variant="outline" size="sm" disabled>禁用（disabled）</TButton>
      <template #content>
        <p class="text-sm">disabled 时不响应任何触发事件。</p>
      </template>
    </TPopover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const manualOpen = ref(false);
</script>
