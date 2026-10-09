<script setup lang="ts">
import type { DateValue } from "@ark-ui/vue/date-picker";
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import { formatIsoDate, parseIsoDate } from "./utils";

const props = defineProps({
  /** 受控值（"yyyy-MM-dd"）；undefined 走内部非受控，null 表示空 */
  modelValue: { type: String as PropType<string | null | undefined>, default: undefined },
  defaultValue: { type: String, default: undefined },
  /** 弹层开合受控；undefined 走内部非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  placeholder: { type: String, default: "请选择日期" },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  readOnly: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 可选下界（"yyyy-MM-dd"，含当日） */
  min: { type: String, default: undefined },
  /** 可选上界（"yyyy-MM-dd"，含当日） */
  max: { type: String, default: undefined },
  /** 不可选日期谓词（参数为 ark 的 DateValue，见 date-picker.md 类型说明） */
  isDateUnavailable: {
    type: Function as PropType<(date: DateValue) => boolean>,
    default: undefined,
  },
  /** 选中后是否自动关弹层 */
  closeOnSelect: { type: Boolean, default: true },
  /** 文案与周起点跟随 locale（zh-CN 默认周一起始） */
  locale: { type: String, default: "zh-CN" },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  "update:open": [open: boolean];
}>();

// attrs（id/aria-*）转发给真实 input，保证 TLabel/TFormControl 关联
defineOptions({ inheritAttrs: false });

// —— 受控桥接（Select 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
const internalValue = ref<string | null>(props.defaultValue ?? null);
const selected = computed(() => {
  const raw = props.modelValue !== undefined ? props.modelValue : internalValue.value;
  return parseIsoDate(raw ?? "");
});
// zag value 为 DateValue[] 数组形态，单选语义收敛为 [date] | []
const rootValue = computed<DateValue[]>(() => (selected.value ? [selected.value] : []));

const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

const minDate = computed(() => parseIsoDate(props.min ?? ""));
const maxDate = computed(() => parseIsoDate(props.max ?? ""));

function handleValueUpdate(next: DateValue[]) {
  const value = next[0] ? formatIsoDate(next[0]) : null;
  internalValue.value = value;
  emit("update:modelValue", value);
}

function handleOpenUpdate(next: boolean) {
  internalOpen.value = next;
  emit("update:open", next);
}

// 点击输入框即开弹层（zag 默认仅 Trigger 开；显式驱动保证各环境行为一致）
function openFromInput() {
  if (props.disabled || props.readOnly || isOpen.value) return;
  handleOpenUpdate(true);
}

const controlCls =
  "border-input flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px]";
const iconBtnCls =
  "text-muted-foreground/70 hover:text-foreground flex h-full w-8 shrink-0 items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-30";
const navBtnCls =
  "text-muted-foreground inline-flex size-7 items-center justify-center rounded-md outline-none hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";
const cellCls =
  "flex h-8 items-center justify-center text-sm outline-none hover:bg-accent data-[selected]:bg-primary data-[selected]:font-medium data-[selected]:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
// table-fixed：7 列日视图 / 4 列月年视图均分列宽，表头与内容同走原生 table 布局
const tableCls = "w-full table-fixed border-collapse";
</script>

<template>
  <ArkDatePicker.Root
    :model-value="rootValue"
    :open="isOpen"
    :default-open="props.defaultOpen"
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
        :placeholder="props.placeholder"
        :aria-invalid="props.invalid || undefined"
        class="bg-transparent h-full w-full min-w-0 flex-1 px-3 text-sm outline-none"
        @click="openFromInput"
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
            'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 w-72 rounded-md border p-3 shadow-md',
          )
        "
      >
        <ArkDatePicker.ViewControl :class="'flex items-center justify-between pb-2'">
          <ArkDatePicker.PrevTrigger :class="navBtnCls">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </ArkDatePicker.PrevTrigger>
          <ArkDatePicker.ViewTrigger
            :class="'hover:bg-accent inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium outline-none'"
          >
            <ArkDatePicker.RangeText />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-3.5 opacity-50"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </ArkDatePicker.ViewTrigger>
          <ArkDatePicker.NextTrigger :class="navBtnCls">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </ArkDatePicker.NextTrigger>
        </ArkDatePicker.ViewControl>

        <ArkDatePicker.View :view="'day'">
          <ArkDatePicker.Context v-slot="context">
            <ArkDatePicker.Table :class="tableCls">
              <ArkDatePicker.TableHead>
                <ArkDatePicker.TableRow>
                  <ArkDatePicker.TableHeader
                    v-for="(weekDay, id) in context.weekDays"
                    :key="id"
                    :class="'text-muted-foreground h-8 p-0! text-center align-middle text-xs! font-normal whitespace-nowrap'"
                  >
                    {{ weekDay.short }}
                  </ArkDatePicker.TableHeader>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableHead>
              <ArkDatePicker.TableBody>
                <ArkDatePicker.TableRow v-for="(week, id) in context.weeks" :key="id">
                  <ArkDatePicker.TableCell
                    v-for="day in week"
                    :key="day.toString()"
                    :value="day"
                    class="p-0! text-center"
                  >
                    <ArkDatePicker.TableCellTrigger :class="cn(cellCls, 'w-full')">
                      {{ day.day }}
                    </ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
          </ArkDatePicker.Context>
        </ArkDatePicker.View>

        <ArkDatePicker.View :view="'month'">
          <ArkDatePicker.Context v-slot="context">
            <ArkDatePicker.Table :class="tableCls">
              <ArkDatePicker.TableBody>
                <ArkDatePicker.TableRow
                  v-for="(monthsRow, id) in context.getMonthsGrid({ columns: 4, format: 'short' })"
                  :key="id"
                >
                  <ArkDatePicker.TableCell
                    v-for="month in monthsRow"
                    :key="month.value.toString()"
                    :value="month.value"
                    class="p-0! text-center"
                  >
                    <ArkDatePicker.TableCellTrigger :class="cn(cellCls, 'w-full')">
                      {{ month.label }}
                    </ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
          </ArkDatePicker.Context>
        </ArkDatePicker.View>

        <ArkDatePicker.View :view="'year'">
          <ArkDatePicker.Context v-slot="context">
            <ArkDatePicker.Table :class="tableCls">
              <ArkDatePicker.TableBody>
                <ArkDatePicker.TableRow
                  v-for="(yearsRow, id) in context.getYearsGrid({ columns: 4 })"
                  :key="id"
                >
                  <ArkDatePicker.TableCell
                    v-for="year in yearsRow"
                    :key="year.value.toString()"
                    :value="year.value"
                    class="p-0! text-center"
                  >
                    <ArkDatePicker.TableCellTrigger :class="cn(cellCls, 'w-full')">
                      {{ year.label }}
                    </ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
          </ArkDatePicker.Context>
        </ArkDatePicker.View>
      </ArkDatePicker.Content>
    </ArkDatePicker.Positioner>
  </ArkDatePicker.Root>
</template>
