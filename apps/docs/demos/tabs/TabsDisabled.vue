<template>
  <div class="flex flex-col items-center gap-3">
    <TTabs default-value="overview" class="w-96">
      <TTabsList>
        <TTabsTrigger value="overview">概览</TTabsTrigger>
        <TTabsTrigger value="analytics" disabled>分析（暂不可用）</TTabsTrigger>
        <TTabsTrigger value="reports">报告</TTabsTrigger>
      </TTabsList>
      <TTabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
        禁用的标签不可点击，键盘 ←/→ 导航也会自动跳过它。
      </TTabsContent>
      <TTabsContent value="reports" class="pt-3 text-sm text-muted-foreground">
        导出周期性报告与订阅设置。
      </TTabsContent>
    </TTabs>
    <p class="text-xs text-muted-foreground">
      在触发元素上设置 disabled 即可禁用单个标签，禁用项不参与键盘导航。
    </p>
  </div>
</template>
