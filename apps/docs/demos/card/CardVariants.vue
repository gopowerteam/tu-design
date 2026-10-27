<template>
  <div class="grid grid-cols-2 gap-4">
    <TCard :bordered="false">
      <TCardHeader>
        <TCardTitle>无边框</TCardTitle>
        <TCardDescription>:bordered="false"，同时移除阴影。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">适合嵌入表单、面板等已有容器边界的场景。</p>
      </TCardContent>
    </TCard>
    <TCard embedded>
      <TCardHeader>
        <TCardTitle>嵌入式</TCardTitle>
        <TCardDescription>embedded，底色为 bg-muted/30。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">弱化卡片存在感，适合次级信息块。</p>
      </TCardContent>
    </TCard>
  </div>
</template>
