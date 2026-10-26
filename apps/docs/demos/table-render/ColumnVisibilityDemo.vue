<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

interface Dept {
  id: number;
  name: string;
  lead: string;
  headcount: number;
  budget: number;
  children?: Dept[];
}

const ORG: Dept[] = [
  {
    id: 1,
    name: "集团总部",
    lead: "周敏",
    headcount: 128,
    budget: 5200,
    children: [
      {
        id: 11,
        name: "研发中心",
        lead: "李强",
        headcount: 64,
        budget: 2600,
        children: [
          { id: 111, name: "前端组", lead: "赵云", headcount: 12, budget: 480 },
          { id: 112, name: "后端组", lead: "钱锋", headcount: 18, budget: 720 },
        ],
      },
      { id: 12, name: "市场中心", lead: "王芳", headcount: 32, budget: 1300 },
      { id: 13, name: "人力资源部", lead: "陈静", headcount: 14, budget: 560 },
    ],
  },
  {
    id: 2,
    name: "华东分公司",
    lead: "刘洋",
    headcount: 46,
    budget: 1800,
    children: [
      { id: 21, name: "销售一部", lead: "朱磊", headcount: 15, budget: 600 },
      { id: 22, name: "销售二部", lead: "高雅", headcount: 13, budget: 520 },
    ],
  },
  { id: 3, name: "华南分公司", lead: "徐涛", headcount: 38, budget: 1500 },
];

/** 受控可见集：业务可持久化（如存 localStorage） */
const visibleKeys = ref<string[]>(["name", "lead", "headcount", "ops"]);

const table = defineTable<Dept>({
  data: ORG,
  pageSize: 100,
  rowSelection: "checkbox",
  tree: { defaultExpandAll: true },
  columnVisibility: { defaultVisibleKeys: ["name", "lead", "headcount", "ops"] },
  columns: [
    { key: "name", title: "部门", width: 200, fixed: "left" },
    { key: "lead", title: "负责人", width: 120 },
    { key: "headcount", title: "人数", width: 100, align: "right" },
    { key: "budget", title: "预算（万）", width: 140, align: "right", fixed: "right" },
    {
      key: "ops",
      title: "操作",
      width: 120,
      fixed: "right",
      render: (r) => r.button([{ text: "详情", disabled: (dept) => dept.id === 1 }]),
    },
  ],
});

function onVisibleKeysChange(keys: string[]) {
  visibleKeys.value = keys;
}
</script>

<template>
  <div class="w-full space-y-3">
    <TTableRender
      :definition="table"
      row-key="id"
      :visible-keys="visibleKeys"
      @update:visible-keys="onVisibleKeysChange"
      @column-visibility-change="onVisibleKeysChange"
    />
    <p class="text-muted-foreground text-xs">
      右上角「列设置」：隐藏「部门」（fixed 首列）观察 sticky 偏移重算； 隐藏「操作」（fixed-right
      全组隐藏）；树形展开控件跟随首个可见业务列。 事件
      <code>column-visibility-change</code> 载荷可用于持久化。
    </p>
  </div>
</template>
