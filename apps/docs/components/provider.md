---
title: TuDesignProvider 应用根组件
description: 可选的应用根组件：mode 显式声明微前端渲染环境（覆盖浮层沙箱自动探测），:toast 聚合消息提示宿主。
---

# TuDesignProvider 应用根组件

可选的**应用根组件**，两个职责：

1. **`mode`**：显式声明子应用运行在哪种渲染环境，覆盖浮层组件的自动沙箱探测（Teleport 目标降级 / 定位策略 / 模态滚动锁）。不挂载本组件或不传 `mode` 时，一切行为与自动探测完全一致——它只是给「想知道得更准、控制得更多」的场景准备的。
2. **`:toast`**：消息提示宿主聚合（present = enabled），替代单独挂载 `ToastProvider`。

安装：

```bash
npx @tu-design/cli add provider
```

依赖说明：registry 项 `provider` 自动携带 `overlay-shared` 与 `toast` 两个依赖项。

## 基础用法

wujie 子应用的推荐根部写法：

```vue
<!-- 子应用根组件 App.vue -->
<template>
  <TuDesignProvider mode="shadow-iframe" :toast="{ duration: 4000 }">
    <RouterView />
  </TuDesignProvider>
</template>
```

不需要显式声明环境时，`mode` 可省略（缺省 `"auto"`）：

```vue
<TuDesignProvider :toast="{}">
  <RouterView />
</TuDesignProvider>
```

## mode：环境声明

`mode` 描述的是**渲染拓扑**而非框架品牌——同一框架不同模式落不同拓扑，不同框架也可能共享同一拓扑。每个取值绑定一组确定的适配行为：

| 取值            | 隔离构成                        | Teleport 降级  | 定位策略 fixed | 模态滚动锁       | 对应现实环境                                                                  |
| --------------- | ------------------------------- | -------------- | -------------- | ---------------- | ----------------------------------------------------------------------------- |
| `auto`（缺省）  | 自动探测                        | 探测命中则降   | 探测命中则注入 | 探测命中则禁用   | 现行行为，不配就对了                                                          |
| `none`          | 无特殊拓扑                      | 不降级         | 不注入         | Ark 缺省（锁定） | 独立运行、qiankun、micro-app lightDOM、纯 `<iframe>` 嵌入、wujie degrade 模式 |
| `shadow`        | 仅 shadow DOM 边界              | 降级到挂载容器 | 不注入         | Ark 缺省（锁定） | micro-app `strictStyleIsolation`、web component 沙箱                          |
| `shadow-iframe` | shadow 边界 + 独立 iframe realm | 降级到挂载容器 | 注入 `fixed`   | 禁用             | wujie 默认模式                                                                |

::: warning 按框架查表
不确定选什么就不配（`auto`）。确定要显式声明时按「隔离构成」对号入座，框架映射速查：wujie 2.x 默认 → `shadow-iframe`；qiankun / micro-app(lightDOM) / 纯 iframe / wujie degrade → `none`；micro-app(shadowDOM) → `shadow`。
:::

::: info 三个语义要点
- **短路**：显式 `mode` 下不执行任何探测代码，marker / realm 信号漂移不影响声明值；
- **优先级**：组件显式 prop（`to`、`positioning.strategy` 等）> Provider `mode` > 自动探测；
- **`none` ≠ `auto` 逐位等值**：`none` 是「显式关闭全部适配」，不保证与 `auto` 探测结果一致（如纯 iframe 环境 `auto` 会注入无害的 fixed，`none` 则不注入）。两者行为均正确，勿以 `auto` 为参照判定「配置无效」。
:::

## :toast：消息宿主

传入 `toast` 对象即在 Provider 内挂载消息提示宿主（内部组合 `ToastProvider`，能力完全等价）：

```vue
<TuDesignProvider :toast="{ placement: 'top-center', duration: 5000, max: 5 }">
```

| 键          | 类型             | 缺省         | 说明                   |
| ----------- | ---------------- | ------------ | ---------------------- |
| `placement` | `ToastPlacement` | `bottom-end` | 弹出位置               |
| `duration`  | `number`         | `3000`       | 默认自动关闭时长（ms） |
| `max`       | `number`         | `3`          | 同屏最大数量，超出排队 |

::: warning 与 ToastProvider 二选一
`:toast` 与单独挂载的 `<ToastProvider>` 是同一宿主的两条入口，同时出现即双宿主：开发环境告警一次，且后挂载者的配置生效。存量项目可直接把 `<ToastProvider>` 平移为 `<TuDesignProvider :toast="原props">`。
:::

