<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import {
  timelineDotVariants,
  timelineItemVariants,
  timelineVariants,
  type TimelineItemData,
  type TimelineItemVariants,
  type TimelineVariants,
} from "./index";

interface Props {
  /** 数据源：按数组顺序自上而下渲染 */
  items: TimelineItemData[];
  /** 布局模式：right 单列（节点靠左）/ alternate 沿中轴左右交替 */
  mode?: TimelineVariants["mode"];
  /** 尺寸：联动节点大小、连线位置与字号间距 */
  size?: TimelineItemVariants["size"];
  /** 追加/覆盖样式（经 cn 合并） */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "right",
  size: "default",
});

const rootClass = computed(() => cn(timelineVariants({ mode: props.mode }), props.class));

const itemClass = computed(() => timelineItemVariants({ mode: props.mode, size: props.size }));

const titleClass = computed(() =>
  props.size === "sm"
    ? "text-xs leading-4 font-medium text-foreground"
    : "text-sm font-medium leading-5 text-foreground",
);

const descriptionClass = computed(() =>
  props.size === "sm"
    ? "mt-1 text-xs leading-relaxed text-muted-foreground"
    : "mt-1 text-sm leading-relaxed text-muted-foreground",
);

/**
 * 连线类：首末项按 index 裁切（不用 first:/last: 伪类——line 恒为 li 首个子元素，伪类会全量误命中）
 * @param index - 项在 items 中的下标
 * @returns 连线元素的 class
 */
function lineClass(index: number): string {
  const isFirst = index === 0;
  const isLast = index === props.items.length - 1;
  return cn(
    "absolute w-0.5 -translate-x-1/2 bg-border",
    props.mode === "alternate" ? "left-1/2" : props.size === "sm" ? "left-[5px]" : "left-[6px]",
    isFirst ? "top-[10px]" : "top-0",
    isLast ? "bottom-[calc(100%-10px)]" : "bottom-0",
  );
}

/**
 * 节点类：颜色/空心取自单项数据，位置与尺寸取自组件变体
 * @param item - 时间轴单项数据
 * @returns 节点元素的 class
 */
function dotClass(item: TimelineItemData): string {
  return cn(
    timelineDotVariants({
      mode: props.mode,
      size: props.size,
      color: item.dotColor,
      hollow: item.hollow,
    }),
  );
}

/**
 * 内容区类：right 占第 2 列；alternate 按奇偶交替占第 1/3 列并切换对齐
 * @param index - 项在 items 中的下标（alternate 模式据此决定占列与对齐）
 * @returns 内容区元素的 class
 */
function contentClass(index: number): string {
  const base = "min-w-0 flex flex-col";
  if (props.mode === "alternate") {
    return cn(
      base,
      index % 2 === 0
        ? "col-start-1 row-start-1 pr-4 text-right"
        : "col-start-3 row-start-1 pl-4 text-left",
    );
  }
  return cn(base, props.size === "sm" ? "pl-2.5" : "pl-3");
}

/**
 * 时间戳类：bottom 时 DOM 仍在前部，仅切 order-last 移到内容下方（不分支 DOM）
 * @param item - 时间轴单项数据（读 timestampPlacement）
 * @returns 时间戳元素的 class
 */
function timestampClass(item: TimelineItemData): string {
  return item.timestampPlacement === "bottom"
    ? "mb-1 mt-1.5 order-last text-xs leading-4 text-muted-foreground tabular-nums"
    : "mb-1 text-xs leading-4 text-muted-foreground tabular-nums";
}
</script>

<template>
  <ol data-slot="timeline" :class="rootClass">
    <li v-for="(item, index) in items" :key="index" data-slot="timeline-item" :class="itemClass">
      <span data-slot="timeline-line" aria-hidden="true" :class="lineClass(index)" />
      <span data-slot="timeline-dot" :class="dotClass(item)" />
      <div data-slot="timeline-content" :class="contentClass(index)">
        <!-- #item 整项内容覆盖（dot 与 line 不受影响），默认渲染 timestamp/title/content -->
        <slot name="item" :item="item" :index="index">
          <span
            v-if="item.timestamp"
            data-slot="timeline-timestamp"
            :class="timestampClass(item)"
            >{{ item.timestamp }}</span
          >
          <p v-if="item.title" data-slot="timeline-title" :class="titleClass">{{ item.title }}</p>
          <p v-if="item.content" data-slot="timeline-description" :class="descriptionClass">
            {{ item.content }}
          </p>
        </slot>
      </div>
    </li>
  </ol>
</template>
