<script setup lang="ts">
import type { DateValue } from "@ark-ui/vue/date-picker";
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import type { PropType } from "vue";
import { computed, provide, ref } from "vue";
import { cn } from "@/lib/utils";
import { Calendar as TCalendar } from "../calendar";
// SFC 仅 default export，必须默认导入
import CalendarIcon from "../date-shared/CalendarIcon.vue";
import ClearIcon from "../date-shared/ClearIcon.vue";
import {
  CALENDAR_IN_PICKER,
  controlCls,
  formatIsoYear,
  iconBtnCls,
  parseIsoYear,
} from "../date-shared/shared";

const props = defineProps({
  /** 受控年份（"yyyy"）；undefined 走内部非受控，null 表示空 */
  modelValue: { type: String as PropType<string | null | undefined>, default: undefined },
  /** 非受控初值（"yyyy"） */
  defaultValue: { type: String, default: undefined },
  /** 弹层开合受控；undefined 走内部非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  placeholder: { type: String, default: "请选择年份" },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  readOnly: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 可选下界（"yyyy"，含当年） */
  min: { type: String, default: undefined },
  /** 可选上界（"yyyy"，含当年） */
  max: { type: String, default: undefined },
  /** 选中后是否自动关弹层 */
  closeOnSelect: { type: Boolean, default: true },
  /** 文案与周起点跟随 locale */
  locale: { type: String, default: "zh-CN" },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  "update:open": [open: boolean];
}>();

// attrs（id/aria-*）转发给真实 input，保证 TLabel/TFormControl 关联
defineOptions({ inheritAttrs: false });

// 弹层内的 TCalendar 探测到宿主标记 → embedded 内嵌形态（纯卡片内核，不自建 Root，值归本 Picker）
provide(CALENDAR_IN_PICKER, true);

// —— 受控桥接（与 DatePicker 同款简化版：单值无 mirror 需求）——
const internalValue = ref<string | null>(props.defaultValue ?? null);
const selected = computed(() => {
  const raw = props.modelValue !== undefined ? props.modelValue : internalValue.value;
  return parseIsoYear(raw ?? "");
});
// zag value 为 DateValue[] 数组形态，单选语义收敛为 [date] | []
const rootValue = computed<DateValue[]>(() => (selected.value ? [selected.value] : []));

const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

// 年格 disabled 只比 min?.year/max?.year（zag connect isValueWithinRange），
// 锚 1 月 1 日即安全，无需 MonthPicker 的末日换算
const minDate = computed(() => parseIsoYear(props.min ?? ""));
const maxDate = computed(() => parseIsoYear(props.max ?? ""));

function handleValueUpdate(next: DateValue[]) {
  const value = next[0] ? formatIsoYear(next[0]) : null;
  internalValue.value = value;
  emit("update:modelValue", value);
}

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
  <ArkDatePicker.Root
    :model-value="rootValue"
    :open="isOpen"
    :locale="props.locale"
    :min-view="'year'"
    :max-view="'year'"
    :min="minDate"
    :max="maxDate"
    :close-on-select="props.closeOnSelect"
    :read-only="props.readOnly"
    :disabled="props.disabled"
    :format="formatIsoYear"
    :parse="parseIsoYear"
    @update:model-value="handleValueUpdate"
    @update:open="handleOpenUpdate"
  >
    <ArkDatePicker.Control
      :class="cn(controlCls, props.class)"
      :data-invalid="props.invalid ? '' : undefined"
    >
      <ArkDatePicker.Input
        v-bind="$attrs"
        :placeholder="props.placeholder"
        :aria-invalid="props.invalid || undefined"
        class="bg-transparent h-full w-full min-w-0 flex-1 px-3 text-sm outline-none"
        @click="openFromInput"
        @keydown.down.prevent="openFromInput"
      />
      <ArkDatePicker.ClearTrigger :class="iconBtnCls">
        <ClearIcon />
      </ArkDatePicker.ClearTrigger>
      <ArkDatePicker.Trigger :class="iconBtnCls">
        <CalendarIcon />
      </ArkDatePicker.Trigger>
    </ArkDatePicker.Control>

    <!-- 弹层 Teleport 到 body：脱离表单 DOM——隔离外层 FormControl 的 group class
       （group-hover 会污染面板内全部格子），并消除 overflow 容器裁剪弹层的隐患。 -->
    <Teleport to="body">
      <ArkDatePicker.Positioner class="z-50">
        <ArkDatePicker.Content
          :class="
            cn(
              'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 rounded-md border shadow-md',
            )
          "
        >
          <TCalendar mode="year" />
        </ArkDatePicker.Content>
      </ArkDatePicker.Positioner>
    </Teleport>
  </ArkDatePicker.Root>
</template>
