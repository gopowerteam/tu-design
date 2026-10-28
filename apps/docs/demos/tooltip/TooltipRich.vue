<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <TTooltip :delay-duration="0">
      <TButton variant="outline">富内容提示</TButton>
      <template #content>
        <span class="font-medium">删除操作</span>
        <span class="opacity-80">——不可撤销，请谨慎执行</span>
      </template>
    </TTooltip>

    <TTooltip
      :delay-duration="0"
      content="contentProps 透传任意属性"
      :content-props="{ 'data-testid': 'custom-tip' }"
    >
      <TButton variant="outline">contentProps 透传</TButton>
    </TTooltip>
  </div>
</template>
