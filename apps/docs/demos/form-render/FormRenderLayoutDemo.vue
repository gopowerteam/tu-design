<script setup lang="ts">
import { defineForm } from "@tu-design/vue";

interface Report {
  name: string;
  owner: string;
  range: [string, string] | null;
  remark: string;
}

const report = defineForm<Report>({
  items: [
    { key: "name", title: "报表名称", default: "", span: 1 },
    { key: "owner", title: "负责人", default: "", span: 1 },
    {
      key: "range",
      title: "统计区间",
      default: null,
      span: "full",
      render: (r) => r.dateRangePicker(),
    },
    {
      key: "remark",
      title: "备注",
      default: "",
      span: "full",
      render: (r) => r.textarea({ rows: 2, placeholder: "选填" }),
    },
  ],
  onSubmit: ({ value }) => {
    console.log("提交", value);
  },
});
</script>

<template>
  <div class="w-full">
    <TFormRender :definition="report" submitable :min-width="240" />
    <p class="text-muted-foreground mt-3 text-xs">
      <code>minWidth</code> 决定列数（auto-fill 自适应，缩放窗口观察换行）；<code>span</code>
      控制字段跨列，<code>"full"</code> 整行。
    </p>
  </div>
</template>
