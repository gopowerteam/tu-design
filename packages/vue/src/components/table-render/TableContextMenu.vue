<script setup lang="ts">
import type { PropType } from "vue";
import { DropdownMenu } from "@/components/dropdown-menu";
import type { MenuItemOption } from "@/components/dropdown-menu/types";

/**
 * 右键命令菜单单例宿主：受控 DropdownMenu + 组件内部固定 0x0 锚点。
 * 根级渲染、滚动容器外；面板挂 data-table-menu 并阻断内部右键（协议⑥）。
 */
const props = defineProps({
  open: { type: Boolean, required: true },
  items: { type: Array as PropType<MenuItemOption[]>, required: true },
  anchorStyle: { type: Object as PropType<Record<string, string>>, required: true },
  /** 定位策略：普通文档 absolute（随表格滚动）；iframe 沙箱回退 fixed */
  strategy: { type: String as PropType<"absolute" | "fixed">, default: "absolute" },
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [value: string];
}>();

/**
 * 面板内部右键：阻断冒泡（避免根级 handler 重新定位）并屏蔽原生菜单
 * @param event - 面板 contextmenu 事件
 */
function onPanelContextMenu(event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();
}
</script>

<template>
  <DropdownMenu
    :open="props.open"
    :items="props.items"
    :positioning="{ strategy: props.strategy }"
    data-table-menu
    @update:open="emit('update:open', $event)"
    @select="emit('select', $event.value)"
    @contextmenu="onPanelContextMenu"
  >
    <!-- 内部固定锚点：0x0 不参与布局，坐标即右键位置（absolute=根节点相对） -->
    <span
      aria-hidden="true"
      data-table-menu-anchor
      :style="props.anchorStyle"
      class="pointer-events-none block"
    />
  </DropdownMenu>
</template>
