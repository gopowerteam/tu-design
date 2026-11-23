<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

interface Staff {
  id: number;
  name: string;
  dept: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  email: string;
  salary: number;
}

const ROWS: Staff[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `员工${i + 1}`,
  dept: ["研发", "设计", "运营"][i % 3]!,
  q1: 78 + i,
  q2: 82 + i,
  q3: 80 + i,
  q4: 88 + i,
  email: `staff${i + 1}@example.com`,
  salary: 18000 + i * 1500,
}));

// 入口位置可运行时切换：两种 placement 共用同一个面板实例（状态不丢）
const placement = ref<"auto" | "header">("auto");

// 8 个叶子列 + 1 个分组：满足「面板搜索在 ≥6 列时出现」的阈值，同时演示多级表头只在叶子渲染 ⋮
const table = defineTable<Staff>({
  data: ROWS,
  columnVisibility: {
    defaultVisibleKeys: ["name", "dept", "q1", "q2", "q3", "q4", "email"],
  },
  columns: [
    { key: "name", title: "姓名", width: 120, fixed: "left" },
    { key: "dept", title: "部门", width: 100 },
    {
      title: "季度绩效",
      children: [
        { key: "q1", title: "Q1", width: 80, align: "right" },
        { key: "q2", title: "Q2", width: 80, align: "right" },
        { key: "q3", title: "Q3", width: 80, align: "right" },
        { key: "q4", title: "Q4", width: 80, align: "right" },
      ],
    },
    { key: "email", title: "邮箱", width: 220 },
    { key: "salary", title: "月薪", width: 120, align: "right" },
  ],
});

/**
 * 切换列设置入口位置（顶栏文字链接 ⇄ 表头叶子 ⋮）
 * @param next - 目标入口位置
 */
function usePlacement(next: "auto" | "header") {
  placement.value = next;
}
</script>

<template>
  <div class="w-full space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <TButton
        size="sm"
        :variant="placement === 'auto' ? 'default' : 'outline'"
        @click="usePlacement('auto')"
      >
        顶栏文字链接（auto）
      </TButton>
      <TButton
        size="sm"
        :variant="placement === 'header' ? 'default' : 'outline'"
        @click="usePlacement('header')"
      >
        表头 ⋮（header）
      </TButton>
    </div>
    <TTableRender :definition="table" row-key="id" :column-settings-placement="placement" />
    <p class="text-muted-foreground text-xs">
      `auto` / `toolbar` 渲染顶栏「列设置 n/m」文字链接（`auto ≡ toolbar`）；`header` 为
      opt-in，改为叶子表头右侧 `⋮`（多级表头只在叶子渲染，分组单元格不渲染），此时顶栏入口关闭。两种
      入口打开的是同一个面板：先隐藏几列再切换入口，勾选状态不变。面板随表格滚动而移动，表体横向/纵向
      滚动时自动关闭。
    </p>
  </div>
</template>
