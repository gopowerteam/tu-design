<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, useSlots } from "vue";
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";
import { cn } from "@/lib/utils";

const props = defineProps({
  /** 提示文字；#content 插槽可覆盖以渲染富内容 */
  content: { type: String, default: undefined },
  /** 受控开关（配合 v-model:open）；不传时为非受控 */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  /** 悬停多久后显示（毫秒） */
  delayDuration: { type: Number, default: undefined },
  /** 移开后多久隐藏（毫秒） */
  closeDuration: { type: Number, default: undefined },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
  /** 追加/覆盖气泡样式（经 cn 合并） */
  contentClass: { type: String, default: undefined },
  /** 透传到气泡 Content 的属性对象（id、data-*、事件监听等） */
  contentProps: {
    type: Object as PropType<Record<string, unknown>>,
    default: undefined,
  },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();

const slots = useSlots();

// open 用 default: undefined 禁用 Boolean casting，保证「未传」可辨（Dialog 同款约定）
// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog 同款）
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}
</script>

<template>
  <ArkTooltip.Root
    :open="isOpen"
    :open-delay="props.delayDuration"
    :close-delay="props.closeDuration"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
  >
    <!-- 默认插槽即触发元素本身：Ark Trigger asChild 把行为（hover/focus、aria）合并其上，
       不额外包裹元素。省略默认插槽即为纯受控气泡（open 驱动，配合 #content） -->
    <ArkTooltip.Trigger v-if="slots.default" as-child>
      <slot />
    </ArkTooltip.Trigger>

    <ArkTooltip.Positioner class="z-50">
      <ArkTooltip.Content
        v-bind="props.contentProps"
        :class="
          cn(
            'bg-primary text-primary-foreground z-50 w-fit rounded-md px-3 py-1.5 text-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            props.contentClass,
          )
        "
      >
        <slot name="content">{{ props.content }}</slot>
      </ArkTooltip.Content>
    </ArkTooltip.Positioner>
  </ArkTooltip.Root>
</template>
