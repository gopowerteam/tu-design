<script setup lang="ts">
import type { PropType } from "vue";
import { computed, useAttrs } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import type { MenuRootProps } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";
import { useControlledBoolean } from "../overlay-shared/useControlledBoolean";
import { withSandboxStrategy } from "../overlay-shared/useSandboxOverlay";
import MenuItems from "./MenuItems.vue";
import type { MenuItemOption } from "./types";

defineOptions({ name: "DropdownMenu", inheritAttrs: false });

const props = defineProps({
  /** 菜单项描述列表（item/label/separator/group 四种形态，group 可嵌套） */
  items: { type: Array as PropType<MenuItemOption[]>, required: true },
  /** 受控开关（配合 v-model:open）；不传时为非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
  /** 追加到触发元素上的 class（默认插槽内容即触发元素本身） */
  triggerClass: { type: String, default: undefined },
  /** 追加到菜单面板上的 class */
  contentClass: { type: String, default: undefined },
  /** Ark Menu Root 的 positioning 配置（placement/gutter 等）；
      iframe realm（wujie graft / iframe 嵌入）下 strategy 未显式指定时默认 fixed
      （absolute 包含块错位修正，机制详注见 useSandboxOverlay / sandbox.ts） */
  positioning: {
    type: Object as PropType<MenuRootProps["positioning"]>,
    default: undefined,
  },
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  /** 选中某个 item 时触发（closeOnSelect 关闭后仍会先发出） */
  select: [details: { value: string }];
}>();

// attrs 转发到面板元素（Root 不渲染 DOM，避免 fallthrough 警告）
const attrs = useAttrs();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog/DatePicker 同款）
const { isOpen, setOpen } = useControlledBoolean({
  controlled: () => props.open,
  defaultValue: () => props.defaultOpen,
  onChange: (open) => emit("update:open", open),
});

// 沙箱适配（机制详注见 useSandboxOverlay / sandbox.ts）：面板无 Teleport 留原地，
// iframe realm 下 strategy 默认 fixed 消除 absolute 包含块（最近 positioned 祖先）错位
const rootPositioning = computed(() =>
  withSandboxStrategy(props.positioning, { ...props.positioning }),
);

function handleSelect(details: { value: string }) {
  emit("select", details);
}

// 样式类（收编自原 DropdownMenuContent.vue）
const contentCls =
  "bg-popover text-popover-foreground z-[var(--z-overlay)] min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";
</script>

<template>
  <ArkMenu.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    :positioning="rootPositioning"
    @update:open="setOpen"
    @select="handleSelect"
  >
    <!-- 默认插槽 = 触发元素本身（asChild 透传，行为合并不额外包裹元素） -->
    <ArkMenu.Trigger as-child :class="props.triggerClass">
      <slot />
    </ArkMenu.Trigger>

    <ArkMenu.Positioner class="z-[var(--z-overlay)]">
      <ArkMenu.Content v-bind="attrs" :class="cn(contentCls, props.contentClass)">
        <MenuItems :items="props.items">
          <template v-if="$slots.item" #item="slotProps">
            <slot name="item" v-bind="slotProps" />
          </template>
        </MenuItems>
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </ArkMenu.Root>
</template>
