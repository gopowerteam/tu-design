<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, useAttrs } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";
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
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  /** 选中某个 item 时触发（closeOnSelect 关闭后仍会先发出） */
  select: [details: { value: string }];
}>();

// attrs 转发到面板元素（Root 不渲染 DOM，避免 fallthrough 警告）
const attrs = useAttrs();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog/DatePicker 同款）
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}

function handleSelect(details: { value: string }) {
  emit("select", details);
}

// 样式类（收编自原 DropdownMenuContent.vue）
const contentCls =
  "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";
</script>

<template>
  <ArkMenu.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
    @select="handleSelect"
  >
    <!-- 默认插槽 = 触发元素本身（asChild 透传，行为合并不额外包裹元素） -->
    <ArkMenu.Trigger as-child :class="props.triggerClass">
      <slot />
    </ArkMenu.Trigger>

    <ArkMenu.Positioner class="z-50">
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
