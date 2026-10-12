<script setup lang="ts">
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import type { DateValue } from "@ark-ui/vue/date-picker";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 渲染裁剪：渲染哪个视图块；「锁定视图」由 picker Root 的 minView/maxView 承担（卡片不持 Root） */
    mode?: "day" | "month" | "year";
    /** 日视图并排月数 */
    numOfMonths?: number;
  }>(),
  { mode: "day", numOfMonths: 1 },
);

// —— 卡片视觉常量（打磨单点：视觉调整只改本文件）——
const cardCls = computed(() => [props.numOfMonths > 1 ? "w-[40rem]" : "w-80", "p-4"]);
const viewControlCls = "flex items-center justify-between px-1 pb-3";
const navBtnCls =
  "text-muted-foreground inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";
const viewTriggerCls =
  "hover:bg-accent inline-flex items-center gap-1 rounded-[3px] px-3 py-1.5 text-sm font-semibold text-foreground outline-none transition-colors";
// 日视图双层格子（naive 式「命中大、视觉小」）：
// trigger = 全格命中区 + range 无缝条带层（primary/10；行首行尾圆角由模板按列位补）
// dot     = 24px 视觉圆点层，hover/选中/今天/禁用色全落此层（经 group-* 读取 trigger 状态）
// outside-view = Card 自标「格不属于本表锚点月」，range/选中视觉在补位格上失效，
//                且补位格不可点击（naive excluded 语义：仅作日期连续性视觉提示）
const dayTriggerCls =
  "group relative flex h-8 w-full cursor-pointer items-center justify-center outline-none data-[outside-view]:pointer-events-none data-[disabled]:pointer-events-none data-[in-range]:not-data-[outside-view]:not-data-[range-start]:not-data-[range-end]:bg-primary/10 data-[range-start]:rounded-l-[3px] data-[range-end]:rounded-r-[3px]";
const dayDotCls =
  "flex size-6 items-center justify-center rounded-[3px] text-sm transition-colors group-hover:bg-accent group-data-[focus]:not-group-data-[outside-view]:bg-accent group-data-[selected]:not-group-data-[outside-view]:bg-primary group-data-[selected]:not-group-data-[outside-view]:font-medium group-data-[selected]:not-group-data-[outside-view]:text-primary-foreground group-data-[today]:not-group-data-[selected]:text-primary group-data-[today]:not-group-data-[selected]:font-semibold group-data-[unavailable]:line-through group-data-[unavailable]:opacity-30 group-data-[disabled]:opacity-40 group-data-[outside-view]:opacity-30";
// 月/年视图单层格子（沿用小圆角语言；range 变体单选无副作用，此处不涉及）
const cellCls =
  "flex h-9 w-full items-center justify-center rounded-[3px] text-sm outline-none hover:bg-accent data-[selected]:bg-primary data-[selected]:font-medium data-[selected]:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
// table-fixed：7 列日视图 / 4 列月年视图均分列宽，表头与内容同走原生 table 布局
const tableCls = "w-full min-w-0 flex-1 table-fixed border-collapse";
const headCellCls =
  "text-muted-foreground h-8 border-x-0! border-t-0! border-b border-border p-0! text-center! text-xs! align-middle font-normal whitespace-nowrap";
const bodyCellCls = "border-0! p-0! text-center";
// 宿主斑马线防御：VitePress .vp-doc tr:nth-child(2n) 背景污染（与 range 条带浅色撞车）
const rowCls = "bg-transparent!";

// —— 补位格自标记（ zag data-outside-range 是「整机可见范围」语义，双月时相邻月表内
// 的上月尾/下月头格不带它，range/选中视觉会跨表重复高亮；Card 按锚点月自行判定）——
type TableCtx = {
  getOffset(duration: { months: number }): { visibleRange: { start: DateValue } };
};

/** 表 i 的锚点月起点（zag getOffset({months: i-1}).visibleRange.start） */
function tableAnchor(context: TableCtx, i: number): DateValue | undefined {
  return context.getOffset({ months: i - 1 })?.visibleRange?.start;
}

/** 格子日期不属于锚点月（年或月不一致）即为补位格 */
function isOutsideView(day: DateValue, anchor: DateValue | undefined): boolean {
  return !!anchor && (day.year !== anchor.year || day.month !== anchor.month);
}
</script>

