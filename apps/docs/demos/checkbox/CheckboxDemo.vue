<template>
  <div class="flex flex-col items-center gap-4">
    <TCheckbox default-checked>同意服务条款</TCheckbox>
    <TCheckbox>订阅产品更新</TCheckbox>
    <TSwitch default-checked>飞行模式</TSwitch>
    <div class="w-56 space-y-2">
      <div class="text-sm text-muted-foreground">音量</div>
      <TSlider :default-value="40" />
      <div class="text-sm text-muted-foreground">价格区间</div>
      <TSlider :default-value="[20, 80]" />
    </div>
  </div>
</template>
