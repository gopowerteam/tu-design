<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { cn } from "@/lib/utils";
import { useOverlayIds, type OverlayIds } from "../overlay-shared/useOverlayIds";

/** 单个选项配置项 */
interface RadioGroupOption {
  /** 选中后写入组值的唯一标识 */
  value: string;
  /** 选项文案 */
  label: string;
  /** 是否禁用该项（禁用项不响应点击且不参与键盘导航） */
  disabled?: boolean;
  /** 追加到选项根元素的样式类 */
  class?: string;
}

interface Props {
  /** 选项列表（必填） */
  items: RadioGroupOption[];
  /** 当前值（配合 v-model:value）；不传时为非受控（内部 ref 维护） */
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** 原生表单提交字段名 */
  name?: string;
  /** 关联的 form id */
  form?: string;
  required?: boolean;
  readOnly?: boolean;
  /** 校验无效态；zag 会级联 data-invalid 到 root/item/item-control */
  invalid?: boolean;
  orientation?: "horizontal" | "vertical";
  class?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:value": [value: string] }>();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Tabs/Checkbox 同款约定）
const internalValue = ref<string | null>(props.defaultValue ?? null);
const currentValue = computed(() => props.value ?? internalValue.value);

// Ark 的 update:modelValue 实际类型为 string | null（单选交互不会产生 null，仅作守卫）
function handleUpdate(value: string | null) {
  if (value === null) return;
  internalValue.value = value;
  emit("update:value", value);
}

// ids 全量覆盖（无冒号）：规避 wujie patch getElementById 对 zag 缺省冒号 id 的
// SyntaxError 刷屏（详注见 useOverlayIds）。本库不渲染 Indicator，而 machine 挂载
// entry syncIndicatorRect 查询 getIndicatorEl → 缺省冒号 id 必 miss 刷警告（wujie
// 2.1.0 实测复现）；覆盖后 miss 落到合法选择器静默 null，guard 短路后 getRadioEl
// 不可达（全 machine 仅此一处调用，已核源码）。item/itemHiddenInput/itemControl/
// itemText 为函数型覆盖口，不进 parts，user 经 attrs.ids 直传保留。
const attrs = useAttrs();
const { ids: baseIds } = useOverlayIds(attrs, {
  primary: "root",
  parts: ["root", "label", "indicator"],
});
// attrs.id 经默认 fallthrough 落在 Root DOM（ark 部件用户 attr 优先，#10 同型）：
// 同步为 ids.root 缺省覆盖，保证 trackFormControl(getRootEl) 命中真实元素；
// 用户显式 attrs.ids.root 优先。computed 合并保持响应式（勿用 setup 期快照展开）。
const rootIds = computed(() => {
  const id = attrs.id;
  const explicit = (attrs.ids as OverlayIds | undefined)?.root;
  if (typeof id !== "string" || explicit != null) return baseIds.value;
  return { ...baseIds.value, root: id };
});
</script>

<template>
  <ArkRadioGroup.Root
    :ids="rootIds"
    :model-value="currentValue"
    :disabled="props.disabled"
    :name="props.name"
    :form="props.form"
    :required="props.required"
    :read-only="props.readOnly"
    :invalid="props.invalid"
    :orientation="props.orientation"
    :class="
      cn(
        'grid gap-2',
        props.orientation === 'horizontal' && 'grid-flow-col auto-cols-max gap-4',
        props.class,
      )
    "
    @update:model-value="handleUpdate"
  >
    <ArkRadioGroup.Item
      v-for="item in props.items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      :class="cn('flex items-center gap-2', item.class)"
    >
      <!-- 隐藏原生 input 始终渲染：name/required 等表单语义不因自定义渲染丢失 -->
      <ArkRadioGroup.ItemHiddenInput />
      <!-- #item 逃生口：接管圆点控件与文本的渲染；未提供时使用内置渲染 -->
      <slot name="item" :item="item" :checked="item.value === currentValue">
        <ArkRadioGroup.ItemControl
          class="border-input text-primary shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 group flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px]"
        >
          <div
            class="bg-primary group-data-[invalid]:bg-destructive size-2 rounded-full opacity-0 transition-opacity group-data-[state=checked]:opacity-100"
          />
        </ArkRadioGroup.ItemControl>
        <ArkRadioGroup.ItemText class="text-sm">{{ item.label }}</ArkRadioGroup.ItemText>
      </slot>
    </ArkRadioGroup.Item>
  </ArkRadioGroup.Root>
</template>
