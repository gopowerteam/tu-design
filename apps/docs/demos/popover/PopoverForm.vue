<template>
  <div class="flex flex-col items-center gap-3">
    <TPopover v-model:open="open">
      <TButton variant="outline">邀请协作者</TButton>
      <template #content>
        <form class="flex flex-col gap-3" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <label for="invite-email" class="text-sm font-medium">邮箱</label>
            <TInput id="invite-email" v-model="email" placeholder="name@example.com" />
          </div>
          <TButton type="submit" size="sm">发送邀请</TButton>
        </form>
      </template>
    </TPopover>
    <p class="text-xs text-muted-foreground">气泡内放表单：提交后经 v-model:open 关闭并重置。</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const email = ref("");

function submit() {
  email.value = "";
  open.value = false;
}
</script>