<template>
  <div :class="cn(cardCls)">
    <ArkDatePicker.ViewControl :class="viewControlCls">
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
      <ArkDatePicker.ViewTrigger v-if="mode === 'day'" :class="viewTriggerCls">
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

    <template v-if="mode === 'day'">
      <ArkDatePicker.View :view="'day'">
        <ArkDatePicker.Context v-slot="context">
          <div class="flex gap-6">
            <ArkDatePicker.Table v-for="i in numOfMonths" :key="i" :class="tableCls">
              <ArkDatePicker.TableHead>
                <ArkDatePicker.TableRow :class="rowCls">
                  <ArkDatePicker.TableHeader
                    v-for="(weekDay, id) in context.weekDays"
                    :key="id"
                    :class="headCellCls"
                  >
                    {{ weekDay.narrow }}
                  </ArkDatePicker.TableHeader>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableHead>
              <ArkDatePicker.TableBody>
                <ArkDatePicker.TableRow
                  :class="rowCls"
                  v-for="(week, id) in context.getOffset({ months: i - 1 }).weeks"
                  :key="id"
                >
                  <ArkDatePicker.TableCell
                    v-for="(day, colIdx) in week"
                    :key="day.toString()"
                    :value="day"
                    :class="bodyCellCls"
                  >
                    <ArkDatePicker.TableCellTrigger
                      :class="
                        cn(
                          dayTriggerCls,
                          colIdx === 0 && 'rounded-l-[3px]',
                          colIdx === week.length - 1 && 'rounded-r-[3px]',
                        )
                      "
                      :data-outside-view="
                        isOutsideView(day, tableAnchor(context, i)) ? '' : undefined
                      "
                    >
                      <span :class="dayDotCls">{{ day.day }}</span>
                    </ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                </ArkDatePicker.TableRow>
              </ArkDatePicker.TableBody>
            </ArkDatePicker.Table>
          </div>
        </ArkDatePicker.Context>
      </ArkDatePicker.View>

      <ArkDatePicker.View :view="'month'">
        <ArkDatePicker.Context v-slot="context">
          <ArkDatePicker.Table :class="tableCls">
            <ArkDatePicker.TableBody>
              <ArkDatePicker.TableRow
                :class="rowCls"
                v-for="(monthsRow, id) in context.getMonthsGrid({ columns: 4, format: 'short' })"
                :key="id"
              >
                <ArkDatePicker.TableCell
                  v-for="month in monthsRow"
                  :key="month.value.toString()"
                  :value="month.value"
                  :class="bodyCellCls"
                >
                  <ArkDatePicker.TableCellTrigger :class="cn(cellCls)">
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
                :class="rowCls"
                v-for="(yearsRow, id) in context.getYearsGrid({ columns: 4 })"
                :key="id"
              >
                <ArkDatePicker.TableCell
                  v-for="year in yearsRow"
                  :key="year.value.toString()"
                  :value="year.value"
                  :class="bodyCellCls"
                >
                  <ArkDatePicker.TableCellTrigger :class="cn(cellCls)">
                    {{ year.label }}
                  </ArkDatePicker.TableCellTrigger>
                </ArkDatePicker.TableCell>
              </ArkDatePicker.TableRow>
            </ArkDatePicker.TableBody>
          </ArkDatePicker.Table>
        </ArkDatePicker.Context>
      </ArkDatePicker.View>
    </template>

    <ArkDatePicker.View v-else-if="mode === 'month'" :view="'month'">
      <ArkDatePicker.Context v-slot="context">
        <ArkDatePicker.Table :class="tableCls">
          <ArkDatePicker.TableBody>
            <ArkDatePicker.TableRow
              :class="rowCls"
              v-for="(monthsRow, id) in context.getMonthsGrid({ columns: 4, format: 'short' })"
              :key="id"
            >
              <ArkDatePicker.TableCell
                v-for="month in monthsRow"
                :key="month.value.toString()"
                :value="month.value"
                :class="bodyCellCls"
              >
                <ArkDatePicker.TableCellTrigger :class="cn(cellCls)">
                  {{ month.label }}
                </ArkDatePicker.TableCellTrigger>
              </ArkDatePicker.TableCell>
            </ArkDatePicker.TableRow>
          </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
      </ArkDatePicker.Context>
    </ArkDatePicker.View>

    <ArkDatePicker.View v-else :view="'year'">
      <ArkDatePicker.Context v-slot="context">
        <ArkDatePicker.Table :class="tableCls">
          <ArkDatePicker.TableBody>
            <ArkDatePicker.TableRow
              :class="rowCls"
              v-for="(yearsRow, id) in context.getYearsGrid({ columns: 4 })"
              :key="id"
            >
              <ArkDatePicker.TableCell
                v-for="year in yearsRow"
                :key="year.value.toString()"
                :value="year.value"
                :class="bodyCellCls"
              >
                <ArkDatePicker.TableCellTrigger :class="cn(cellCls)">
                  {{ year.label }}
                </ArkDatePicker.TableCellTrigger>
              </ArkDatePicker.TableCell>
            </ArkDatePicker.TableRow>
          </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
      </ArkDatePicker.Context>
    </ArkDatePicker.View>
  </div>
</template>
