<template>
  <div class="grid items-start gap-8 sm:grid-cols-2">
    <div class="flex flex-col items-center gap-3">
      <TNumberInput :min="0" :max="99" class="w-full" />
      <p class="text-muted-foreground text-center text-xs">默认：内置加减图标</p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TNumberInput :min="0" :max="99" class="w-full">
        <template #decrement>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </template>
        <template #increment>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
            aria-hidden="true"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </template>
      </TNumberInput>
      <p class="text-muted-foreground text-center text-xs">decrement / increment 插槽：上下箭头</p>
    </div>
  </div>
</template>
