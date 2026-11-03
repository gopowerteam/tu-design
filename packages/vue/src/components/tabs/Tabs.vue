<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { computed, ref, useSlots, watch } from "vue";
import { cn } from "@/lib/utils";
import type { TabItem } from "./types";

interface Props {
  /** 标签页配置列表（必填） */
  items: TabItem[];
  /** 当前激活的 tab 值（配合 v-model:value）；不传时为非受控 */
  value?: string;
  defaultValue?: string;
  /** 切换模式：automatic 聚焦即切换 / manual 需点击或 Enter */
  activationMode?: "automatic" | "manual";
  /** 组件级默认：面板首次激活才挂载（item.lazyMount 优先） */
  lazyMount?: boolean;
  /** 组件级默认：面板切走即卸载（item.unmountOnExit 优先） */
  unmountOnExit?: boolean;
  /** 方向：horizontal 用 ←/→ 导航，vertical 用 ↑/↓ 导航（透传 Ark，原生默认 horizontal） */
  orientation?: "horizontal" | "vertical";
  /** 焦点是否首尾循环（透传 Ark，原生默认 true） */
  loopFocus?: boolean;
  /** 点击已选中项是否可取消选中（透传 Ark，原生默认关闭；启用后取消选中时 update:value 载荷为 null） */
  deselectable?: boolean;
  /** 切换前守卫：返回 false 或 resolve false 阻止切换；仅拦截用户交互切换（受控外部赋值与自动选邻居不经过守卫） */
  beforeLeave?: (next: string | null, prev: string | null) => boolean | Promise<boolean>;
  /** 款式：segment 分段块（默认，现有外观）/ line 下划线 */
  type?: "segment" | "line";
  /** 标签栏位置：bottom/right 通过布局反转实现；与 orientation 同传时 placement 优先（勿向根元素传布局类） */
  placement?: "top" | "left" | "right" | "bottom";
  /** 面板激活时淡入过渡；对 unmountOnExit 卸载型面板无过渡 */
  animated?: boolean;
}

const props = defineProps<Props>();

const slots = useSlots();

/** 有效方向：placement 优先（right→vertical、bottom→horizontal），未传回落 orientation */
const effOrientation = computed<"horizontal" | "vertical">(() => {
  if (props.placement === "right") return "vertical";
  if (props.placement === "bottom") return "horizontal";
  return props.orientation ?? "horizontal";
});

const isVertical = computed(() => effOrientation.value === "vertical");

const isLine = computed(() => props.type === "line");

const hasBarExtras = computed(() => !!(slots.prefix || slots.suffix));

// —— 款式/布局 ——
// placement 布局接管：仅非默认位置时加类，默认零回归；用户布局类经 fallthrough 合并不经 twMerge，文档已声明勿传
const placementClass = computed(() => {
  if (props.placement === "bottom") return "flex flex-col-reverse";
  if (props.placement === "right") return "flex flex-row-reverse";
  return undefined;
});

const isBottom = computed(() => props.placement === "bottom");

// line 款式：List 需 relative 作为 Indicator 定位锚点；vertical 用右侧竖线（border-r）
const listClass = computed(() =>
  cn(
    "text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg",
    isLine.value ? "relative bg-transparent" : "bg-muted p-[3px]",
    isVertical.value
      ? ["h-fit flex-col items-stretch", isLine.value && "border-r border-border"]
      : ["h-9", isLine.value && "border-b border-border"],
  ),
);

const triggerClass = (item: TabItem) =>
  cn(
    "inline-flex h-[calc(100%-1px)] items-center gap-1.5 px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
    isLine.value
      ? "text-muted-foreground data-[selected]:text-foreground"
      : "border border-transparent data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
    isVertical.value ? "w-full justify-start" : "flex-1 justify-center",
    item.class,
  );

// Indicator：zag 内联 position:absolute 与起始轴（horizontal→left、vertical→top 变量）；粗细与正交轴由类补，长度用变量自适应选中项
const indicatorClass = computed(() =>
  cn(
    "bg-primary pointer-events-none absolute",
    isVertical.value ? "h-[var(--height)] w-[2px]" : "h-[2px] w-[var(--width)]",
    isVertical.value
      ? isBottom.value
        ? "left-0"
        : "right-0"
      : isBottom.value
        ? "top-0"
        : "-bottom-px",
  ),
);

const animatedClass = computed(() =>
  props.animated ? "data-[selected]:animate-[tu-tabs-fade-in_0.25s_ease]" : undefined,
);

const emit = defineEmits<{
  "update:value": [value: string];
  /** item 关闭按钮点击时触发；移除 items 由使用方处理 */
  close: [value: string];
}>();

// —— 受控桥接（DatePicker 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
// internalValue 放宽到 null：承接 deselectable 取消选中与「全部关闭」的无选中态
const internalValue = ref<string | null | undefined>(props.defaultValue);
const currentValue = computed(() => props.value ?? internalValue.value);

// —— 切换守卫（before-leave）：许可器模型 ——
// 受控桥接下绑定值是权威，zag 机器值被拉回绑定值：拒绝分支不触碰任何状态，UI 天然保持旧态
const guardPending = ref(false);

function commitValue(next: string | null) {
  internalValue.value = next;
  // 运行时 deselectable 取消选中会发 null；载荷类型保持 string 以兼容既有监听器（文档已注明）
  emit("update:value", next as string);
}

