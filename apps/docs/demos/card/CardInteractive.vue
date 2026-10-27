<script setup lang="ts">
import { ref } from "vue";

const picked = ref<"plan" | "team">("plan");
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <TCard
      hoverable
      role="button"
      tabindex="0"
      :class="picked === 'plan' ? 'border-primary' : ''"
      @click="picked = 'plan'"
      @keydown.enter="picked = 'plan'"
      @keydown.space.prevent="picked = 'plan'"
    >
      <TCardHeader>
        <TCardTitle>hoverable</TCardTitle>
        <TCardDescription>悬浮时提升阴影。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">
          仅视觉反馈；当前选中：{{ picked === "plan" ? "是" : "否" }}。
        </p>
      </TCardContent>
    </TCard>
    <TCard
      interactive
      role="button"
      tabindex="0"
      :class="picked === 'team' ? 'border-primary' : ''"
      @click="picked = 'team'"
      @keydown.enter="picked = 'team'"
      @keydown.space.prevent="picked = 'team'"
    >
      <TCardHeader>
        <TCardTitle>interactive</TCardTitle>
        <TCardDescription>悬浮提升 + 上浮位移 + 按压回落。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">
          整卡可点击时使用；当前选中：{{ picked === "team" ? "是" : "否" }}。
        </p>
      </TCardContent>
    </TCard>
  </div>
</template>
