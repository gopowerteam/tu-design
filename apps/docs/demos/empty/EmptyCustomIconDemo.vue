<script setup lang="ts"></script>

<template>
  <div>
    <TEmpty description="没有找到相关文件">
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-16"
          aria-hidden="true"
        >
          <path d="M10 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8l4-4Z" />
          <path d="M10 4v4H6" />
          <path d="m12 12 3 3m0-3-3 3" />
        </svg>
      </template>
    </TEmpty>
    <p class="text-xs text-muted-foreground">
      用 icon 插槽替换内置插画，自定义「文件未找到」图标与文案。
    </p>
  </div>
</template>
