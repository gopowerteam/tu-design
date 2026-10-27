<template>
  <div class="grid grid-cols-3 gap-4">
    <TCard size="sm">
      <TCardHeader>
        <TCardTitle>Small</TCardTitle>
        <TCardDescription>紧凑分区与圆角。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">size="sm"</p>
      </TCardContent>
    </TCard>
    <TCard>
      <TCardHeader>
        <TCardTitle>Default</TCardTitle>
        <TCardDescription>默认尺寸。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">size="default"</p>
      </TCardContent>
    </TCard>
    <TCard size="lg">
      <TCardHeader>
        <TCardTitle>Large</TCardTitle>
        <TCardDescription>宽松分区与大圆角。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">size="lg"</p>
      </TCardContent>
    </TCard>
  </div>
</template>
