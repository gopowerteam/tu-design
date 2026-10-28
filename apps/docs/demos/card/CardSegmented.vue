<template>
  <div class="flex justify-center">
    <TCard
      segmented
      title="分段与封面"
      description="segmented 在分区之间显示分隔线。"
      class="w-full max-w-sm"
    >
      <template #cover>
        <div
          class="relative h-28 overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-transparent"
        >
          <div
            class="absolute -right-6 -bottom-10 h-32 w-32 rounded-full border border-primary/20 bg-primary/10"
          ></div>
          <div class="absolute top-1/2 left-6 -translate-y-1/2">
            <div
              class="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-5"
                aria-hidden="true"
              >
                <path d="M3 9.5 12 3l9 6.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </div>
          </div>
        </div>
      </template>
      <p class="text-sm text-muted-foreground">封面区负 margin 贴边；分隔线不会出现在封面下方。</p>
      <template #footer>
        <span class="text-sm text-muted-foreground">Card Footer</span>
      </template>
    </TCard>
  </div>
</template>
