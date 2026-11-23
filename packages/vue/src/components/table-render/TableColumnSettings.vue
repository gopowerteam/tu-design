<script setup lang="ts">
import type { PropType } from "vue";
import { Popover } from "@/components/popover";

/**
 * 列设置单例宿主：Popover 纯受控（trigger="manual"）+ 组件内部 0x0 锚点。
 * 根级渲染、滚动容器外；`portal=false` 让面板留在表格根节点内，absolute 定位随表格滚动。
 * default 插槽 = 面板内容（透传到 Popover #content）。
 * 锚点坐标由 useColumnSettingsController 计算（absolute=根节点相对；沙箱回退 fixed）。
 */
const props = defineProps({
  /** 受控开关（由 controller 驱动） */
  open: { type: Boolean, required: true },
  /** 0 尺寸锚点内联样式（position/width/height/left/top） */
  anchorStyle: { type: Object as PropType<Record<string, string>>, required: true },
  /** Popover 面板内容宽度类 */
  contentClass: { type: String, default: "w-64 p-0" },
  /** 定位策略：普通文档 absolute（随表格滚动）；iframe 沙箱回退 fixed */
  strategy: { type: String as PropType<"absolute" | "fixed">, default: "absolute" },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();
</script>

<template>
  <Popover
    trigger="manual"
    :open="props.open"
    :portal="false"
    :positioning="{ strategy: props.strategy }"
    :content-class="props.contentClass"
    @update:open="emit('update:open', $event)"
  >
    <!-- 内部锚点：0x0 不参与布局，仅承载定位坐标 -->
    <span
      aria-hidden="true"
      data-column-settings-anchor
      :style="props.anchorStyle"
      class="pointer-events-none block"
    />
    <template #content>
      <slot />
    </template>
  </Popover>
</template>
