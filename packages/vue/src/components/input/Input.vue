<script setup lang="ts">
import { cn } from "@/lib/utils";

// 原生 <input> 的 v-model 回写恒为 string，会令绑定了 number 的模型类型漂移
// （string 是联合成员，类型系统不报错）。跟随绑定类型归一：当前模型值为 number
// 时按 looseToNumber 语义（parseFloat，NaN 则原样）回写 number，文本绑定不归一
// （邮编/前导零安全）。useModel 保证 set 执行时读到的仍是旧值，故以此为绑定类型依据。
const looseToNumber = (val: string | number): string | number => {
  const n = Number.parseFloat(String(val));
  return Number.isNaN(n) ? val : n;
};

const modelValue = defineModel<string | number>({
  set: (v) => (typeof modelValue.value === "number" ? looseToNumber(v) : v),
});
const props = defineProps<{ class?: string; invalid?: boolean }>();
</script>

<template>
  <input
    v-model="modelValue"
    :aria-invalid="props.invalid ? 'true' : undefined"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        props.class,
      )
    "
  />
</template>
