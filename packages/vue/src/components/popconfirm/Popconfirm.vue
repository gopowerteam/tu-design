<script setup lang="ts">
import type { PropType } from "vue";
import { computed, getCurrentInstance, ref, useAttrs } from "vue";
import { Popover as ArkPopover } from "@ark-ui/vue/popover";
import { Popover } from "@/components/popover";
import { Button } from "@/components/button";

/**
 * 气泡确认：Popover 的一体式薄壳变体，面板内容内置 title/description + 确认/取消按钮。
 * 行为与 M2 AlertDialog 对齐：@confirm 处理器返回 Promise 时确认钮进入 loading 并锁定全部
 * 关闭通道（ESC/点外部/触发器/取消钮），resolve 后自动关闭、reject 保持打开；
 * 同步处理器点击确认/取消后自动关闭并派发对应事件。
 */

const props = defineProps({
  /** 气泡标题（渲染为 Ark Popover.Title，content 自动接线 aria-labelledby） */
  title: { type: String, required: true },
  /** 气泡描述（可选，渲染为 Ark Popover.Description，content 自动接线 aria-describedby） */
  description: { type: String, default: undefined },
  /** 确认按钮文案 */
  confirmText: { type: String, default: "确定" },
  /** 取消按钮文案 */
  cancelText: { type: String, default: "取消" },
  /** 确认按钮风格：default 主色 / destructive 危险色 */
  variant: {
    type: String as PropType<"default" | "destructive">,
    default: "default",
  },
  /** 受控开关（配合 v-model:open）；不传时为非受控，由内部状态管理 */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  confirm: [];
  cancel: [];
}>();

defineOptions({ inheritAttrs: false });

// attrs（positioning/modal 等 Ark Root 属性）原样透传给 Popover，由其合并到 Ark Root
const attrs = useAttrs();

// setup 期间捕获实例：getCurrentInstance 仅在 setup/生命周期内有效，事件回调里返回 null
const instance = getCurrentInstance();

// 确认 Promise pending 标记：锁定关闭通道与操作按钮
const loading = ref(false);

// —— 受控桥接（Popover/Dialog 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
const internalOpen = ref(false);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  // pending 期间忽略一切关闭请求（走受控桥拒绝同步，气泡保持展开）
  if (!open && loading.value) return;
  internalOpen.value = open;
  emit("update:open", open);
}

/** 关闭气泡：走受控桥把 open 置 false，定位回退/动画由 zag 处理 */
function close() {
  handleUpdate(false);
}

/**
 * 确认：emit 不回传监听器返回值，因此从 vnode 取原始 onConfirm 处理器直接调用
 * （该调用本身就是父级监听器，不会重复派发）。返回 Promise 时进入 loading 并锁定关闭，
 * resolve 后自动关闭，reject 保持打开并退出 loading；同步处理器直接关闭。
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

/** 取消：pending 期间锁定；派发 cancel 并关闭 */
function handleCancel() {
  if (loading.value) return;
  emit("cancel");
  close();
}
</script>

<template>
  <!-- 薄壳复用 Popover：触发器 asChild、受控桥、定位与进出场动画均由 Popover 提供 -->
  <Popover v-bind="attrs" :open="isOpen" content-class="w-64 p-3" @update:open="handleUpdate">
    <!-- 默认插槽即触发元素本体（asChild 语义合并到子元素） -->
    <slot />
    <template #content>
      <ArkPopover.Title class="text-sm font-medium">{{ props.title }}</ArkPopover.Title>
      <ArkPopover.Description v-if="props.description" class="mt-1 text-xs text-muted-foreground">
        {{ props.description }}
      </ArkPopover.Description>
      <!-- 操作区：取消 outline，确认按 variant 切换语义色；pending 时双钮禁用 + 确认钮转 loading -->
      <div class="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" :disabled="loading" @click="handleCancel">
          {{ props.cancelText }}
        </Button>
        <Button
          :variant="props.variant === 'destructive' ? 'destructive' : 'default'"
          size="sm"
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
    </template>
  </Popover>
</template>
