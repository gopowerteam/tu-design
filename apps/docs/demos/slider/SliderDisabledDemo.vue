<template>
  <div class="flex w-72 flex-col items-center gap-6">
    <div class="w-full space-y-2">
      <p class="text-muted-foreground text-xs">禁用单值</p>
      <TSlider :default-value="40" disabled />
    </div>
    <div class="w-full space-y-2">
      <p class="text-muted-foreground text-xs">禁用区间</p>
      <TSlider :default-value="[20, 80]" disabled />
    </div>
  </div>
</template>
