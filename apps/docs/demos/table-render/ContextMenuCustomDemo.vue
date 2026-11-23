<script setup lang="ts">
import { h, ref } from "vue";
import { defineTable, type TableContextMenuContext, type TableMenuItem } from "@tu-design/vue";

interface Task {
  id: number;
  title: string;
  owner: string;
  done: boolean;
  remark: string;
}

const tasks = ref<Task[]>(
  Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `需求评审 #${i + 1}`,
    owner: ["李强", "王芳", "赵云"][i % 3]!,
    done: i % 2 === 0,
    remark: `备注 ${i + 1}：此处右键不打开表格菜单`,
  })),
);

const table = defineTable<Task>({
  data: tasks,
  columns: [
    { key: "id", title: "ID", width: 70 },
    { key: "title", title: "事项", width: 200 },
    { key: "owner", title: "负责人", width: 100 },
    { key: "done", title: "状态", width: 90, formatter: (row) => (row.done ? "已完成" : "进行中") },
    {
      key: "remark",
      title: "备注（豁免右键）",
      // data-no-table-menu：该单元格内的右键交还原生菜单，内置菜单不接管
      render: (r) => r.render((record) => h("span", { "data-no-table-menu": "" }, record.remark)),
    },
  ],
});

const message = ref("在行或单元格上右键（表头 / 空白处不会打开，因为 items 为空）");

/**
 * 业务菜单：仅对行/单元格生效，其余 target 返回空数组（= 不打开菜单）
 * @param ctx - 右键上下文
 * @returns 菜单项
 */
function buildMenu(ctx: TableContextMenuContext<Task>): TableMenuItem<Task>[] {
  const target = ctx.target;
  if (target.kind !== "row" && target.kind !== "cell") return [];
  const record = target.record;
  return [
    {
      value: "detail",
      label: `查看「${record.title}」`,
      onSelect: () => {
        message.value = `onSelect：查看第 ${target.index + 1} 行（${record.title}）`;
      },
    },
    {
      value: "toggle",
      label: record.done ? "标记为未完成" : "标记为已完成",
      onSelect: () => {
        record.done = !record.done;
        message.value = `onSelect：${record.title} → ${record.done ? "已完成" : "进行中"}`;
      },
    },
    { type: "separator" },
    // 没有 onSelect 的项：点击后发 context-menu-select，由父层统一处理
    { value: "export-row", label: "导出该行（交给父层）" },
  ];
}

/**
 * 无 onSelect 菜单项的统一出口
 * @param value - 菜单项 value
 * @param ctx - 右键上下文
 */
function onSelect(value: string, ctx: TableContextMenuContext<Task>) {
  const target = ctx.target;
  const rowKey = target.kind === "row" || target.kind === "cell" ? target.rowKey : "—";
  message.value = `context-menu-select：${value}（行 ${rowKey}）`;
}
</script>

<template>
  <div class="w-full space-y-3">
    <TTableRender
      :definition="table"
      row-key="id"
      :context-menu="buildMenu"
      @context-menu-select="onSelect"
    />
    <p class="text-muted-foreground text-xs">{{ message }}</p>
    <p class="text-muted-foreground text-xs">
      传函数 = 完全自定义菜单项：无 `onSelect` 的项走 `context-menu-select`
      事件；返回空数组则不弹菜单（表头/空白处即如此，且该区域原生菜单同样被屏蔽）。「备注」列用
      `data-no-table-menu` 标记豁免区，右键回到浏览器原生菜单。
    </p>
  </div>
</template>
