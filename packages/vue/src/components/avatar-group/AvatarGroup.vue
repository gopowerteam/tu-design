<script setup lang="ts">
import { Comment, Fragment, Text, computed, provide, ref, toRef, useSlots, type VNode } from "vue";
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

// default 插槽的元素级 VNode（过滤注释与文本节点）。
// 真实模板中 v-for 会把子节点包进单个 Fragment vnode，须递归展平后再计数/切片——
// 否则 total 恒为 1，max 折叠在插槽用 v-for 时（绝大多数真实用法）整体失效
function flattenVnodes(vnodes: VNode[]): VNode[] {
  return vnodes.flatMap((v) => {
    if (v.type === Fragment && Array.isArray(v.children))
      return flattenVnodes(v.children as VNode[]);
    return v.type !== Comment && v.type !== Text ? [v] : [];
  });
}

const childVnodes = computed(() => flattenVnodes(slots.default?.() ?? []));

const total = computed(() => childVnodes.value.length);

const restCount = computed(() =>
  props.max != null && total.value > props.max ? total.value - props.max : 0,
);

const showRest = computed(() => restCount.value > 0 && !(props.expandOnHover && expanded.value));

// 折叠直接切片渲染：nth-child 动态类（[&>*:nth-child(n+X)]:hidden）由运行时拼接，
// Tailwind 扫描不到该候选而从不生成 CSS，折叠在真实页面从未生效
const visibleVnodes = computed(() =>
  props.max != null && !expanded.value ? childVnodes.value.slice(0, props.max) : childVnodes.value,
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
        props.bordered && '[&>*]:ring-2 [&>*]:ring-background',
        props.class,
      )
    "
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <template v-for="(vnode, i) in visibleVnodes" :key="vnode.key ?? i">
      <component :is="vnode" />
    </template>
    <Avatar v-if="showRest" class="!inline-flex font-medium">
      <slot name="rest" :rest="restCount">+{{ restCount }}</slot>
    </Avatar>
  </div>
</template>