async function handleValueUpdate(next: string | null) {
  const guard = props.beforeLeave;
  if (!guard) return commitValue(next);
  if (guardPending.value) return; // 上一守卫未决期间忽略并发切换
  const prev = currentValue.value ?? null;
  let result: boolean | Promise<boolean>;
  try {
    result = guard(next, prev);
  } catch {
    return; // 守卫异常按拒绝处理
  }
  if (result instanceof Promise) {
    guardPending.value = true;
    try {
      if (await result) commitValue(next);
    } catch {
      // 守卫异常按拒绝处理
    } finally {
      guardPending.value = false;
    }
    return;
  }
  if (result) commitValue(next);
}

// —— items 变更侦测：computed Set 同时覆盖数组替换与 reactive 原地变异 ——
const valueSet = computed(() => new Set(props.items.map((i) => i.value)));

// 非受控下激活项被移除时，自动选中其前一个仍存在的项（浏览器惯例），其次后一项，全删光则无选中；
// 该补偿不经过 before-leave 守卫
let prevValues: string[] = props.items.map((i) => i.value);
watch(
  valueSet,
  (set) => {
    const values = props.items.map((i) => i.value);
    const v = currentValue.value;
    if (props.value !== undefined || v == null || set.has(v)) {
      prevValues = values;
      return;
    }
    const oldIdx = prevValues.indexOf(v);
    const before = prevValues
      .slice(0, oldIdx)
      .reverse()
      .find((x) => set.has(x));
    const fallback = before ?? values[0] ?? null;
    internalValue.value = fallback;
    prevValues = values;
  },
  { immediate: true },
);

// —— 面板级挂载策略：复刻 ark usePresence 的 unmounted 公式，逐面板生效 ——
// unmounted = (!active && !everActivated && lazyMount) || (unmountOnExit && !active && everActivated)
// 说明：本版本 @ark-ui/vue 的 lazyMount/unmountOnExit 仅支持 Root 级全局策略，
// 为实现 item 级覆盖，这里不经 Root 下发，由本组件自行计算每个面板的挂载与否。
const activatedValues = ref(new Set<string>());
watch(
  currentValue,
  (v) => {
    if (v == null || activatedValues.value.has(v)) return;
    activatedValues.value = new Set(activatedValues.value).add(v);
  },
  { immediate: true },
);

function isPanelUnmounted(item: TabItem): boolean {
  const active = currentValue.value === item.value;
  const everActivated = activatedValues.value.has(item.value);
  const lazyMount = item.lazyMount ?? props.lazyMount;
  const unmountOnExit = item.unmountOnExit ?? props.unmountOnExit;
  return (
    (!active && !everActivated && !!lazyMount) || (!!unmountOnExit && !active && everActivated)
  );
}
</script>

<template>
  <ArkTabs.Root
    :model-value="currentValue ?? undefined"
    :activation-mode="props.activationMode"
    :orientation="effOrientation"
    :loop-focus="props.loopFocus"
    :deselectable="props.deselectable"
    :class="placementClass"
    @update:model-value="handleValueUpdate"
  >
    <!-- 标签栏容器：有 prefix/suffix 时为 flex 布局；否则 display:contents 布局零回归 -->
    <div :class="hasBarExtras ? 'flex items-center' : 'contents'">
      <slot name="prefix" />
      <ArkTabs.List :class="listClass">
        <ArkTabs.Trigger
          v-for="item in props.items"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          :class="triggerClass(item)"
        >
          <slot name="trigger" :item="item">{{ item.label }}</slot>
          <!-- 关闭按钮：button 嵌套非法，用 span + role；mousedown.prevent 阻断焦点转移到 trigger（automatic 模式会经 onFocus 选中） -->
          <span
            v-if="item.closable"
            role="button"
            tabindex="-1"
            :aria-label="`关闭 ${item.label}`"
            class="text-muted-foreground -mr-0.5 flex size-3.5 items-center justify-center rounded-sm text-xs opacity-60 transition-opacity hover:opacity-100"
            @mousedown.prevent
            @click.stop="emit('close', item.value)"
            @keydown.enter.stop.prevent="emit('close', item.value)"
            @keydown.space.stop.prevent="emit('close', item.value)"
            >×</span
          >
        </ArkTabs.Trigger>
        <!-- 下划线指示条：zag 自动计算选中项位置与过渡动画；jsdom 无布局时恒 hidden -->
        <ArkTabs.Indicator v-if="isLine" :class="indicatorClass" />
      </ArkTabs.List>
      <slot name="suffix" />
    </div>

    <!-- 面板：hidden/挂载由本组件按 item 配置逐面板控制，不走 Root 的全局渲染策略 -->
    <ArkTabs.Context v-slot="api">
      <template v-for="item in props.items" :key="item.value">
        <div
          v-if="!isPanelUnmounted(item)"
          v-bind="api.getContentProps({ value: item.value })"
          :class="cn('flex-1 outline-none', animatedClass)"
        >
          <slot name="panel" :item="item" />
        </div>
      </template>
    </ArkTabs.Context>
  </ArkTabs.Root>
</template>

<style>
/* 非 scoped：scoped 块的 @keyframes 名会被 SFC 编译器改写，与 tailwind 任意值动画类脱钩 */
@keyframes tu-tabs-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
