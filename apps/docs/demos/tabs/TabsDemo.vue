<template>
  <div class="flex justify-center">
    <TTabs default-value="overview" class="w-96">
      <TTabsList>
        <TTabsTrigger value="overview">概览</TTabsTrigger>
        <TTabsTrigger value="analytics">分析</TTabsTrigger>
        <TTabsTrigger value="reports">报告</TTabsTrigger>
      </TTabsList>
      <TTabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
        最近 30 天的访问量与转化率总览。
      </TTabsContent>
      <TTabsContent value="analytics" class="pt-3 text-sm text-muted-foreground">
        访问来源、留存与漏斗分析。
      </TTabsContent>
      <TTabsContent value="reports" class="pt-3 text-sm text-muted-foreground">
        导出周期性报告与订阅设置。
      </TTabsContent>
    </TTabs>
  </div>
</template>
