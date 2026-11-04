<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TPopover arrow>
      <TButton variant="outline" size="sm">带箭头</TButton>
      <template #content>
        <p class="text-sm">arrow 指向触发元素，箭头底色随 --popover 主题变量。</p>
      </template>
    </TPopover>

    <TPopover arrow side="top" :arrow-class="[--arrow-size:14px]">
      <TButton variant="outline" size="sm">上方弹出 + 大箭头</TButton>
      <template #content>
        <p class="text-sm">arrow-class 可调整箭头尺寸等样式（--arrow-size: 14px）。</p>
      </template>
    </TPopover>
  </div>
</template>
