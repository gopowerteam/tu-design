---
title: Toast 轻提示
description: 全局命令式轻提示：Provider 一次挂载，useToast() 随处调用，语义 type 自动映射主题色。
---

# Toast

全局轻提示：`ToastProvider` 在应用根部挂载一次负责渲染，`useToast()` 提供命令式 API（`success` / `error` / `info` / `warning` / `loading` / `promise` / `dismiss`），在任意组件、组合式函数甚至事件回调中直接调用。语义 `type` 自动映射主题 token 配色（success / warning / info / destructive），可关闭按钮、进出场与排队（`max` 超出后排队等待）均已内建。

::: tip Provider 必须在应用根部挂载一次
`useToast()` 是模块级单例，与组件树解耦，因此**必须在应用根部渲染一次 `<ToastProvider>`**，否则 toast 只会入队、不会渲染。挂载前调用 toast 方法时，开发环境会在控制台输出警告提醒。`useToast()` 的返回引用恒定，Provider 挂载时按 props 重建内部实例对调用方完全透明。
:::

安装：

```bash
npx tu-design add toast
```

依赖说明：registry 项 `toast` 自动携带 `@ark-ui/vue` 运行时依赖与 `cn` 工具。

## 基础用法

在根组件挂载一次 Provider，之后任何地方调用 `useToast()`：

```vue
<!-- App.vue -->
<script setup lang="ts">
import { useToast } from "@tu-design/vue";

const toast = useToast();
</script>

<template>
  <!-- 应用根部挂载一次，负责渲染所有 toast -->
  <TToastProvider />

  <button @click="toast.success({ title: '已保存', description: '更改已生效' })">保存</button>
</template>
```

<DemoPreview file="toast/ToastDemo.vue" />

## 语义类型

五种预设类型自动映射 token 配色与图标：

<DemoPreview file="toast/ToastTypes.vue" />

## Placement

弹出位置由 Provider 的 `placement` 统一设定：

<DemoPreview file="toast/ToastPlacement.vue" />

::: warning 已知限制
上游 Ark UI Toaster 为单 region 渲染，`placement` 是 **Provider 级配置**；单条 toast 覆盖位置暂不支持，计划在后续版本引入多 region 池支持。
:::

## Promise

`promise` 方法跟踪异步任务，在加载 / 成功 / 失败三个阶段自动切换提示：

<DemoPreview file="toast/ToastPromise.vue" />

## 组件结构

一体式设计：仅 `ToastProvider` 一个组件（内部样式化 Ark UI 的 `Toaster` 与 `Toast.Root / Title / Description / CloseTrigger / ActionTrigger`），命令式 API 全部由 `useToast()` 提供，无其余子组件。

## API

### ToastProvider Props

| Prop        | 类型                                                                              | 默认值         | 说明                   |
| ----------- | --------------------------------------------------------------------------------- | -------------- | ---------------------- |
| `placement` | `'top-start' \| 'top' \| 'top-end' \| 'bottom-start' \| 'bottom' \| 'bottom-end'` | `'bottom-end'` | 全局默认弹出位置       |
| `duration`  | `number`                                                                          | `3000`         | 默认自动关闭时长（ms） |
| `max`       | `number`                                                                          | `3`            | 同屏最大数量，超出排队 |

### useToast()

返回模块级单例（引用恒定），方法镜像 zag store：

| 方法                                 | 说明                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| `success(options)`                   | 成功提示，返回 toast id                                               |
| `error(options)`                     | 错误提示，返回 toast id                                               |
| `info(options)`                      | 信息提示，返回 toast id                                               |
| `warning(options)`                   | 警告提示，返回 toast id                                               |
| `loading(options)`                   | 加载中提示（不自动关闭时需自行传大 `duration` 并 `dismiss`），返回 id |
| `promise(promise, options, shared?)` | 跟踪 Promise 状态，返回 `{ id, unwrap }`                              |
| `dismiss(id?)`                       | 关闭指定 toast；不传 id 关闭全部                                      |

`options` 支持 `title`、`description`、`duration`、`type`、`action: { label }`（渲染 `ActionTrigger`）等字段。

### Slots

ToastProvider 无插槽；提示内容完全由 `useToast()` 的调用参数驱动。

## 主题定制

Toast 样式由语义 token 驱动（均含 `.dark` 暗色值）：

| 变量                                         | 用途                |
| -------------------------------------------- | ------------------- |
| `--success` / `--success-foreground`         | success 底色 / 文字 |
| `--warning` / `--warning-foreground`         | warning 底色 / 文字 |
| `--info` / `--info-foreground`               | info 底色 / 文字    |
| `--destructive`                              | error 底色          |
| `--primary`                                  | loading 底色        |
| `--background` / `--foreground` / `--border` | 无类型默认配色      |
