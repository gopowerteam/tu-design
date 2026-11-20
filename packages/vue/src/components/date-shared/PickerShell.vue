<script setup lang="ts">
import type { DateValue } from "@ark-ui/vue/date-picker";
import type { DatePickerRootProps } from "@ark-ui/vue/date-picker";
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import type { PropType } from "vue";
import { computed, provide, useAttrs } from "vue";
import { cn } from "@/lib/utils";
import CalendarIcon from "../icon-shared/CalendarIcon.vue";
import CloseIcon from "../icon-shared/CloseIcon.vue";
import { CALENDAR_IN_PICKER, controlCls, iconBtnCls } from "./shared";
import { useOverlayIds } from "../overlay-shared/useOverlayIds";
import { useSandboxTeleportTarget, withSandboxStrategy } from "../overlay-shared/useSandboxOverlay";
import { useTuProvider } from "../overlay-shared/config";

/** 单值日期族（Date/Month/Year/Week）共用外壳：触发器 + 清空/日历按钮 + 弹层容器。 */
defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Array as PropType<DateValue[]>, required: true },
  open: { type: Boolean, required: true },
  locale: { type: String, default: "zh-CN" },
  min: { type: Object as PropType<DateValue | undefined>, default: undefined },
  max: { type: Object as PropType<DateValue | undefined>, default: undefined },
  /** 不可选日期谓词（参数为 ark 的 DateValue） */
  isDateUnavailable: {
    type: Function as PropType<(date: DateValue) => boolean>,
    default: undefined,
  },
  closeOnSelect: { type: Boolean, default: true },
  readOnly: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  placeholder: { type: String, default: "请选择" },
  /** 锁定视图粒度（Month/Year 选择器）；undefined 走 Ark 默认 day 视图 */
  minView: { type: String as PropType<"day" | "month" | "year" | undefined>, default: undefined },
  maxView: { type: String as PropType<"day" | "month" | "year" | undefined>, default: undefined },
  format: { type: Function as PropType<(date: DateValue) => string>, required: true },
  parse: { type: Function as PropType<(raw: string) => DateValue | undefined>, required: true },
  /** Ark DatePicker Root 的 positioning 配置（placement/gutter 等）；
      iframe realm（wujie graft / iframe 嵌入）下 strategy 未显式指定时默认 fixed */
  positioning: {
    type: Object as PropType<DatePickerRootProps["positioning"]>,
    default: undefined,
  },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: DateValue[]];
  "update:open": [open: boolean];
}>();

// 弹层内的 TCalendar 探测到宿主标记 → embedded 内嵌形态（纯卡片内核，不自建 Root）
provide(CALENDAR_IN_PICKER, true);

function openFromInput() {
  if (props.disabled || props.readOnly || props.open) return;
  emit("update:open", true);
}

// —— 沙箱适配（机制详注见 useSandboxOverlay / sandbox.ts）：Teleport 目标降级
// （shadow DOM / wujie graft → 应用挂载容器，避免面板落入 iframe body）+
// iframe realm 下 strategy 默认 fixed（absolute 包含块错位，fixed 唯一正确解）；
// 覆盖 Date/Month/Year/Week 四个单值日期组件，无 to prop，面板恒传送 ——
const teleportTarget = useSandboxTeleportTarget(() => undefined);
// Provider 显式配置快照：withSandboxStrategy 在 computed 内调用，inject 须于 setup 顶层捕获后传入
const tuProvider = useTuProvider();

const rootPositioning = computed(() =>
  withSandboxStrategy(props.positioning, { ...props.positioning }, tuProvider),
);

// ids 全量覆盖（无冒号）：规避 wujie patch getElementById 对 zag 缺省冒号 id 的
// SyntaxError 刷屏（详注见 useOverlayIds）。覆盖 machine 全部直接 getById 查询点
// （trigger/content/clearTrigger/control/positioner 与 monthSelect/yearSelect）及
// 间接路径（getInputEls 经 getControlEl）；其中 monthSelect/yearSelect 本库不渲染，
// 日历翻月（startValue track 每次触发 syncMonthSelectElement/syncYearSelectElement）
// 必 miss 刷警告（wujie 2.1.0 实测复现），覆盖后落到合法选择器静默 null。函数型口
// （label/table/tableHeader/tableBody/tableRow/cellTrigger/prev/next/viewTrigger/
// input）无 getById 查询点，不进 parts，user 经 attrs.ids 直传保留。
const attrs = useAttrs();
const { ids: rootIds } = useOverlayIds(attrs, {
  primary: "root",
  parts: [
    "root",
    "content",
    "clearTrigger",
    "control",
    "trigger",
    "positioner",
    "monthSelect",
    "yearSelect",
  ],
});
// Input 转发前剔除 ids：ids 已由 Root :ids 消费，直传会在真实 input 上产生
// `ids="[object Object]"` 垃圾属性。
const inputAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.ids;
  return rest;
});
</script>

<template>
  <ArkDatePicker.Root
    :ids="rootIds"
    :model-value="modelValue"
    :open="open"
    :locale="locale"
    :min-view="minView"
    :max-view="maxView"
    :min="min"
    :max="max"
    :is-date-unavailable="isDateUnavailable"
    :close-on-select="closeOnSelect"
    :read-only="readOnly"
    :disabled="disabled"
    :format="format"
    :parse="parse"
    :positioning="rootPositioning"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
  >
    <ArkDatePicker.Control
      :class="cn(controlCls, props.class)"
      :data-invalid="invalid ? '' : undefined"
    >
      <ArkDatePicker.Input
        v-bind="inputAttrs"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
        class="bg-transparent h-full w-full min-w-0 flex-1 px-3 text-sm tabular-nums outline-none"
        @click="openFromInput"
        @keydown.down.prevent="openFromInput"
      />
      <ArkDatePicker.ClearTrigger :class="iconBtnCls">
        <CloseIcon class="size-4" />
      </ArkDatePicker.ClearTrigger>
      <ArkDatePicker.Trigger :class="iconBtnCls">
        <CalendarIcon class="size-4" />
      </ArkDatePicker.Trigger>
    </ArkDatePicker.Control>

    <!-- 弹层 Teleport：脱离表单 DOM——隔离外层 FormControl 的 group class
       （group-hover 会污染面板内全部格子），并消除 overflow 容器裁剪弹层的隐患；
       目标经沙箱适配降级（shadow DOM / wujie graft → 应用挂载容器） -->
    <Teleport :to="teleportTarget">
      <ArkDatePicker.Positioner class="z-[var(--z-modal,60)]">
        <ArkDatePicker.Content
          :class="
            cn(
              'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-[var(--z-modal,60)] rounded-md border shadow-md',
            )
          "
        >
          <slot />
        </ArkDatePicker.Content>
      </ArkDatePicker.Positioner>
    </Teleport>
  </ArkDatePicker.Root>
</template>
