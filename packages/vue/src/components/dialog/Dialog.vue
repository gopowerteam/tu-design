<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { cn } from "@/lib/utils";

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
  /** 标题文案（#title 插槽优先，两者皆无则不渲染标题） */
  title: { type: String, default: undefined },
  /** 描述文案（#description 插槽优先，两者皆无则不渲染描述） */
  description: { type: String, default: undefined },
  /** 是否渲染右上角内置关闭按钮 */
  showCloseButton: { type: Boolean, default: true },
  /** 追加/覆盖面板样式类（默认 sm:max-w-lg 可由此覆盖，如 "sm:max-w-xl"） */
  contentClass: { type: String, default: undefined },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();

// 对 Root 恒走受控模式（open 恒为布尔）：非受控语义由内部 ref 实现，
// 避开 zag uncontrolled 内部状态在部分环境下不同步的问题，两种模式行为一致。
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}

/** 关闭对话框（#footer 作用域插槽注入）：走受控桥把 open 置 false，
 * 与原 TDialogClose（Ark CloseTrigger）的关闭语义等价，退出动画/焦点还原由 zag 处理 */
function close() {
  handleUpdate(false);
}

// 标题/描述有任一来源（props 或插槽）时才渲染头部区块（原 TDialogHeader 布局类）
const hasHeader = computed(() => Boolean(props.title || props.description));

// 面板样式：内置类 + contentClass 合并（twMerge 自动去冲突，后者优先）
const contentClass = computed(() =>
  cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg",
    props.contentClass,
  ),
);
</script>

<template>
  <ArkDialog.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
  >
    <!-- #trigger：触发元素本体（asChild 语义合并到子元素，原 TDialogTrigger 同款实现）；未提供则不渲染触发器 -->
    <ArkDialog.Trigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </ArkDialog.Trigger>

    <ArkDialog.Backdrop
      class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <ArkDialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <ArkDialog.Content :class="contentClass">
        <!-- 标题/描述：#title / #description 插槽优先，回退 title/description props；皆无则不渲染对应 DOM -->
        <div
          v-if="hasHeader || $slots.title || $slots.description"
          class="flex flex-col gap-2 text-center sm:text-left"
        >
          <ArkDialog.Title
            v-if="$slots.title || props.title"
            class="text-lg font-semibold leading-none tracking-tight"
          >
            <slot name="title">{{ props.title }}</slot>
          </ArkDialog.Title>
          <ArkDialog.Description
            v-if="$slots.description || props.description"
            class="text-sm text-muted-foreground"
          >
            <slot name="description">{{ props.description }}</slot>
          </ArkDialog.Description>
        </div>

        <!-- 默认插槽：弹层内容区（原 TDialogContent 的 body 部分） -->
        <slot />

        <!-- 底部操作区：#footer="{ close }" 注入关闭函数，替代原 TDialogClose -->
        <div v-if="$slots.footer" class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <slot name="footer" :close="close" />
        </div>

        <ArkDialog.CloseTrigger
          v-if="props.showCloseButton"
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
        </ArkDialog.CloseTrigger>
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  </ArkDialog.Root>
</template>