## :overlay：模态滚动锁注入

传入 `overlay` 对象即为模态浮层（Dialog / Drawer / AlertDialog）注入自定义滚动锁实现，用于补齐内置锁被禁用的沙箱拓扑（wujie）下的模态锁空缺。契约签名为 RAII 风格——`lock()` 返回释放函数，对齐 Zag `preventBodyScroll` 返回 cleanup 的先例：

```ts
interface TuOverlayContract {
  /** 模态打开时调用；返回释放函数，关闭/卸载时调用且仅调用一次 */
  lock(): VoidFunction;
}
```

```vue
<script setup lang="ts">
import type { TuOverlayContract } from "@tu-design/vue";

const APP_ID = "sub-app-a"; // 与宿主约定的应用唯一标识

const overlay: TuOverlayContract = {
  lock() {
    window.$wujie?.bus.$emit("overlay:lock", APP_ID);
    return () => window.$wujie?.bus.$emit("overlay:unlock", APP_ID);
  },
};
</script>

<template>
  <TuDesignProvider mode="shadow-iframe" :overlay="overlay">
    <RouterView />
  </TuDesignProvider>
</template>
```

对称驱动由库保证：模态打开时调用 `lock()`，关闭或组件卸载时调用其返回的释放函数**且仅一次**（开着即卸载也会补调）；attrs 透传 `:modal="false"` 的非模态用法不触发锁。接入方只需实现 `lock()`，无需手动 unlock。完整的 glue / 宿主接入示例见[微前端与沙箱](/guide/micro-frontend)的「模态滚动锁跨沙箱契约」一节。

### 生效语义（语义 B）

`overlay` **仅在 `mode` 解析为锁禁用拓扑时消费**（`shadow-iframe`，或 `auto` 探测命中 wujie）——此时内置锁本就让位，由注入的契约接管驱动；其余拓扑下注入被**忽略**，行为与不注入完全一致（Ark 原生锁路径不变），开发环境 `console.warn` 一次提示注入未生效：

| mode 解析结果                           | 注入行为                                 |
| --------------------------------------- | ---------------------------------------- |
| `shadow-iframe` / `auto` 探测命中 wujie | 消费：注入契约驱动加锁 / 释放            |
| `none` / `shadow` / `auto` 未命中       | 忽略 + dev warn 一次；Ark 原生锁路径不变 |

不注入 `overlay` 时，行为与 v0.5.11 完全一致——本 prop 只补「锁禁用」空缺，不改动任何本来正确的锁路径。

### present = enabled，mount-time 消费

与 `:toast` 同一先例：传入 `overlay` 即启用（present = enabled），**挂载时消费**（provide 快照），运行时变更不生效也不响应——需要动态切换时用 `:key` 重挂载：

```vue
<TuDesignProvider :key="env" :mode="env" :overlay="overlay">
```

## mount-time 契约

`mode` 与 `toast` 均为**挂载时消费**（provide 快照 / Toaster 挂载时读取 store），运行时变更不生效也不响应——需要动态切换时用 `:key` 重挂载：

```vue
<TuDesignProvider :key="env" :mode="env">
```

## API

### Props

| 属性      | 类型                                                     | 默认值   | 说明                                                      |
| --------- | -------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `mode`    | `"auto" \| "none" \| "shadow" \| "shadow-iframe"`        | `"auto"` | 渲染环境声明；详见上表                                    |
| `toast`   | `TuToastConfig`（`placement` / `duration` / `max` 子集） | —        | 未传不挂载消息宿主；传 `{}` 全走缺省                      |
| `overlay` | `TuOverlayContract`（`lock(): VoidFunction`）            | —        | 未传不注入，行为与 v0.5.11 一致；仅锁禁用拓扑消费，见上节 |

### Slots

| 插槽 | 说明     |
| ---- | -------- |
| 默认 | 应用内容 |

## 微前端环境下的注意

Provider 须**包住子应用根**（inject 沿逻辑树传递，Teleport 出去的浮层同样命中）；个别组件若挂载在 Provider 子树之外（如独立 `createApp` 片段），会回落 `auto` 探测兜底。

## 主题定制

无样式输出；配置语义见[微前端与沙箱](/guide/micro-frontend)的「手动声明运行环境」一节。
