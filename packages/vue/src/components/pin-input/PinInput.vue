<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, useAttrs } from "vue";
import { PinInput as ArkPinInput } from "@ark-ui/vue/pin-input";
import { cn } from "@/lib/utils";
import { useOverlayIds } from "../overlay-shared/useOverlayIds";

const props = defineProps({
  /** 受控值：每格一个元素的数组；undefined 走内部非受控 */
  modelValue: {
    type: Array as PropType<string[] | undefined>,
    default: undefined,
  },
  /** 格数（默认 4） */
  length: { type: Number, default: 4 },
  /** 单格字符类型 */
  type: { type: String as PropType<"numeric" | "alphanumeric" | undefined>, default: undefined },
  // default: undefined 禁用 Boolean casting（Checkbox/Dialog 同款约定）
  otp: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  mask: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  autoSubmit: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  blurOnComplete: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  placeholder: { type: String, default: undefined },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  complete: [value: string[]];
}>();

// attrs（id/aria-*）转发给首格 input，保证 TLabel/TFormControl 关联
defineOptions({ inheritAttrs: false });

// ids 全量覆盖（无冒号，详注见 useOverlayIds），字符串覆盖口 4 个：
// root/hiddenInput/label/control。hiddenInput 本库不渲染，machine 在 value watch
//（键入及受控值同步）经 dispatchInputEvent → getHiddenInputEl 查询它，缺省冒号 id
// 在 wujie 下必 miss 刷警告；覆盖后 miss 落到合法选择器静默 null，与原生行为一致。
// cell 的 input 是函数型覆盖口，且 machine/connect 从不 getById 查询 cell
//（getInputEls 走 data-ownedby 选择器，cssesc 已转义），故不覆盖、不同步 attrs.id
//（保留 zag 缺省 cell id 属预期）；用户函数型 ids.input 经 attrs 直传保留。
const attrs = useAttrs();
const { ids: rootIds } = useOverlayIds(attrs, {
  primary: "root",
  parts: ["root", "hiddenInput", "label", "control"],
});
// $attrs 转发首格前剔除 ids：ids 已由 Root :ids 消费，直传会在真实 input 上
// 产生 `ids="[object Object]"` 垃圾属性。
const firstCellAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.ids;
  return rest;
});

// 对 Ark Root 恒走受控模式，非受控语义由内部 ref 实现（Checkbox 同款）
const internalValue = ref<string[]>([]);
const current = computed(() =>
  props.modelValue === undefined ? internalValue.value : props.modelValue,
);

function handleValueChange(details: { value: string[] }) {
  internalValue.value = details.value;
  emit("update:modelValue", details.value);
}

function handleValueComplete(details: { value: string[] }) {
  emit("complete", details.value);
}
</script>

<template>
  <ArkPinInput.Root
    :ids="rootIds"
    :model-value="current"
    :type="props.type"
    :otp="props.otp"
    :mask="props.mask"
    :auto-submit="props.autoSubmit"
    :blur-on-complete="props.blurOnComplete"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="cn('flex items-center gap-2', props.class)"
    @value-change="handleValueChange"
    @value-complete="handleValueComplete"
  >
    <template v-for="i in props.length" :key="i">
      <ArkPinInput.Input
        v-bind="i === 1 ? firstCellAttrs : undefined"
        :index="i - 1"
        :class="'border-input bg-transparent h-9 w-9 rounded-md border text-center text-sm shadow-sm transition-[color,box-shadow] outline-none data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'"
      />
      <slot v-if="i < props.length" name="separator" />
    </template>
  </ArkPinInput.Root>
</template>
