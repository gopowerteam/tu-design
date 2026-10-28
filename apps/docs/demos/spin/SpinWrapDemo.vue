<script setup lang="ts">
import { ref } from "vue";

const spinning = ref(false);

function reload() {
  spinning.value = true;
  setTimeout(() => {
    spinning.value = false;
  }, 1800);
}
</script>

<template>
  <div class="w-full max-w-md space-y-4">
    <TButton variant="outline" size="sm" :disabled="spinning" @click="reload">
      {{ spinning ? "加载中…" : "重新加载" }}
    </TButton>

    <TSpin :spinning="spinning">
      <div class="space-y-2 rounded-xl border p-4">
        <p class="text-sm font-medium">订单概览</p>
        <p class="text-xs text-muted-foreground">
          包裹用法：加载期间内容被半透明遮罩覆盖并居中显示
          spinner；加载完成后遮罩消失，内容恢复可交互。
        </p>
      </div>
    </TSpin>
  </div>
</template>
