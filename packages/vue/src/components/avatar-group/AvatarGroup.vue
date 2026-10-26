<script setup lang="ts">
import { Comment, Text, computed, provide, ref, toRef, useSlots } from "vue";
import { cn } from "@/lib/utils";
import { Avatar, avatarGroupKey, type AvatarVariants } from "../avatar";

interface Props {
  /** 最多展示的子头像数，超出折叠为 +N 尾巴（按 default 插槽内子 Avatar 计数） */
  max?: number;
  vertical?: boolean;
  /** 下发给子 Avatar 的尺寸（子级显式 size 优先） */
  size?: AvatarVariants["size"] | number;
  /** 悬停展开全部头像（仅在设置了 max 时生效） */
  expandOnHover?: boolean;
  /** 子头像加描边（Group 内部分隔） */
  bordered?: boolean;
  class?: string;
}

const props = defineProps<Props>();

const slots = useSlots();
const expanded = ref(false);

provide(avatarGroupKey, { size: toRef(props, "size") });

// 统计 default 插槽中的元素级 VNode（过滤注释与文本节点）
const total = computed(
  () => slots.default?.().filter((v) => v.type !== Comment && v.type !== Text).length ?? 0,
);

const restCount = computed(() =>
  props.max != null && total.value > props.max ? total.value - props.max : 0,
);

const showRest = computed(() => restCount.value > 0 && !(props.expandOnHover && expanded.value));

// 溢出折叠：nth-child 规则命中 max+1 之后的元素；+N 尾巴也命中该规则，用 !inline-flex 覆盖
const overflowClass = computed(() =>
  props.max != null && !expanded.value ? `[&>*:nth-child(n+${props.max + 1})]:hidden` : undefined,
);

function onEnter() {
  if (props.expandOnHover) expanded.value = true;
}

function onLeave() {
  expanded.value = false;
}
</script>

<template>
  <div
    :class="
      cn(
        'inline-flex items-center',
        props.vertical ? 'flex-col [&>*+*]:-mt-2' : 'flex-row [&>*+*]:-ml-2',
        overflowClass,
        props.bordered && '[&>*]:ring-2 [&>*]:ring-background',
        props.class,
      )
    "
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <slot />
    <Avatar v-if="showRest" class="!inline-flex font-medium">
      <slot name="rest" :rest="restCount">+{{ restCount }}</slot>
    </Avatar>
  </div>
</template>
