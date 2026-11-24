<script setup lang="ts">
import type { PropType, VNodeChild } from "vue";
import { cloneVNode, computed, h, isVNode } from "vue";
import { Checkbox } from "@/components/checkbox";
import { Tooltip } from "@/components/tooltip";
import { DRAG_CELL, SELECTION_CELL } from "./constants";
import ChevronIcon from "../icon-shared/ChevronIcon.vue";
import GripIcon from "../icon-shared/GripIcon.vue";
import { stickyClass, stickyStyle, type StickyMap } from "./sticky";
import type { TableBodyLine, TableColumnOptions } from "./types";

const props = defineProps({
  /** 表体行数据（cells 值矩阵已由父层按可见列计算） */
  line: { type: Object as PropType<TableBodyLine>, required: true },
  /** 可见业务列（与 line.cells 同序） */
  columns: { type: Array as PropType<TableColumnOptions[]>, required: true },
  /** 选择列形态；undefined 不渲染选择单元格 */
  selection: {
    type: String as PropType<"radio" | "checkbox" | undefined>,
    default: undefined,
  },
  selected: { type: Boolean, default: false },
  sticky: { type: Object as PropType<StickyMap>, required: true },
  /** 树形缩进基准 px；undefined 表示未启用树形（不渲染 depth 缩进与 caret） */
  treeIndent: { type: Number, default: undefined },
  /** 是否渲染拖拽把手列（draggable 启用且未被守卫降级） */
  dragColumn: { type: Boolean, default: false },
  /** 本行把手禁用（排序激活 / rowKey 缺失 / 行级谓词 false） */
  dragDisabled: { type: Boolean, default: false },
  /** 本行正在被拖拽（占位态：半透明 + 虚线描边，实时让位预览中即落点提示） */
  dragging: { type: Boolean, default: false },
  /** 行分割线开关（single-column 关闭）：td 的 border-b（末行由 tbody 选择器置 0） */
  rowLines: { type: Boolean, default: true },
  /** 列分割线开关（single-line: false 开启）：非行末 td 的 border-r（选择/把手列恒非行末） */
  columnLines: { type: Boolean, default: false },
  /** 斑马纹开关（父层传入；奇偶按行模型索引在内部收敛，供 sticky 单元格换不透明固色） */
  striped: { type: Boolean, default: false },
});

const emit = defineEmits<{
  select: [checked: boolean];
  "row-click": [event: MouseEvent];
  "row-dblclick": [event: MouseEvent];
  "row-contextmenu": [event: MouseEvent];
  "cell-click": [columnKey: string, event: MouseEvent];
  /** 把手 dragstart（仅把手可起拖，整行不可拖） */
  "drag-start": [event: DragEvent];
  /** 行 dragover（实时让位预览判定） */
  "drag-over": [event: DragEvent];
  /** 行 drop（成功落位） */
  drop: [event: DragEvent];
  /** 把手 dragend（含取消路径，仅清理状态） */
  "drag-end": [event: DragEvent];
}>();

function cellText(line: TableBodyLine, index: number): string {
  const value = line.cells[index];
  return isVNode(value) ? "" : String(value ?? "");
}

/**
 * 单元格水平对齐：树形首列恒左对齐（caret 定列 + 同层标签左边缘对齐的硬前提，
 * 覆盖该列 align），其余列沿用配置，未配置默认居中。
 * @param index - 可见业务列下标
 * @returns text-align 值
 */
function columnAlign(index: number): "left" | "center" | "right" {
  if (props.treeIndent !== undefined && index === 0) return "left";
  return props.columns[index]?.align ?? "center";
}

/** stickyClass 行为开关：列线抑制 + 奇数条纹固色（与父层 tr 条纹同一奇偶口径，页内显示位次） */
const stickyOpts = computed(() => ({
  columnLines: props.columnLines,
  striped: props.striped && props.line.displayIndex % 2 === 1,
}));

/**
 * ellipsis: "tooltip" 的单元格内容：默认插槽承载截断内容（触发元素本体，不额外包裹），content 显示完整文本。
 * VNode（render 工厂）单元格经 cloneVNode 复制进触发位（VNode 不可二次挂载）。
 * @param value - 单元格原始内容（VNode 或文本）
 * @param text - 用于 tooltip content 与纯文本兜底的完整文本
 * @returns 包裹 Tooltip 后的渲染结果
 */
function tooltipCell(value: VNodeChild, text: string): VNodeChild {
  const trigger = isVNode(value) ? cloneVNode(value) : h("span", { class: "block truncate" }, text);
  return h(Tooltip, { delayDuration: 0, content: text }, { default: () => [trigger] });
}
</script>

