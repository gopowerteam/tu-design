<template>
  <div class="grid grid-cols-2 gap-4">
    <TCard :bordered="false" title="无边框" description=':bordered="false"，同时移除阴影。'>
      <p class="text-sm text-muted-foreground">适合嵌入表单、面板等已有容器边界的场景。</p>
    </TCard>
    <TCard embedded title="嵌入式" description="embedded，底色为 bg-muted/30。">
      <p class="text-sm text-muted-foreground">弱化卡片存在感，适合次级信息块。</p>
    </TCard>
  </div>
</template>
