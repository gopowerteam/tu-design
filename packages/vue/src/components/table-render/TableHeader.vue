<script setup lang="ts">
import type { CSSProperties, PropType } from "vue";
import { computed, nextTick, onMounted, watch } from "vue";
import { Checkbox } from "@/components/checkbox";
import { DRAG_CELL, SELECTION_CELL } from "./constants";
import { stickyClass, stickyStyle } from "./sticky";
import { HEADER_ROW_FALLBACK, useHeaderMeasurement } from "./useHeaderMeasurement";
import type {
  HeaderCell,
  TableHeaderViewActions,
  TableHeaderViewModel,
} from "./useTableHeaderModel";
import type { TableColumnOptions } from "./types";

/**
 * 表格表头：行矩阵渲染 + 分组 sticky + 排序 + 表头列设置入口 + 表头测量回传。
 * 父层模型必须为 computed（列显隐后子组件需重测）。
 */
const props = defineProps({
  /** 表头视图模型（父层 computed 产物） */
  model: { type: Object as PropType<TableHeaderViewModel>, required: true },
  /** 交互动作（父层提供） */
  actions: { type: Object as PropType<TableHeaderViewActions>, required: true },
});

const emit = defineEmits<{ measure: [payload: { theadOffset: number }] }>();

const { rowEls, rowTop, theadOffset, measure } = useHeaderMeasurement();

/** 测量并回传 thead 总高（scrollMargin） */
function measureAndEmit() {
  measure();
  emit("measure", { theadOffset: theadOffset.value });
}

onMounted(measureAndEmit);
// 表头矩阵变化（列显隐/分组展开）→ DOM 更新后重测
watch(
  () => props.model.headerRows,
  () => void nextTick(measureAndEmit),
  { flush: "post" },
);

/**
 * 表头行的行级样式：sticky 模式下逐行累积 top 偏移（多行表头），避免顶边重叠。
 * @param rowIndex - 表头行下标
 * @returns 行级 inline style；非 sticky 模式返回 undefined
 */
function headerRowStyle(rowIndex: number) {
  if (!props.model.theadSticky) return undefined;
  return { top: `${rowTop.value[rowIndex] ?? rowIndex * HEADER_ROW_FALLBACK}px` };
}

/**
 * 列宽 inline style 值：数字补 px 单位（Vue :style 不自动加单位）。
 * @param width - 列宽配置
 * @returns 可直接用于 :style 的 CSS 宽度值；未配置返回 undefined
 */
function widthOf(width?: number | string) {
  return typeof width === "number" ? `${width}px` : width;
}

/**
 * 表头列线：分组格分隔线是结构性硬边界；叶子格受列线开关控制，行末排除。
 * @param cell - 表头单元格
 * @param isLastInRow - 是否为本行最后一个单元格
 * @returns class 列表
 */
function headerCellClass(cell: HeaderCell, isLastInRow: boolean) {
  if (cell.isGroup) return isLastInRow ? [] : ["border-r border-border"];
  return props.model.columnLinesOn && !isLastInRow ? ["border-r border-border"] : [];
}

/**
 * 分组单元格水平对齐（分组无 align 以外的能力）
 * @param cell - 表头单元格
 * @returns 对齐值，默认居中
 */
function headerCellAlign(cell: HeaderCell) {
  return cell.isGroup
    ? ((cell.node as { align?: "left" | "center" | "right" }).align ?? "center")
    : ((cell.node as TableColumnOptions).align ?? "center");
}

/**
 * 分组表头 sticky 样式：StickyCellStyle 无 CSSProperties 索引签名，以 CSSProperties 承载 :style。
 * @param cell - 表头单元格
 * @returns sticky 样式；不适用时 undefined
 */
function groupCellStyle(cell: HeaderCell): CSSProperties | undefined {
  return props.actions.groupStickyStyle(cell) as CSSProperties | undefined;
}

/**
 * 叶子列排序态（aria-sort）：仅 sortable 且为当前排序列时有值
 * @param column - 叶子列
 * @returns aria-sort 值
 */
function ariaSort(column: TableColumnOptions): "ascending" | "descending" | undefined {
  if (!column.sortable) return undefined;
  if (props.model.sort?.key !== column.key) return undefined;
  return props.model.sort.direction === "asc" ? "ascending" : "descending";
}

/**
 * 排序方向标记（↑/↓）
 * @param column - 叶子列
 * @returns 标记文本；未排序为空串
 */
function sortMark(column: TableColumnOptions): string {
  const direction = props.model.sort?.key === column.key ? props.model.sort.direction : "";
  return direction === "asc" ? "↑" : direction === "desc" ? "↓" : "";
}

