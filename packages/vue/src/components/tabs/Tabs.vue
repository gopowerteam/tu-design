<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";

/** 单个标签页配置项 */
interface TabItem {
  /** 唯一标识，同时作为触发按钮与面板的 value */
  value: string;
  /** 触发按钮文案 */
  label: string;
  /** 是否禁用该标签（禁用项不参与键盘导航） */
  disabled?: boolean;
  /** 面板级覆盖：首次激活才挂载（缺省回落组件级 lazyMount） */
  lazyMount?: boolean;
  /** 面板级覆盖：切走即卸载（缺省回落组件级 unmountOnExit） */
  unmountOnExit?: boolean;
  /** 追加到触发按钮的样式类 */
  class?: string;
}

interface Props {
  /** 标签页配置列表（必填） */
  items: TabItem[];
  /** 当前激活的 tab 值（配合 v-model:value）；不传时为非受控 */
  value?: string;
  defaultValue?: string;
  /** 切换模式：automatic 聚焦即切换 / manual 需点击或 Enter */
  activationMode?: "automatic" | "manual";
  /** 组件级默认：面板首次激活才挂载（item.lazyMount 优先） */
  lazyMount?: boolean;
  /** 组件级默认：面板切走即卸载（item.unmountOnExit 优先） */
  unmountOnExit?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:value": [value: string] }>();

// —— 受控桥接（DatePicker 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
const internalValue = ref(props.defaultValue);
const currentValue = computed(() => props.value ?? internalValue.value);

function handleValueUpdate(next: string) {
  internalValue.value = next;
  emit("update:value", next);
}

// —— 面板级挂载策略：复刻 ark usePresence 的 unmounted 公式，逐面板生效 ——
// unmounted = (!active && !everActivated && lazyMount) || (unmountOnExit && !active && everActivated)
// 说明：本版本 @ark-ui/vue 的 lazyMount/unmountOnExit 仅支持 Root 级全局策略，
// 为实现 item 级覆盖，这里不经 Root 下发，由本组件自行计算每个面板的挂载与否。
const activatedValues = ref(new Set<string>());
watch(
  currentValue,
  (v) => {
    if (v == null || activatedValues.value.has(v)) return;
    activatedValues.value = new Set(activatedValues.value).add(v);
  },
  { immediate: true },
);

function isPanelUnmounted(item: TabItem): boolean {
  const active = currentValue.value === item.value;
  const everActivated = activatedValues.value.has(item.value);
  const lazyMount = item.lazyMount ?? props.lazyMount;
  const unmountOnExit = item.unmountOnExit ?? props.unmountOnExit;
  return (
    (!active && !everActivated && !!lazyMount) || (!!unmountOnExit && !active && everActivated)
  );
}
</script>

<template>
  <ArkTabs.Root
    :model-value="currentValue"
    :activation-mode="props.activationMode"
    @update:model-value="handleValueUpdate"
  >
    <ArkTabs.List
      class="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]"
    >
      <ArkTabs.Trigger
        v-for="item in props.items"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled"
        :class="
          cn(
            'data-[selected]:bg-background data-[selected]:text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[selected]:shadow-sm',
            item.class,
          )
        "
      >
        {{ item.label }}
      </ArkTabs.Trigger>
    </ArkTabs.List>

    <!-- 面板：hidden/挂载由本组件按 item 配置逐面板控制，不走 Root 的全局渲染策略 -->
    <ArkTabs.Context v-slot="api">
      <template v-for="item in props.items" :key="item.value">
        <div
          v-if="!isPanelUnmounted(item)"
          v-bind="api.getContentProps({ value: item.value })"
          :data-state="currentValue === item.value ? 'open' : 'closed'"
          class="flex-1 outline-none"
        >
          <slot name="panel" :item="item" />
        </div>
      </template>
    </ArkTabs.Context>
  </ArkTabs.Root>
</template>
