<script setup lang="ts">
import { ref } from "vue";
import { defineTable, type TableContextMenuContext } from "@tu-design/vue";

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
}

const ROWS: Order[] = Array.from({ length: 8 }, (_, i) => ({
  id: `SO-2026${String(1001 + i)}`,
  customer: ["云启科技", "海岚贸易", "北辰制造"][i % 3]!,
  amount: 12000 + i * 3400,
  status: ["待发货", "已发货", "已完成"][i % 3]!,
}));

const table = defineTable<Order>({
  data: ROWS,
  pageSize: 5,
  columnVisibility: {
    defaultVisibleKeys: ["id", "customer", "amount"],
  },
  columns: [
    { key: "id", title: "订单号", width: 180 },
    { key: "customer", title: "客户" },
    { key: "amount", title: "金额", align: "right", sortable: true },
    { key: "status", title: "状态" },
  ],
});

const lastTarget = ref("在表格任意位置点右键试试");

/**
 * 把九态 target 转成可读文案（只演示读取方式，业务可按 kind 分派动作）
 * @param ctx - 右键上下文
 * @returns 目标描述
 */
function describe(ctx: TableContextMenuContext<Order>): string {
  const target = ctx.target;
  switch (target.kind) {
    case "cell":
      return `cell：列 ${target.columnKey}，原始值 ${String(target.rawValue)}，行 ${target.rowKey}`;
    case "row":
      return `row：${target.rowKey}（第 ${target.index + 1} 行）`;
    case "header":
      return target.columnKey
        ? `header：列 ${target.columnKey}`
        : `header：分组 ${target.groupPath}`;
    case "pagination":
      return "pagination：分页条";
    case "empty":
      return "empty：空态";
    case "error":
      return "error：错误态";
    case "skeleton":
      return "skeleton：加载骨架";
    default:
      return "table：表格空白处";
  }
}

/**
 * 菜单打开回调：读取当前右键目标（`context-menu` 事件）
 * @param ctx - 右键上下文
 */
function onOpen(ctx: TableContextMenuContext<Order>) {
  lastTarget.value = describe(ctx);
}
</script>

<template>
  <div class="w-full space-y-3">
    <TTableRender :definition="table" row-key="id" :context-menu="true" @context-menu="onOpen" />
    <p class="text-muted-foreground text-xs">
      最近右键目标：<span class="text-foreground">{{ lastTarget }}</span>
    </p>
    <p class="text-muted-foreground text-xs">
      `:context-menu="true"` 启用默认项——列设置… / 重置列（已配置 defaultVisibleKeys 时才出现）/
      显示全部列。在表头、行、单元格、空白处、分页条上右键可看到 `ctx.target` 的 kind
      变化；表格区域内的
      原生右键菜单已被屏蔽，内置搜索框上右键仍保留原生菜单。
    </p>
  </div>
</template>
