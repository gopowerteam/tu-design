<script setup lang="ts">
import type { PropType } from "vue";
import { computed, getCurrentInstance, ref } from "vue";
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";

// 用运行时 props 显式 default: undefined：Boolean prop 缺省时 Vue 会 cast 成 false，
// 导致无法区分「未传（非受控）」与「传了 false（受控关闭）」。与 Dialog.vue 同款约定。
const props = defineProps({
  /** 受控开关（配合 v-model:open）；不传时为非受控，由内部状态管理 */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 标题文案（#title 插槽优先） */
  title: { type: String, required: true },
  /** 描述文案（#description 插槽优先，可不传） */
  description: { type: String, default: undefined },
  /** 确认按钮文案 */
  confirmText: { type: String, default: "确定" },
  /** 取消按钮文案 */
  cancelText: { type: String, default: "取消" },
  /** 确认按钮使用 destructive 语义色（危险操作场景） */
  destructive: { type: Boolean, default: false },
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  confirm: [];
  cancel: [];
}>();

// 对 Root 恒走受控模式（open 恒为布尔）：非受控语义由内部 ref 实现，与 Dialog.vue 一致。
// setup 期间捕获实例：getCurrentInstance 仅在 setup/生命周期内有效，事件回调里返回 null。
const instance = getCurrentInstance();
const internalOpen = ref(false);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  // pending 期间忽略一切关闭请求（走受控桥拒绝同步，弹窗保持打开）——
  // 与 Popconfirm 同款锁定方案；Root 仍保留 :close-on-escape/:close-on-interact-outside 双保险
  if (!open && loading.value) return;
  internalOpen.value = open;
  emit("update:open", open);
}

/** 关闭弹窗：走受控桥把 open 置 false，退出动画/焦点还原由 zag 处理 */
function close() {
  handleUpdate(false);
}

// 确认 Promise pending 时锁定关闭通道（ESC/遮罩/取消按钮全部锁死），只能等 Promise 落定
const loading = ref(false);
const locked = computed(() => loading.value);

/**
 * 确认：emit 不会回传处理器返回值，因此从 vnode 上直接取原始 onConfirm 处理器调用——
 * 返回 Promise 时进入 loading 并锁定关闭，resolve 后自动关闭，reject 保持打开且退出 loading；
 * 同步处理器（或无处理器）直接关闭。
 */
function handleConfirm() {
  if (loading.value) return;
  const handler = instance?.vnode.props?.onConfirm as ((...args: unknown[]) => unknown) | undefined;
  const result = handler?.();
  if (!handler) emit("confirm");
  if (result instanceof Promise) {
    loading.value = true;
    result
      .then(() => {
        loading.value = false;
        close();
      })
      .catch(() => {
        loading.value = false;
      });
  } else {
    close();
  }
}

/** 取消：pending 时同样锁定；确认关闭并派发 cancel */
function handleCancel() {
  if (loading.value) return;
  emit("cancel");
  close();
}

// 面板样式：复用 Dialog 的内容面板类，宽度收窄为 sm:max-w-md 的确认弹窗尺度
const contentClass = computed(() =>
  cn(
    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-md",
  ),
);
</script>

<template>
  <ArkDialog.Root
    :open="isOpen"
    :close-on-escape="!locked"
    :close-on-interact-outside="!locked"
    @update:open="handleUpdate"
  >
    <ArkDialog.Backdrop
      class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <ArkDialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- role="alertdialog"：覆盖 Ark Content 默认 role="dialog"，补偿无上游 AlertDialog 原语的角色语义 -->
      <ArkDialog.Content :class="contentClass" role="alertdialog" aria-modal="true">
        <div class="flex flex-col gap-2 text-center sm:text-left">
          <ArkDialog.Title class="text-lg font-semibold leading-none tracking-tight">
            <slot name="title">{{ props.title }}</slot>
          </ArkDialog.Title>
          <ArkDialog.Description
            v-if="$slots.description || props.description"
            class="text-sm text-muted-foreground"
          >
            <slot name="description">{{ props.description }}</slot>
          </ArkDialog.Description>
        </div>

        <!-- 默认插槽：补充正文（可选） -->
        <slot />

        <!-- 底部操作区：取消 outline，确认按 destructive 切换语义色；pending 时确认钮转 loading -->
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" :disabled="loading" @click="handleCancel">
            {{ props.cancelText }}
          </Button>
          <Button
            :variant="props.destructive ? 'destructive' : 'default'"
            :disabled="loading"
            @click="handleConfirm"
          >
            <svg
              v-if="loading"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              class="size-4 animate-spin"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {{ props.confirmText }}
          </Button>
        </div>
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  </ArkDialog.Root>
</template>
