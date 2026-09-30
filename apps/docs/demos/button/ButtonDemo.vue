<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TButton>Default</TButton>
    <TButton variant="secondary">Secondary</TButton>
    <TButton variant="destructive">Destructive</TButton>
    <TButton variant="outline">Outline</TButton>
    <TButton variant="ghost">Ghost</TButton>
    <TButton variant="link">Link</TButton>
    <TButton size="sm">Small</TButton>
    <TButton size="lg">Large</TButton>
    <TButton size="icon">AI</TButton>
    <TButton>
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </template>
      Icon 前置
    </TButton>
    <TButton variant="outline">
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </template>
      下载
    </TButton>
  </div>
</template>
