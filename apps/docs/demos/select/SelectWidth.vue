<template>
  <div class="flex flex-col gap-3">
    <TSelect v-model="a" :items="items" placeholder="默认：撑满父容器" />
    <TSelect v-model="b" :items="items" placeholder="自定义宽度（w-64）" trigger-class="w-64" />
    <TSelect v-model="c" :items="items" placeholder="收缩包裹内容（w-fit）" trigger-class="w-fit" />
    <p class="text-xs text-muted-foreground">
      默认撑满父容器，与 Input、DatePicker 等表单控件在 FormItem
      中自动对齐；弹层与触发器同宽（触发器较窄时弹层保底
      <code>min-w-[8rem]</code>）；触发器宽度可经 <code>trigger-class</code> 覆盖（tailwind-merge
      合并），超长选中值自动省略号截断。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const a = ref<string>();
const b = ref<string>();
const c = ref<string>();
const items = [
  "Vue",
  "React",
  {
    label: "超长选项：这是一个非常非常非常长的选中值文本，用于验证触发器的省略号截断",
    value: "long",
  },
];
</script>
