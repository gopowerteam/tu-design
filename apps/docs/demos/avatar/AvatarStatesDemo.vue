<template>
  <div class="flex flex-wrap items-center gap-6">
    <TAvatar size="xs" src="https://i.pravatar.cc/96?img=12" alt="xs 头像" />
    <TAvatar size="sm" src="https://i.pravatar.cc/96?img=32" alt="sm 头像" />
    <TAvatar size="lg" src="https://i.pravatar.cc/96?img=47" alt="lg 头像" />
    <TAvatar :size="56" shape="square" src="https://i.pravatar.cc/96?img=5" alt="自定义尺寸" />
    <TAvatar color="#7c3aed" class="text-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </TAvatar>
    <TAvatar src="https://i.pravatar.cc/96?img=99" alt="加载失败演示" shape="square"> CT </TAvatar>
  </div>
</template>
