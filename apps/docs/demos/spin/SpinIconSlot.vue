<template>
  <div class="flex items-center justify-center gap-8">
    <TSpin />
    <TSpin size="lg">
      <template #icon>
        <span aria-hidden="true" class="animate-spin text-lg leading-none">◠</span>
      </template>
    </TSpin>
  </div>
</template>
