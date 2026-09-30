# 自动导入

配合 [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)，模板中可以**免 import** 直接使用 `TButton`、`t-button` 形式的组件，按需打包。

## 安装

```bash
pnpm add -D unplugin-vue-components
```

## 配置

```ts
// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { TuDesignResolver } from "@tu-design/vue";

export default {
  plugins: [Components({ resolvers: [TuDesignResolver()] })],
};
```

## 使用

`T` 前缀 + 组件名，PascalCase 与 kebab-case 均可：

```vue
<template>
  <TButton>确认</TButton>
  <t-button variant="outline">取消</t-button>
  <TCard class="w-80">
    <TCardHeader>
      <TCardTitle>创建项目</TCardTitle>
      <TCardDescription>一分钟内部署 tu-design 组件库。</TCardDescription>
    </TCardHeader>
    <TCardContent>
      <p class="text-sm text-muted-foreground">内容</p>
    </TCardContent>
  </TCard>
</template>
```

## 前缀说明

- 可用组件白名单与 `@tu-design/vue` 的组件导出同步维护（单元测试强制校验）
- `Transition`、`Teleport` 等 Vue 内置组件不会被误解析
- 不提供无前缀形式，避免与业务组件或原生标签冲突
