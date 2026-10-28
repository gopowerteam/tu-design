<template>
  <div class="flex flex-col gap-3">
    <TAlert
      variant="warning"
      title="存储空间不足"
      description="当前用量已超过配额的 90%，请及时清理或升级套餐。"
      closable
      @close="onClose('warning')"
    />
    <TAlert
      variant="info"
      title="系统公告"
      description="服务将于周日凌晨进行维护。"
      closable
      @close="onClose('info')"
    />
    <p class="text-xs text-muted-foreground">最近关闭：{{ last ?? "尚无" }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const last = ref<string | null>(null);
function onClose(name: string) {
  last.value = name;
}
</script>
