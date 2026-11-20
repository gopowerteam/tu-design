<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Task {
  id: number;
  name: string;
  owner: string;
  status: string;
}

const TASKS: Task[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `任务 ${i + 1}`,
  owner: `成员 ${(i % 3) + 1}`,
  status: ["进行中", "已完成", "已阻塞"][i % 3]!,
}));

// 五个样例各自独立实例（definition 与组件绑定后不可复用于不同 props 组合的展示）
function makeTable() {
  return defineTable<Task>({
    data: TASKS,
    pageSize: 100,
    columns: [
      { key: "name", title: "任务", width: 180 },
      { key: "owner", title: "负责人", width: 120 },
      { key: "status", title: "状态", width: 100 },
    ],
  });
}

const defaultTable = makeTable();
const gridTable = makeTable();
const noRowLinesTable = makeTable();
const stripedTable = makeTable();
const legacyTable = makeTable();

// fill + 全网格 + 固定列：sticky 表头线 / 统一列线 / sticky 交界线协同目验
interface FixedTask extends Task {
  progress: string;
}

const FIXED_TASKS: FixedTask[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `任务 ${i + 1}`,
  owner: `成员 ${(i % 3) + 1}`,
  status: ["进行中", "已完成", "已阻塞"][i % 3]!,
  progress: `${(i * 7) % 100}%`,
}));

const stickyGridTable = defineTable<FixedTask>({
  data: FIXED_TASKS,
  pageSize: 100,
  columns: [
    { key: "name", title: "任务", width: 200, fixed: "left" },
    { key: "owner", title: "负责人", width: 140 },
    { key: "status", title: "状态", width: 120 },
    { key: "progress", title: "进度", width: 100, align: "right" },
  ],
});
</script>

<template>
  <div class="w-full space-y-6">
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        默认（<code>bordered</code> 默认开启）：仅外框 + 行分隔线
      </p>
      <TTableRender :definition="defaultTable" row-key="id" />
    </section>
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        全网格：<code>:single-line="false"</code> 开启列分隔线
      </p>
      <TTableRender :definition="gridTable" row-key="id" :single-line="false" />
    </section>
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        无行线：<code>:single-column="true"</code>（表头底线保留）
      </p>
      <TTableRender :definition="noRowLinesTable" row-key="id" :single-column="true" />
    </section>
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        斑马纹：<code>:striped="true"</code>（按行模型索引奇偶，虚拟滚动安全）
      </p>
      <TTableRender :definition="stripedTable" row-key="id" :striped="true" />
    </section>
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        主回退：<code>:bordered="false"</code>（关闭外框，仅横线——分页条可见场景逐像素还原旧观感）
      </p>
      <TTableRender :definition="legacyTable" row-key="id" :bordered="false" />
    </section>
    <section>
      <p class="text-muted-foreground mb-2 text-xs">
        fill + 全网格 + 固定列：<code>fill-height</code> + <code>:single-line="false"</code>——sticky
        表头线、统一列线与固定列交界线协同（交界无双线）
      </p>
      <div class="flex h-80 flex-col">
        <div class="min-h-0 flex-1">
          <TTableRender
            :definition="stickyGridTable"
            row-key="id"
            fill-height
            :single-line="false"
          />
        </div>
      </div>
    </section>
  </div>
</template>
