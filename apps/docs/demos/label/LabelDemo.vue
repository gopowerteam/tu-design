<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-2">
      <t-label for="demo-email">邮箱</t-label>
      <t-input id="demo-email" type="email" placeholder="name@example.com" />
      <p class="text-xs text-muted-foreground">
        <code>for</code> 指向控件的 <code>id</code>，点击「邮箱」即可聚焦输入框。
      </p>
    </div>
  </div>
</template>