<template>
  <tr
    :data-row-key="props.line.key"
    class="transition-colors hover:bg-muted/50"
    :class="{
      'opacity-50 [&>td]:outline-2 [&>td]:outline-dashed [&>td]:-outline-offset-2 [&>td]:outline-primary/40':
        props.dragging,
    }"
    @click="emit('row-click', $event)"
    @dblclick="emit('row-dblclick', $event)"
    @contextmenu="emit('row-contextmenu', $event)"
    @dragover="emit('drag-over', $event)"
    @drop="emit('drop', $event)"
  >
    <!-- 选择单元格：阻断冒泡避免触发行 row-click；radio 为原生控件 -->
    <td
      v-if="props.selection"
      class="w-12 p-2 text-center align-middle"
      :class="[
        props.rowLines ? 'border-b border-border' : '',
        props.columnLines ? 'border-r border-border' : '',
        stickyClass(props.sticky, SELECTION_CELL, stickyOpts),
      ]"
      :style="stickyStyle(props.sticky, SELECTION_CELL, false)"
      @click.stop
    >
      <input
        v-if="props.selection === 'radio'"
        type="radio"
        class="accent-primary size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        :checked="props.selected"
        :disabled="!props.line.canSelect"
        :aria-label="`选择第 ${props.line.displayIndex + 1} 行`"
        @click="emit('select', !props.selected)"
      />
      <Checkbox
        v-else
        :checked="props.selected"
        :disabled="!props.line.canSelect"
        :aria-label="`选择第 ${props.line.displayIndex + 1} 行`"
        @update:checked="(checked: boolean) => emit('select', checked)"
      />
    </td>
    <!-- 拖拽把手单元格：仅把手可起拖（draggable 在按钮上，整行不可拖）；阻断冒泡避免触发行 row-click -->
    <td
      v-if="props.dragColumn"
      class="p-1 text-center align-middle"
      :class="[
        props.rowLines ? 'border-b border-border' : '',
        props.columnLines ? 'border-r border-border' : '',
        stickyClass(props.sticky, DRAG_CELL, stickyOpts),
      ]"
      :style="stickyStyle(props.sticky, DRAG_CELL, false)"
      @click.stop
    >
      <button
        type="button"
        data-drag-handle
        class="text-muted-foreground inline-flex size-6 cursor-grab items-center justify-center rounded-sm active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="props.dragDisabled"
        :draggable="!props.dragDisabled"
        :aria-label="`拖拽排序第 ${props.line.displayIndex + 1} 行`"
        @dragstart="emit('drag-start', $event)"
        @dragend="emit('drag-end', $event)"
      >
        <GripIcon class="size-4" />
      </button>
    </td>
    <td
      v-for="(value, index) in props.line.cells"
      :key="props.columns[index].key"
      :data-column-key="props.columns[index].key"
      class="p-2 align-middle"
      :class="[
        props.rowLines ? 'border-b border-border' : '',
        props.columnLines && index < props.line.cells.length - 1 ? 'border-r border-border' : '',
        stickyClass(props.sticky, props.columns[index].key, stickyOpts),
        { truncate: props.columns[index].ellipsis === true },
      ]"
      :title="props.columns[index].ellipsis === true ? cellText(props.line, index) : undefined"
      :style="[
        { textAlign: columnAlign(index) },
        stickyStyle(props.sticky, props.columns[index].key, false),
      ]"
      @click="emit('cell-click', props.columns[index].key, $event)"
    >
      <!-- 首列（tree 启用时）：depth 缩进 + 展开 caret（点击 stop 避免误触发行点击） -->
      <span
        v-if="props.treeIndent !== undefined && index === 0"
        class="inline-flex max-w-full items-center gap-1"
        :style="{ marginLeft: `${props.line.row.depth * props.treeIndent}px` }"
      >
        <button
          v-if="props.line.row.getCanExpand()"
          type="button"
          data-part="expand"
          class="hover:bg-muted text-muted-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm"
          :aria-expanded="props.line.row.getIsExpanded()"
          :aria-label="props.line.row.getIsExpanded() ? '收起' : '展开'"
          @click.stop="props.line.row.toggleExpanded()"
        >
          <ChevronIcon
            class="size-3.5 transition-transform"
            :class="{ 'rotate-90': props.line.row.getIsExpanded() }"
          />
        </button>
        <!-- 叶子行同宽占位：caret 槽位固定，标签文本与同层分支行左边缘对齐 -->
        <span v-else data-part="expand" aria-hidden="true" class="size-4 shrink-0" />
        <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
        <component :is="value" v-if="isVNode(value)" />
        <span v-else class="min-w-0 truncate">{{ value }}</span>
      </span>
      <!-- ellipsis: "tooltip"：Tooltip 包装（VNode 经 cloneVNode 复制，避免二次挂载） -->
      <component
        :is="tooltipCell(value, cellText(props.line, index))"
        v-else-if="props.columns[index].ellipsis === 'tooltip'"
      />
      <template v-else>
        <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
        <component :is="value" v-if="isVNode(value)" />
        <template v-else>{{ value }}</template>
      </template>
    </td>
  </tr>
</template>
