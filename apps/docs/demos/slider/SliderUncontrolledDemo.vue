<template>
  <div class="flex flex-col items-center gap-6">
    <div class="flex w-72 flex-col items-center gap-2">
      <TSlider :default-value="40" />
      <p class="text-muted-foreground text-xs">单值</p>
    </div>
    <div class="flex w-72 flex-col items-center gap-2">
      <TSlider :default-value="[20, 80]" />
      <p class="text-muted-foreground text-xs">区间</p>
    </div>
  </div>
</template>
