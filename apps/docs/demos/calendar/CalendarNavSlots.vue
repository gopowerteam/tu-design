<template>
  <div class="flex flex-col items-center gap-6">
    <TCalendar default-value="2026-10-09" />
    <TCalendar default-value="2026-10-09">
      <template #prev-icon>
        <span class="px-1 text-sm font-medium">←</span>
      </template>
      <template #next-icon>
        <span class="px-1 text-sm font-medium">→</span>
      </template>
    </TCalendar>
  </div>
</template>
