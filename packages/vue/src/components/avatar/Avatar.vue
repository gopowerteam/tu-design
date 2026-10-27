<script setup lang="ts">
import type { ImgHTMLAttributes } from "vue";
import { computed, inject, ref } from "vue";
import { Avatar as ArkAvatar, type AvatarStatusChangeDetails } from "@ark-ui/vue/avatar";
import { cn } from "@/lib/utils";
import { avatarGroupKey, avatarVariants, type AvatarVariants } from "./index";

interface Props {
  src?: string;
  alt?: string;
  /** 图片加载失败时的备用图片地址（自动切换；备用图也失败时回落 Fallback 并再次触发 error） */
  fallback?: string;
  /** 预设尺寸或自定义像素值（number） */
  size?: AvatarVariants["size"] | number;
  shape?: AvatarVariants["shape"];
  /** Fallback 背景色覆盖（默认主题 bg-muted） */
  color?: string;
  /** 图片在容器内的适应方式 */
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  /** 透传到底层 img 的原生属性（组件显式属性优先级更高） */
  imgProps?: ImgHTMLAttributes;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  shape: "circle",
  objectFit: "cover",
});

const emit = defineEmits<{
  /** 图片加载完成 */
  load: [details: AvatarStatusChangeDetails];
  /** 图片加载失败（使用 fallback 且其也失败时会再次触发） */
  error: [details: AvatarStatusChangeDetails];
}>();

// Ark 仅上报 loaded/error（zag LoadStatus 双态）；loading 为本地初始态，
// 驱动 #placeholder 插槽与 fallback 切换
const status = ref<"loading" | "loaded" | "error">("loading");

function handleStatusChange(details: AvatarStatusChangeDetails) {
  status.value = details.status;
  if (details.status === "loaded") emit("load", details);
  else emit("error", details);
}

// 失败且配置 fallback 时切换到备用图；切图会重新走加载流程并再次上报状态
const currentSrc = computed(() =>
  status.value === "error" && props.fallback ? props.fallback : props.src,
);

// 头像组注入的 size（子级显式传入优先），缺省回落 md
const groupCtx = inject(avatarGroupKey, null);
const sizeValue = computed(() => props.size ?? groupCtx?.size.value ?? "md");
const sizeStyle = computed(() =>
  typeof sizeValue.value === "number"
    ? { width: `${sizeValue.value}px`, height: `${sizeValue.value}px` }
    : undefined,
);
const variantClass = computed(() =>
  typeof sizeValue.value === "number"
    ? avatarVariants({ shape: props.shape })
    : avatarVariants({ size: sizeValue.value, shape: props.shape }),
);
</script>

<template>
  <ArkAvatar.Root
    :class="cn(variantClass, props.class)"
    :style="sizeStyle"
    @status-change="handleStatusChange"
  >
    <ArkAvatar.Image
      v-if="currentSrc"
      v-bind="props.imgProps"
      :src="currentSrc"
      :alt="props.alt"
      :style="{ objectFit: props.objectFit }"
      class="size-full"
    />
    <ArkAvatar.Fallback
      :style="props.color ? { background: props.color } : undefined"
      class="flex size-full items-center justify-center"
    >
      <slot v-if="currentSrc && status === 'loading'" name="placeholder" />
      <slot v-else>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-1/2"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </slot>
    </ArkAvatar.Fallback>
  </ArkAvatar.Root>
</template>