/** 选择列宽度样式 */
const selectionWidthStyle = computed(() => ({ width: `${props.model.selectionWidth}px` }));
/** 把手列宽度样式 */
const dragWidthStyle = computed(() => ({ width: `${props.model.dragWidth}px` }));
</script>

<template>
  <thead data-table-header>
    <tr
      v-for="(cells, rowIndex) in props.model.headerRows"
      :key="rowIndex"
      :ref="(el) => (rowEls[rowIndex] = el as HTMLElement | null)"
      :style="headerRowStyle(rowIndex)"
    >
      <!-- 选择列：checkbox 型表头为本页全选三态；radio 型占位；视作最左固定列 -->
      <th
        v-if="props.model.hasSelection && rowIndex === 0"
        scope="col"
        :rowspan="props.model.headerRows.length"
        class="h-10 w-12 px-2 text-center align-middle font-medium text-muted-foreground"
        :class="[
          stickyClass(props.model.stickyOf, SELECTION_CELL, props.model.stickyOpts),
          props.model.theadThClass,
          props.model.theadLineClass,
          props.model.columnLinesOn ? 'border-r border-border' : '',
        ]"
        :style="[selectionWidthStyle, stickyStyle(props.model.stickyOf, SELECTION_CELL, true)]"
      >
        <Checkbox
          v-if="props.model.selectionType === 'checkbox'"
          :checked="props.model.headerIndeterminate ? 'indeterminate' : props.model.headerChecked"
          :aria-label="'全选本页'"
          @update:checked="props.actions.toggleAll($event)"
        />
      </th>
      <!-- 拖拽把手列表头：占位（对齐 radio 选择列范式）；视作最左固定列（紧随选择列） -->
      <th
        v-if="props.model.dragEnabled && rowIndex === 0"
        scope="col"
        :rowspan="props.model.headerRows.length"
        class="h-10 px-1 text-center align-middle font-medium text-muted-foreground"
        :class="[
          stickyClass(props.model.stickyOf, DRAG_CELL, props.model.stickyOpts),
          props.model.theadThClass,
          props.model.theadLineClass,
          props.model.columnLinesOn ? 'border-r border-border' : '',
        ]"
        :style="[dragWidthStyle, stickyStyle(props.model.stickyOf, DRAG_CELL, true)]"
      >
        <span class="sr-only">拖拽排序</span>
      </th>
      <th
        v-for="(cell, cellIndex) in cells"
        :key="cell.key"
        :scope="cell.isGroup ? 'colgroup' : 'col'"
        :colspan="cell.colSpan > 1 ? cell.colSpan : undefined"
        :rowspan="cell.rowSpan > 1 ? cell.rowSpan : undefined"
        class="h-10 px-2 align-middle font-medium text-muted-foreground"
        :class="[
          cell.isGroup
            ? undefined
            : stickyClass(props.model.stickyOf, cell.key, props.model.stickyOpts),
          props.model.theadThClass,
          props.model.theadLineClass,
          headerCellClass(cell, cellIndex === cells.length - 1),
          cell.isGroup ? undefined : 'relative',
        ]"
        :style="[
          cell.isGroup
            ? { textAlign: headerCellAlign(cell) }
            : {
                width: widthOf((cell.node as TableColumnOptions).width),
                textAlign: headerCellAlign(cell),
              },
          cell.isGroup ? groupCellStyle(cell) : stickyStyle(props.model.stickyOf, cell.key, true),
        ]"
        :aria-sort="cell.isGroup ? undefined : ariaSort(cell.node as TableColumnOptions)"
        :data-column-key="cell.isGroup ? undefined : cell.key"
        :data-column-group="cell.isGroup ? cell.path : undefined"
      >
        <button
          v-if="!cell.isGroup && (cell.node as TableColumnOptions).sortable"
          type="button"
          data-sort-button
          class="inline-flex items-center gap-1 hover:text-foreground"
          @click="props.actions.sort((cell.node as TableColumnOptions).key)"
        >
          {{ (cell.node as TableColumnOptions).title }}
          <span aria-hidden="true" class="text-xs">{{
            sortMark(cell.node as TableColumnOptions)
          }}</span>
        </button>
        <template v-else>{{ cell.node.title }}</template>
        <!-- 表头列设置入口（placement=header 时 opt-in）：绝对定位、不参与布局、不触发排序 -->
        <button
          v-if="!cell.isGroup && props.model.columnSettingsEntry"
          type="button"
          data-column-settings
          :aria-label="`列设置：${cell.node.title}`"
          class="text-muted-foreground hover:text-foreground absolute top-0 right-0 inline-flex h-full cursor-pointer items-center px-1"
          @click.stop="
            props.actions.openColumnSettings($event, (cell.node as TableColumnOptions).key)
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="size-3.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </th>
    </tr>
  </thead>
</template>
