<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { Checkbox } from "@/components/checkbox";
import { Separator } from "@/components/separator";
import { cn } from "@/lib/utils";
import type { TableColumnNode, TableColumnOptions } from "./types";
import { useColumnSettingsPanel } from "./useColumnSettingsPanel";

/**
 * 列设置面板（纯内容组件）：不依赖引擎，可见集读写经 v-model 事件由宿主承接。
 * 能力：搜索（叶子数 ≥ 6）、分组折叠、三态、计数、隐藏弱化、高亮定位、全选/重置。
 */
const props = defineProps({
  /** 扁平叶子列（原序；全选/重置口径） */
  columns: { type: Array as unknown as PropType<TableColumnOptions[]>, required: true },
  /** 原始列节点树（非可见剪枝：隐藏后仍可恢复） */
  columnTree: { type: Array as unknown as PropType<TableColumnNode[]>, required: true },
  /** 当前可见 key */
  visibleKeys: { type: Array as unknown as PropType<readonly string[]>, required: true },
  /** 默认可见 key（undefined = 未配置 → 不渲染重置） */
  defaultVisibleKeys: { type: Array as unknown as PropType<string[]>, default: undefined },
  /** 打开来源列 key：命中项高亮 */
  highlightKey: { type: String, default: undefined },
  /** 面板内容宽度类 */
  contentClass: { type: String, default: undefined },
});

const emit = defineEmits<{ "update:visible-keys": [keys: string[]] }>();

const query = ref("");
const collapsed = ref<Set<string>>(new Set());
const visibleKeysRef = computed(() => props.visibleKeys);
const columnsRef = computed(() => props.columns);
const treeRef = computed(() => props.columnTree);

const panel = useColumnSettingsPanel({
  tree: () => treeRef.value,
  columns: () => columnsRef.value,
  visibleKeys: visibleKeysRef,
  setVisibleKeys: (keys) => emit("update:visible-keys", keys),
  defaultVisibleKeys: () => props.defaultVisibleKeys,
  query,
  collapsed,
});

/**
 * 行内联缩进（按层级）
 * @param depth - 行深度
 * @returns 左内边距样式
 */
function rowStyle(depth: number) {
  return { paddingLeft: `${Number(12 + depth * 12)}px` };
}

/**
 * 叶子有效固定列标识（固定 + 数字 width 才有粘滞效果）
 * @param row - 面板行
 * @returns 是否展示固定标识
 */
function isFixedLeaf(row: { isGroup: boolean; node: TableColumnNode }) {
  return (
    !row.isGroup &&
    (row.node as TableColumnOptions).fixed !== undefined &&
    typeof (row.node as TableColumnOptions).width === "number"
  );
}
</script>

<template>
  <div data-column-settings-panel :class="cn(contentClass)">
    <div v-if="panel.showSearch.value" class="px-3 pt-3">
      <input
        v-model="query"
        data-column-search
        type="text"
        placeholder="搜索列"
        class="border-input placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-1"
      />
    </div>
    <div class="flex items-center justify-between gap-3 px-3 py-2">
      <span data-column-count class="text-muted-foreground text-xs">
        已显示 {{ panel.visibleCount.value }}/{{ panel.totalCount.value }}
      </span>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="panel.allVisible.value"
          @click="panel.selectAll()"
        >
          全选
        </button>
        <button
          v-if="panel.hasDefault.value"
          type="button"
          class="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
          @click="panel.reset()"
        >
          重置
        </button>
      </div>
    </div>
    <Separator />
    <div class="max-h-64 overflow-y-auto py-1">
      <div
        v-for="row in panel.rows.value"
        :key="row.key"
        data-column-item
        :data-column-key="row.isGroup ? undefined : row.key"
        :data-column-group="row.isGroup ? row.path : undefined"
        :data-collapsed="row.isGroup ? (collapsed.has(row.path) ? '' : undefined) : undefined"
        :data-highlight="!row.isGroup && row.key === highlightKey ? '' : undefined"
        :data-hidden="!row.isGroup && !row.state ? '' : undefined"
        class="hover:bg-accent/50 flex h-8 cursor-pointer items-center gap-2 px-3"
        :class="cn(!row.isGroup && !row.state && 'opacity-50')"
        :style="rowStyle(row.depth)"
        @click="panel.toggleRow(row)"
      >
        <button
          v-if="row.isGroup"
          type="button"
          data-collapse-toggle
          class="text-muted-foreground hover:text-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center"
          :aria-label="collapsed.has(row.path) ? '展开分组' : '折叠分组'"
          @click.stop="panel.toggleCollapsed(row.path)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-3.5 transition-transform"
            :class="cn(collapsed.has(row.path) ? '' : 'rotate-90')"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <span v-else class="size-4 shrink-0" aria-hidden="true" />
        <Checkbox
          :checked="row.state"
          :disabled="!row.canToggle"
          @update:checked="panel.toggleRow(row)"
          @click.stop
        />
        <span class="min-w-0 flex-1 truncate">{{ row.node.title }}</span>
        <!-- 有效 fixed 列（数字 width）标识：仅叶子 -->
        <svg
          v-if="isFixedLeaf(row)"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-muted-foreground size-3 shrink-0"
          aria-hidden="true"
        >
          <path d="M12 17v5" />
          <path
            d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"
          />
        </svg>
      </div>
      <p v-if="panel.emptyMatch.value" class="text-muted-foreground px-3 py-2 text-xs">无匹配列</p>
    </div>
  </div>
</template>
