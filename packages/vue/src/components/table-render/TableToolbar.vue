<script setup lang="ts">
import type { PropType } from "vue";
import { FormRender, type FormRenderDefinition } from "@/components/form-render";
import { cn } from "@/lib/utils";

/**
 * 表格顶栏：搜索表单 + 列设置文字入口（保留 data-column-settings / aria-label="列设置"）。
 * 有搜索区时同行右对齐；无搜索区时自渲染一行右对齐（不新增插槽）。
 */
const props = defineProps({
  /** 搜索表单定义（引擎解析产物；undefined 时无搜索区） */
  search: { type: Object as PropType<FormRenderDefinition<any> | undefined>, default: undefined },
  /** FormRender 内置搜索按钮开关 */
  searchable: { type: Boolean, default: true },
  /** 搜索区渲染开关（showSearch=false 时父层传 false） */
  showSearchArea: { type: Boolean, default: true },
  /** 列设置入口开关 */
  showColumnSettings: { type: Boolean, default: true },
  /** 可见业务列数 */
  visibleCount: { type: Number, required: true },
  /** 业务列总数 */
  totalCount: { type: Number, required: true },
});

const emit = defineEmits<{
  search: [];
  reset: [];
  "open-column-settings": [event: MouseEvent];
}>();
</script>

<template>
  <div
    v-if="props.showSearchArea || props.showColumnSettings"
    :class="cn('mb-2 flex items-end justify-between gap-2')"
  >
    <FormRender
      v-if="props.showSearchArea"
      class="min-w-0 flex-1"
      :definition="props.search"
      :searchable="props.searchable"
      @search="emit('search')"
      @reset="emit('reset')"
    />
    <button
      v-if="props.showColumnSettings"
      type="button"
      data-column-settings
      aria-label="列设置"
      aria-haspopup="dialog"
      class="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer text-xs tabular-nums"
      @click="emit('open-column-settings', $event)"
    >
      列设置 {{ props.visibleCount }}/{{ props.totalCount }}
    </button>
  </div>
</template>
