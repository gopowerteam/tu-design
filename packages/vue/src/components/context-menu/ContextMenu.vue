<script setup lang="ts">
import type { PropType } from "vue";
import { computed, useAttrs } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import type { MenuRootProps } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";
import { withSandboxStrategy } from "../overlay-shared/useSandboxOverlay";
// 与 dropdown-menu 同构：items 类型与渲染逻辑直接复用其实现（单一事实来源）
import MenuItems from "../dropdown-menu/MenuItems.vue";
import type { MenuItemOption } from "../dropdown-menu/types";

defineOptions({ name: "ContextMenu", inheritAttrs: false });

const props = defineProps({
  /** 菜单项描述列表，与 DropdownMenu 的 items 完全同构（item/label/separator/group 四种形态，group 可嵌套） */
  items: { type: Array as PropType<MenuItemOption[]>, required: true },
  /** Ark Menu Root 的 positioning 配置（gutter 等；placement 由指针 anchorPoint 驱动）；
      iframe realm（wujie graft / iframe 嵌入）下 strategy 未显式指定时默认 fixed
      （absolute 包含块错位修正，机制详注见 useSandboxOverlay / sandbox.ts） */
  positioning: {
    type: Object as PropType<MenuRootProps["positioning"]>,
    default: undefined,
  },
});

// 仅暴露选中事件；开合由触发元素上的右键（contextmenu）事件驱动，ark 内部管理状态
const emit = defineEmits<{
  /** 选中某个 item 时触发（对齐 DropdownMenu 的事件语义） */
  select: [details: { value: string }];
}>();

// attrs 转发到面板元素（Root 不渲染 DOM，避免 fallthrough 警告）
const attrs = useAttrs();

function handleSelect(details: { value: string }) {
  emit("select", details);
}

// 沙箱适配（机制详注见 useSandboxOverlay / sandbox.ts）：面板无 Teleport 留原地，
// iframe realm 下 strategy 默认 fixed 使指针 anchorPoint 视口坐标与包含块对齐
const rootPositioning = computed(() =>
  withSandboxStrategy(props.positioning, { ...props.positioning }),
);

// 面板样式对齐 DropdownMenu 面板（token 化，暗色随主题变量自动切换）
const contentCls =
  "bg-popover text-popover-foreground z-[var(--z-overlay)] min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";
</script>

<template>
  <ArkMenu.Root :positioning="rootPositioning" @select="handleSelect">
    <!-- 默认插槽 = 触发元素本身（ContextTrigger as-child 透传，右键唤出并定位到指针处） -->
    <ArkMenu.ContextTrigger as-child>
      <slot />
    </ArkMenu.ContextTrigger>

    <ArkMenu.Positioner class="z-[var(--z-overlay)]">
      <ArkMenu.Content v-bind="attrs" :class="cn(contentCls)">
        <MenuItems :items="props.items" />
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </ArkMenu.Root>
</template>
