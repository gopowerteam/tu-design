<template>
  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <TTabs default-value="one" class="w-full">
        <TTabsList>
          <TTabsTrigger value="one">第一个</TTabsTrigger>
          <TTabsTrigger value="two">第二个</TTabsTrigger>
        </TTabsList>
        <TTabsContent value="one" class="pt-3 text-sm text-muted-foreground">
          聚焦即切换。
        </TTabsContent>
        <TTabsContent value="two" class="pt-3 text-sm text-muted-foreground">
          automatic（默认）：←/→ 移动焦点时立即切换面板。
        </TTabsContent>
      </TTabs>
      <p class="text-xs text-muted-foreground">activation-mode="automatic"（默认）</p>
    </div>
    <div class="flex flex-col gap-2">
      <TTabs default-value="one" activation-mode="manual" class="w-full">
        <TTabsList>
          <TTabsTrigger value="one">第一个</TTabsTrigger>
          <TTabsTrigger value="two">第二个</TTabsTrigger>
        </TTabsList>
        <TTabsContent value="one" class="pt-3 text-sm text-muted-foreground">
          需确认切换。
        </TTabsContent>
        <TTabsContent value="two" class="pt-3 text-sm text-muted-foreground">
          manual：←/→ 只移动焦点，按 Enter 或点击才切换。
        </TTabsContent>
      </TTabs>
      <p class="text-xs text-muted-foreground">activation-mode="manual"</p>
    </div>
  </div>
</template>
