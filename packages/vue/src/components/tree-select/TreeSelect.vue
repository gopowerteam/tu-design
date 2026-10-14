<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Popover as ArkPopover } from "@ark-ui/vue/popover";
import { cn } from "@/lib/utils";
import { controlCls } from "../date-shared/shared";
import ChevronIcon from "../tree-shared/ChevronIcon.vue";
import ClearIcon from "../tree-shared/ClearIcon.vue";
import ValueTags from "../tree-shared/ValueTags.vue";
import { createTreeMate, type Key, type TreeNode, type TreeOption } from "../tree-shared";
import TreePanel from "./TreePanel.vue";
import type { TreeSelectTag } from "./types";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** 树选项（key/label/children/disabled） */
  options: { type: Array as PropType<TreeOption[]>, required: true },
  /** 当前值：单选为 key，multiple 为 key 数组；不传走内部非受控 */
  modelValue: {
    type: [String, Number, Array] as PropType<Key | Key[] | undefined>,
    default: undefined,
  },
  defaultValue: {
    type: [String, Number, Array] as PropType<Key | Key[] | undefined>,
    default: undefined,
  },
  /** 多选：值恒为数组，点击节点切换选中 */
  multiple: { type: Boolean, default: false },
  /** 弹层开合受控；undefined 走内部非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  placeholder: { type: String, default: "请选择" },
  /** 多选最多展示标签数，超出折叠为 +N */
  maxTagCount: { type: Number, default: undefined },
  /** 展示清空按钮 */
  clearable: { type: Boolean, default: false },
  /** 受控展开键集合；undefined 走内部非受控 */
  expandedKeys: { type: Array as PropType<Key[] | undefined>, default: undefined },
  defaultExpandedKeys: { type: Array as PropType<Key[]>, default: () => [] },
  /** 初始展开全部分支 */
  defaultExpandAll: { type: Boolean, default: false },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: Key | Key[] | undefined];
  "update:show": [open: boolean];
  "update:expandedKeys": [keys: Key[]];
}>();

// —— 受控桥接（Select/DatePicker 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
const internalValue = ref<Key | Key[] | undefined>(props.defaultValue);
const value = computed<Key | Key[] | undefined>(() =>
  props.modelValue !== undefined ? props.modelValue : internalValue.value,
);

// —— 树数据：options 变更即重建；值中的失效 key 经 getNode 静默忽略 ——
const treeMate = computed(() => createTreeMate(props.options, { ignoreEmptyChildren: true }));

const internalExpanded = ref<Key[]>(
  props.defaultExpandAll
    ? treeMate.value.getNonLeafKeys({ preserveGroup: true })
    : [...props.defaultExpandedKeys],
);
const expandedKeys = computed<Key[]>(() => props.expandedKeys ?? internalExpanded.value);

function handleExpandedUpdate(keys: Key[]) {
  internalExpanded.value = keys;
  emit("update:expandedKeys", keys);
}

function toggleNode(node: TreeNode) {
  const next = expandedKeys.value.includes(node.key)
    ? expandedKeys.value.filter((k) => k !== node.key)
    : [...expandedKeys.value, node.key];
  handleExpandedUpdate(next);
}

function toArrayValue(v: Key | Key[] | undefined): Key[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

const selectedKeys = computed<Key[]>(() => toArrayValue(value.value));

const tags = computed<TreeSelectTag[]>(() =>
  selectedKeys.value
    .map((key) => {
      const node = treeMate.value.getNode(key);
      return node ? { key, label: (node.rawNode as TreeOption).label ?? String(key) } : null;
    })
    .filter((t): t is TreeSelectTag => t !== null),
);

const singleLabel = computed(() => (props.multiple ? "" : (tags.value[0]?.label ?? "")));

function selectNode(node: TreeNode) {
  if (node.disabled) return;
  if (props.multiple) {
    const current = toArrayValue(value.value);
    const next = current.includes(node.key)
      ? current.filter((k) => k !== node.key)
      : [...current, node.key];
    internalValue.value = next;
    emit("update:modelValue", next);
  } else {
    internalValue.value = node.key;
    emit("update:modelValue", node.key);
    handleOpenUpdate(false);
  }
}

function removeTag(key: Key) {
  const next = toArrayValue(value.value).filter((k) => k !== key);
  internalValue.value = next;
  emit("update:modelValue", next);
}

const hasValue = computed(() => tags.value.length > 0);

function handleClear() {
  const next = props.multiple ? [] : undefined;
  internalValue.value = next;
  emit("update:modelValue", next);
}

// —— 弹层开合（点击/键盘 ↓ 显式驱动，保证各环境一致）——
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleOpenUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:show", open);
}

function openFromInput() {
  if (props.disabled || isOpen.value) return;
  syncPanelWidth();
  handleOpenUpdate(true);
}

// —— 面板宽度对齐触发器 ——
const triggerEl = ref<HTMLElement | null>(null);
const panelMinWidth = ref("0px");
function syncPanelWidth() {
  panelMinWidth.value = `${triggerEl.value?.offsetWidth ?? 0}px`;
}

const visibleNodes = computed(() => treeMate.value.getFlattenedNodes(expandedKeys.value));
</script>

<template>
  <ArkPopover.Root :open="isOpen" @update:open="handleOpenUpdate">
    <div
      ref="triggerEl"
      v-bind="$attrs"
      data-part="trigger"
      role="button"
      tabindex="0"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-disabled="props.disabled || undefined"
      :class="
        cn(
          controlCls,
          'min-h-9 cursor-pointer gap-2 px-3 py-1.5 text-sm',
          props.disabled && 'cursor-not-allowed opacity-50',
          props.class,
        )
      "
      @click="openFromInput"
      @keydown.down.prevent="openFromInput"
      @keydown.enter.prevent="openFromInput"
    >
      <template v-if="props.multiple">
        <ValueTags
          v-if="tags.length"
          :values="tags"
          :max-tag-count="props.maxTagCount"
          :disabled="!!props.disabled"
          @remove="removeTag"
        />
        <span v-else class="truncate text-muted-foreground">{{ props.placeholder }}</span>
      </template>
      <template v-else>
        <span v-if="singleLabel" class="truncate">{{ singleLabel }}</span>
        <span v-else class="truncate text-muted-foreground">{{ props.placeholder }}</span>
      </template>
      <span class="ml-auto flex shrink-0 items-center gap-1">
        <span
          v-if="props.clearable && hasValue && !props.disabled"
          role="button"
          data-part="clear"
          class="text-muted-foreground hover:text-foreground"
          aria-label="清空"
          @click.stop="handleClear"
        >
          <ClearIcon />
        </span>
        <ChevronIcon
          :class="
            cn('text-muted-foreground transition-transform', isOpen ? '-rotate-90' : 'rotate-90')
          "
        />
      </span>
    </div>

    <!-- 弹层 Teleport 到 body：脱离表单 DOM，消除 overflow 容器裁剪隐患（DatePicker 同款） -->
    <Teleport to="body">
      <ArkPopover.Positioner class="z-50">
        <ArkPopover.Content
          :class="
            cn(
              'bg-popover text-popover-foreground z-50 rounded-md border p-0 shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )
          "
          :style="{ minWidth: panelMinWidth }"
        >
          <TreePanel
            :nodes="visibleNodes"
            :selected-keys="selectedKeys"
            :expanded-keys="expandedKeys"
            @select="selectNode"
            @toggle="toggleNode"
          />
        </ArkPopover.Content>
      </ArkPopover.Positioner>
    </Teleport>
  </ArkPopover.Root>
</template>
