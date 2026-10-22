<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Dept {
  id: number;
  name: string;
  lead: string;
  headcount: number;
  children?: Dept[];
}

const ORG: Dept[] = [
  {
    id: 1,
    name: "集团总部",
    lead: "周敏",
    headcount: 128,
    children: [
      {
        id: 11,
        name: "研发中心",
        lead: "李强",
        headcount: 64,
        children: [
          { id: 111, name: "前端组", lead: "赵云", headcount: 12 },
          { id: 112, name: "后端组", lead: "钱锋", headcount: 18 },
          { id: 113, name: "测试组", lead: "孙丽", headcount: 9 },
        ],
      },
      {
        id: 12,
        name: "市场中心",
        lead: "王芳",
        headcount: 32,
        children: [
          { id: 121, name: "品牌部", lead: "吴迪", headcount: 8 },
          { id: 122, name: "渠道部", lead: "郑爽", headcount: 11 },
        ],
      },
      { id: 13, name: "人力资源部", lead: "陈静", headcount: 14 },
    ],
  },
  {
    id: 2,
    name: "华东分公司",
    lead: "刘洋",
    headcount: 46,
    children: [
      { id: 21, name: "销售一部", lead: "朱磊", headcount: 15 },
      { id: 22, name: "销售二部", lead: "高雅", headcount: 13 },
    ],
  },
  { id: 3, name: "华南分公司", lead: "徐涛", headcount: 38 },
];

const table = defineTable<Dept>({
  data: ORG,
  pageSize: 100,
  rowSelection: "checkbox", // 子行作为独立行参与本页选择；父子级联勾选属二期
  tree: {
    childrenKey: "children",
    defaultExpandAll: true,
    indentSize: 16,
  },
  columns: [
    { key: "name", title: "部门", width: 220, fixed: "left" },
    { key: "lead", title: "负责人", width: 120 },
    { key: "headcount", title: "人数", width: 100, align: "right" },
  ],
});
</script>

<template>
  <div class="w-full space-y-3">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground text-xs">
      展开按钮位于首个业务列单元格内，按层级缩进；
      <code>row-click</code> 不会误触发（caret 已阻断冒泡）。 不做父子级联勾选与受控
      expanded（二期）。
    </p>
  </div>
</template>
