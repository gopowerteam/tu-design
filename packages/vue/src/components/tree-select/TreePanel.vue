<script setup lang="ts">
import type { PropType } from "vue";
import { computed } from "vue";
import ChevronIcon from "../tree-shared/ChevronIcon.vue";
import type { Key, TreeNode } from "../tree-shared";
import type { TreeOption } from "../tree-shared";

const props = defineProps({
  /** 展开态扁平化的可见节点序列（来自 treeMate.getFlattenedNodes(expandedKeys)） */
  nodes: { type: Array as PropType<Array<TreeNode>>, required: true },
  /** 当前选中键集合（用于 data-selected 回显） */
  selectedKeys: { type: Array as PropType<Key[]>, default: () => [] },
  /** 展开的分支键集合 */
  expandedKeys: { type: Array as PropType<Key[]>, default: () => [] },
  /** 键盘活动节点（Task 5 启用） */
  activeKey: { type: [String, Number] as PropType<Key | null>, default: null },
});

const emit = defineEmits<{
  select: [node: TreeNode];
  toggle: [node: TreeNode];
}>();

function label(node: TreeNode): string {
  return (node.rawNode as TreeOption).label ?? String(node.key);
}

function hasChildren(node: TreeNode): boolean {
  return !node.isLeaf && !!node.children?.length;
}

function isExpanded(node: TreeNode): boolean {
  return hasChildren(node) && props.expandedKeys.includes(node.key);
}

function isSelected(node: TreeNode): boolean {
  return props.selectedKeys.includes(node.key);
}
</script>

<template>
  <div class="max-h-[280px] overflow-auto p-1" role="tree">
    <div
      v-for="node in nodes"
      :key="node.key"
      role="treeitem"
      :aria-level="node.level + 1"
      :aria-selected="isSelected(node)"
      :aria-expanded="hasChildren(node) ? isExpanded(node) : undefined"
      data-part="tree-node"
      :data-key="node.key"
      :data-selected="isSelected(node) ? '' : undefined"
      :data-active="activeKey === node.key ? '' : undefined"
      class="flex cursor-pointer items-center gap-1 rounded-sm py-1.5 pr-2 text-sm outline-none hover:bg-accent data-[active]:bg-accent data-[selected]:bg-accent"
      :style="{ paddingLeft: `${node.level * 16 + 8}px` }"
      @click="emit('select', node)"
    >
      <span
        v-if="hasChildren(node)"
        data-part="expand"
        class="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
        :aria-label="isExpanded(node) ? '折叠' : '展开'"
        @click.stop="emit('toggle', node)"
      >
        <ChevronIcon :class="isExpanded(node) ? 'rotate-90' : ''" />
      </span>
      <span v-else class="size-4 shrink-0" aria-hidden="true" />
      <span class="truncate">{{ label(node) }}</span>
    </div>
    <div v-if="nodes.length === 0" class="px-2 py-6 text-center text-sm text-muted-foreground">
      无数据
    </div>
  </div>
</template>
