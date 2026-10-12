<script setup lang="ts">
import type { DateValue } from "@ark-ui/vue/date-picker";
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import type { PropType } from "vue";
import { computed, provide, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Calendar as TCalendar } from "../calendar";
import {
  CALENDAR_IN_PICKER,
  controlCls,
  formatIsoDate,
  iconBtnCls,
  parseIsoDate,
  parseIsoRange,
} from "../date-shared/shared";

const props = defineProps({
  /** 受控值 [start, end]（"yyyy-MM-dd"，start ≤ end）；undefined 走内部非受控，null 表示空 */
  modelValue: {
    type: Array as unknown as PropType<[string, string] | null | undefined>,
    default: undefined,
  },
  defaultValue: {
    type: Array as unknown as PropType<[string, string] | undefined>,
    default: undefined,
  },
  /** 弹层开合受控；undefined 走内部非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  placeholder: { type: String, default: "请选择日期范围" },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  readOnly: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 可选下界（"yyyy-MM-dd"，含当日） */
  min: { type: String, default: undefined },
  /** 可选上界（"yyyy-MM-dd"，含当日） */
  max: { type: String, default: undefined },
  /** 不可选日期谓词（参数为 ark 的 DateValue） */
  isDateUnavailable: {
    type: Function as PropType<(date: DateValue) => boolean>,
    default: undefined,
  },
  /** 选完终点后是否自动关弹层 */
  closeOnSelect: { type: Boolean, default: true },
  /** 日视图并排月数 */
  numOfMonths: { type: Number, default: 2 },
  /** 文案与周起点跟随 locale（zh-CN 默认周一起始） */
  locale: { type: String, default: "zh-CN" },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: [string, string] | null];
  "update:open": [open: boolean];
}>();

// attrs（id/aria-*）转发给真实 input，保证 TLabel/TFormControl 关联
defineOptions({ inheritAttrs: false });

// 弹层内的 TCalendar 探测到宿主标记 → embedded 内嵌形态（纯卡片内核，不自建 Root，值归本 Picker）
provide(CALENDAR_IN_PICKER, true);

// —— 受控桥接（mirror 模式）——
// range 是两步交互：zag 受控模式下内部值读 prop，父组件回显滞后会吃掉 pending start，
// 导致第二次点击永远变成新起点。因此恒以内部镜像（zag 原生 0–2 元素 DateValue[]）为准，
// 外部 modelValue 赋值经 watch 覆盖 mirror；对外 emit 归一为 [ISO, ISO] | null。
const internalValue = ref<DateValue[]>([]);
const rootValue = computed(() => internalValue.value);

function normalize(next: DateValue[]): [string, string] | null {
  return next.length === 2 ? [formatIsoDate(next[0]), formatIsoDate(next[1])] : null;
}

function handleValueUpdate(next: DateValue[]) {
  internalValue.value = next;
  emit("update:modelValue", normalize(next));
}

function sameTuple(a: [string, string] | null, b: [string, string] | null | undefined): boolean {
  if (a === null || b === undefined) return a === null && (b === null || b === undefined);
  return Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

watch(
  () => props.modelValue,
  (v) => {
    // 回环守卫：emit 值原样回流（含 pending 期父组件回传 null）则跳过，避免打断选择
    if (sameTuple(normalize(internalValue.value), v)) return;
    internalValue.value = parseIsoRange(v) ?? [];
  },
  { immediate: true },
);

// 非受控初值（modelValue 未传时以 defaultValue 种子）
if (props.modelValue === undefined && props.defaultValue) {
  internalValue.value = parseIsoRange(props.defaultValue) ?? [];
}

const minDate = computed(() => parseIsoDate(props.min ?? ""));
const maxDate = computed(() => parseIsoDate(props.max ?? ""));

const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleOpenUpdate(next: boolean) {
  internalOpen.value = next;
  emit("update:open", next);
}

// 点击/键盘 ↓ 输入框即开弹层（zag 默认仅 Trigger 开，openOnClick prop 默认关闭；
// 显式驱动保证各环境行为一致并显式走受控 emit）
function openFromInput() {
  if (props.disabled || props.readOnly || isOpen.value) return;
  handleOpenUpdate(true);
}
</script>

<template>
  <!-- outside-day-selectable：zag getDayTableCellState 的 getUnitDuration 把 months 强制置 1，
       多月视图下第二月起所有当月格被误判 outside-range 而禁用；此开关对冲（见 calendar/CalendarBody 注释） -->
  <ArkDatePicker.Root
    :model-value="rootValue"
    selection-mode="range"
    :num-of-months="props.numOfMonths"
    outside-day-selectable
    :open="isOpen"
    :locale="props.locale"
    :min="minDate"
    :max="maxDate"
    :is-date-unavailable="props.isDateUnavailable"
    :close-on-select="props.closeOnSelect"
    :read-only="props.readOnly"
    :disabled="props.disabled"
    :format="formatIsoDate"
    :parse="parseIsoDate"
    @update:model-value="handleValueUpdate"
    @update:open="handleOpenUpdate"
  >
    <ArkDatePicker.Control
      :class="cn(controlCls, props.class)"
      :data-invalid="props.invalid ? '' : undefined"
    >
      <ArkDatePicker.Input
        v-bind="$attrs"
        :index="0"
        :placeholder="props.placeholder"
        :aria-invalid="props.invalid || undefined"
        class="bg-transparent h-full w-full min-w-0 flex-1 px-3 text-sm outline-none"
        @click="openFromInput"
        @keydown.down.prevent="openFromInput"
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-muted-foreground size-3.5 shrink-0"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
      <ArkDatePicker.Input
        :index="1"
        :placeholder="props.placeholder"
        :aria-invalid="props.invalid || undefined"
        class="bg-transparent h-full w-full min-w-0 flex-1 px-3 text-sm outline-none"
        @click="openFromInput"
        @keydown.down.prevent="openFromInput"
      />
      <ArkDatePicker.ClearTrigger :class="iconBtnCls">
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
      </ArkDatePicker.ClearTrigger>
      <ArkDatePicker.Trigger :class="iconBtnCls">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      </ArkDatePicker.Trigger>
    </ArkDatePicker.Control>

    <ArkDatePicker.Positioner class="z-50">
      <ArkDatePicker.Content
        :class="
          cn(
            'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 rounded-md border shadow-md',
          )
        "
      >
        <TCalendar :num-of-months="props.numOfMonths" />
      </ArkDatePicker.Content>
    </ArkDatePicker.Positioner>
  </ArkDatePicker.Root>
</template>
