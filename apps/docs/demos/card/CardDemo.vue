<script setup lang="ts">
import { ref } from "vue";

const showClosable = ref(true);
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <TCard class="w-80">
      <TCardHeader>
        <TCardTitle>创建项目</TCardTitle>
        <TCardDescription>一分钟内部署 tu-design 组件库。</TCardDescription>
        <TCardAction>
          <TButton variant="outline">编辑</TButton>
        </TCardAction>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">基于 Ark UI 与 Tailwind CSS v4。</p>
      </TCardContent>
      <TCardFooter class="gap-2">
        <TButton>确认</TButton>
        <TButton variant="outline">取消</TButton>
      </TCardFooter>
    </TCard>

    <TCard
      v-if="showClosable"
      class="w-80"
      hoverable
      segmented
      closable
      @close="showClosable = false"
    >
      <TCardCover>
        <div class="h-20 bg-gradient-to-r from-primary/20 to-primary/5"></div>
      </TCardCover>
      <TCardHeader>
        <TCardTitle>分段与悬浮</TCardTitle>
        <TCardDescription>segmented 分区分隔 + hoverable 悬浮提升。</TCardDescription>
      </TCardHeader>
      <TCardContent>
        <p class="text-sm text-muted-foreground">这是一个嵌入式（embedded）背景的分段卡片。</p>
      </TCardContent>
      <TCardFooter class="text-sm text-muted-foreground">Card Footer</TCardFooter>
    </TCard>
  </div>
</template>
