<template>
  <div class="w-full">
    <TFormRender :definition="entry" submitable :min-width="280" @submit="submitted = true" />
    <p v-if="submitted" class="text-sm text-emerald-600 mt-3">已提交 ✓（详见控制台）</p>
  </div>
</template>

<script setup lang="ts">
import * as v from "valibot";
import { ref } from "vue";
import { defineForm } from "@tu-design/vue";

interface ProductForm {
  name: string;
  price: number | null;
  priority: string;
  enabled: boolean;
}

const submitted = ref(false);

const entry = defineForm<ProductForm>({
  items: [
    {
      key: "name",
      title: "商品名",
      default: "",
      description: "至少 2 个字符",
      render: (r) => r.input({ placeholder: "输入商品名" }),
    },
    {
      key: "price",
      title: "价格（元）",
      default: null,
      render: (r) => r.number({ min: 0, step: 10 }),
    },
    {
      key: "priority",
      title: "优先级",
      default: "normal",
      render: (r) =>
        r.radioGroup({
          items: [
            { label: "低", value: "low" },
            { label: "普通", value: "normal" },
            { label: "高", value: "high" },
          ],
          orientation: "horizontal",
        }),
    },
    {
      key: "enabled",
      title: "上架",
      default: true,
      render: (r) => r.switch(),
    },
  ],
  schema: v.object({
    name: v.pipe(v.string(), v.minLength(2, "至少 2 个字符")),
    price: v.nullable(v.number()),
    priority: v.string(),
    enabled: v.boolean(),
  }),
  onSubmit: async ({ value }) => {
    console.log("商品提交", value);
  },
});
</script>
