<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Product {
  id: number;
  name: string;
  cover: string;
}

/**
 * 生成纯色 SVG 占位图（data URI，离线可靠，避免文档站依赖外网图床）
 * @param color - 填充色（CSS 颜色值）
 * @returns data URI 字符串
 */
function swatch(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "正常图片 A", cover: swatch("#6366f1") },
  { id: 2, name: "正常图片 B", cover: swatch("#10b981") },
  { id: 3, name: "坏 URL → fallback", cover: "/missing-cover-3.png" },
  { id: 4, name: "坏 URL → 占位盒", cover: "/missing-cover-4.png" },
];

const table = defineTable<Product>({
  data: PRODUCTS,
  pageSize: 10,
  columns: [
    { key: "name", title: "商品" },
    {
      key: "cover",
      title: "封面",
      width: 100,
      render: (r) =>
        r.image({
          size: 40,
          alt: (row) => row.name,
          // 按行求值：第 3 行给备用图，第 4 行无备用 → 占位盒
          fallback: (row) => (row.id === 3 ? swatch("#94a3b8") : undefined),
        }),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-1 text-xs">
      前两行为正常图片（data URI）；第 3 行坏 URL 自动切换
      <code>fallback</code> 备用图；第 4 行无备用图，显示占位盒。默认
      <code>loading=&quot;lazy&quot;</code> 原生懒加载。
    </p>
  </div>
</template>
