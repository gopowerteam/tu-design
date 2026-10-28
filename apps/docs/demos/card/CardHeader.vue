<template>
  <div class="flex justify-center">
    <TCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="font-semibold leading-none tracking-tight">自定义头部</span>
            <span class="text-sm text-muted-foreground">#header 逃生口完全接管头部。</span>
          </div>
          <TBadge variant="outline">Beta</TBadge>
        </div>
      </template>
      <p class="text-sm text-muted-foreground">
        提供 #header 时不再渲染 title/description，可自由排版任意头部结构。
      </p>
    </TCard>
  </div>
</template>
