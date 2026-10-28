<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Drawer as ArkDrawer } from "@ark-ui/vue/drawer";
import { cn } from "@/lib/utils";

type Placement = "top" | "right" | "bottom" | "left";
type Size = "sm" | "default" | "lg";

// 用运行时 props 显式 default: undefined：Boolean prop 缺省时 Vue 会 cast 成 false，
// 导致无法区分「未传（非受控）」与「传了 false（受控关闭）」。
const props = defineProps({
  /** 受控开关（配合 v-model:open）；不传时为非受控，由内部状态管理 */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 非受控时的初始开关 */
  defaultOpen: { type: Boolean, default: false },
  /** 首次打开前不挂载内容 */
  lazyMount: { type: Boolean, default: false },
  /** 关闭后卸载内容（关闭动画结束后） */
  unmountOnExit: { type: Boolean, default: false },
  /** 抽屉弹出方向 */
  placement: { type: String as PropType<Placement>, default: "right" },
  /** 尺寸档位：侧向（left/right）为宽度，顶/底向（top/bottom）为高度 */
  size: { type: String as PropType<Size>, default: "default" },
  /** 标题文案（#title 插槽优先，两者皆无则不渲染标题） */
  title: { type: String, default: undefined },
  /** 描述文案（#description 插槽优先，两者皆无则不渲染描述） */
  description: { type: String, default: undefined },
  /** 是否渲染右上角内置关闭按钮（aria-label="关闭"） */
  showCloseButton: { type: Boolean, default: true },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();

// 对 Root 恒走受控模式（open 恒为布尔）：非受控语义由内部 ref 实现，
// 与 Dialog 同款桥接，两种模式行为一致。
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}

/** 关闭抽屉（#footer 作用域插槽注入） */
function close() {
  handleUpdate(false);
}

// 标题/描述有任一来源（props 或插槽）时才渲染头部区块
const hasHeader = computed(() => Boolean(props.title || props.description));

// 定位与尺寸：侧向=宽度档位，顶/底向=高度档位；边框贴合抽屉边缘
const placementConfig: Record<
  Placement,
  { positioner: string; content: string; sizes: Record<Size, string> }
> = {
  right: {
    positioner: "justify-end",
    content: "inset-y-0 right-0 h-full border-l",
    // 档位类带 sm: 前缀 + 基础类用无前缀全宽：tw-merge 对不同断点前缀不互相覆盖，
    // 语义确定为「移动端全宽、sm 起按档位」（写成 "w-full sm:w-96" 而非让 tw-merge 去重）
    sizes: { sm: "sm:w-80", default: "sm:w-96", lg: "sm:w-[40rem]" },
  },
  left: {
    positioner: "justify-start",
    content: "inset-y-0 left-0 h-full border-r",
    sizes: { sm: "sm:w-80", default: "sm:w-96", lg: "sm:w-[40rem]" },
  },
  top: {
    positioner: "items-start",
    content: "inset-x-0 top-0 w-full border-b",
    sizes: { sm: "sm:h-64", default: "sm:h-80", lg: "sm:h-[28rem]" },
  },
  bottom: {
    positioner: "items-end",
    content: "inset-x-0 bottom-0 w-full border-t",
    sizes: { sm: "sm:h-64", default: "sm:h-80", lg: "sm:h-[28rem]" },
  },
};

// 进出场动画随 placement 方向自适应：从哪侧弹出就从哪侧滑入，退场对称滑出
const placementAnimations: Record<Placement, string> = {
  right: "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  bottom: "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
};

const config = computed(() => placementConfig[props.placement]);

const isLateral = computed(() => props.placement === "left" || props.placement === "right");

// 面板样式：定位 + 档位尺寸 + 方向动画
// 侧向：基础 w-full（移动端全宽）+ sm: 断点档位宽度；顶/底向：基础 h-full + sm: 档位高度
const contentClass = computed(() =>
  cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 overflow-y-auto p-6 shadow-lg duration-200",
    config.value.content,
    isLateral.value
      ? cn("w-full", config.value.sizes[props.size])
      : cn("h-full", config.value.sizes[props.size]),
    placementAnimations[props.placement],
  ),
);
</script>

<template>
  <ArkDrawer.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
  >
    <ArkDrawer.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkDrawer.Trigger>

    <ArkDrawer.Backdrop
      class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <ArkDrawer.Positioner :class="cn('fixed inset-0 z-50 flex', config.positioner)">
      <ArkDrawer.Content :class="contentClass">
        <div v-if="hasHeader || $slots.title || $slots.description" class="flex flex-col gap-1.5">
          <ArkDrawer.Title
            v-if="$slots.title || props.title"
            class="text-lg font-semibold leading-none tracking-tight"
          >
            <slot name="title">{{ props.title }}</slot>
          </ArkDrawer.Title>
          <ArkDrawer.Description
            v-if="$slots.description || props.description"
            class="text-sm text-muted-foreground"
          >
            <slot name="description">{{ props.description }}</slot>
          </ArkDrawer.Description>
        </div>

        <slot />

        <div
          v-if="$slots.footer"
          class="mt-auto flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"
        >
          <slot name="footer" :close="close" />
        </div>

        <ArkDrawer.CloseTrigger
          v-if="props.showCloseButton"
          aria-label="关闭"
          class="absolute right-4 top-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span class="sr-only">关闭</span>
        </ArkDrawer.CloseTrigger>
      </ArkDrawer.Content>
    </ArkDrawer.Positioner>
  </ArkDrawer.Root>
</template>
