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
  <div class="flex justify-center">
    <!-- 垂直模式：布局由 placement 接管（勿向根元素传 flex 布局类），键盘导航为 ↑/↓ -->
    <TTabs default-value="profile" :items="items" class="w-96" placement="right">
      <template #panel="{ item }">
        <p class="text-muted-foreground pt-3 text-sm">{{ contents[item.value] }}</p>
      </template>
    </TTabs>
  </div>
</template>
