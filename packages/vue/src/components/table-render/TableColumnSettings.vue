<script setup lang="ts">
import type { PropType } from "vue";
import { Popover } from "@/components/popover";

/**
 * 列设置单例宿主：Popover 纯受控（trigger="manual"）+ 组件内部固定 0x0 锚点。
 * 根级渲染、滚动容器外；default 插槽 = 面板内容（透传到 Popover #content）。
 * 锚点坐标由 useColumnSettingsController 计算（fixed 定位，左下角）。
 */
const props = defineProps({
  /** 受控开关（由 controller 驱动） */
  open: { type: Boolean, required: true },
  /** 固定锚点内联样式（position/width/height/left/top） */
  anchorStyle: { type: Object as PropType<Record<string, string>>, required: true },
  /** Popover 面板内容宽度类 */
  contentClass: { type: String, default: "w-64 p-0" },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();
</script>

<template>
  <Popover
    trigger="manual"
    :open="props.open"
    :positioning="{ strategy: 'fixed' }"
    :content-class="props.contentClass"
    @update:open="emit('update:open', $event)"
  >
    <!-- 内部固定锚点：0x0 不参与布局，仅承载定位坐标 -->
    <span
      aria-hidden="true"
      data-column-settings-anchor
      :style="props.anchorStyle"
      class="pointer-events-none fixed block"
    />
    <template #content>
      <slot />
    </template>
  </Popover>
</template>
