<script setup lang="ts">
const items = [
  { value: "profile", label: "资料" },
  { value: "security", label: "安全" },
  { value: "notify", label: "通知" },
];

const contents: Record<string, string> = {
  profile: "头像、昵称与联系方式。",
  security: "密码、两步验证与登录设备管理。",
  notify: "邮件、站内信与推送偏好设置。",
};
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <!-- 标签栏在下方：键盘导航语义不变（←/→） -->
    <TTabs default-value="profile" :items="items" class="w-96" placement="bottom">
      <template #panel="{ item }">
        <p class="text-muted-foreground pb-3 text-sm">{{ contents[item.value] }}</p>
      </template>
    </TTabs>

    <!-- 标签栏在右侧：键盘导航为 ↑/↓ -->
    <TTabs default-value="profile" :items="items" class="w-96" placement="right">
      <template #panel="{ item }">
        <p class="text-muted-foreground pt-3 text-sm">{{ contents[item.value] }}</p>
      </template>
    </TTabs>
  </div>
</template>
