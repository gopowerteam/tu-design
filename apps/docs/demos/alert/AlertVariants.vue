<template>
  <div class="flex flex-col gap-3">
    <TAlert title="提示标题" description="这是一条默认样式的提示信息。" />
    <TAlert variant="info" title="信息提示" description="用于传达一般性的说明信息。" />
    <TAlert variant="success" title="操作成功" description="您的更改已保存。" />
    <TAlert variant="warning" title="注意" description="请确认当前配置后再继续。" />
    <TAlert variant="error" title="操作失败" description="网络请求超时，请重试。" />
  </div>
</template>
