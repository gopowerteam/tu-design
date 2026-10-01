# Tooltip

文字提示气泡：悬停（或键盘聚焦）触发，基于 Ark UI Tooltip 原语。`TTooltipTrigger` 支持 `asChild`，可挂在按钮、链接等任意元素上。

## 演示

<DemoPreview file="tooltip/TooltipDemo.vue" />

## 安装

```bash
npx tu-design add tooltip
```

## 用法

```vue
<template>
  <TTooltip>
    <TTooltipTrigger as-child>
      <TButton variant="outline">悬停查看</TButton>
    </TTooltipTrigger>
    <TTooltipContent>这是一个文字提示气泡</TTooltipContent>
  </TTooltip>
</template>
```

## Props

### TTooltip

| Prop                             | 类型      | 默认值  | 说明                                 |
| -------------------------------- | --------- | ------- | ------------------------------------ |
| `v-model:open`                   | `boolean` | —       | 受控开关；不传为非受控               |
| `default-open`                   | `boolean` | `false` | 非受控时的初始状态                   |
| `delay-duration`                 | `number`  | `400`   | 悬停多久后显示（毫秒），`0` 立即显示 |
| `close-duration`                 | `number`  | `150`   | 移开后多久隐藏（毫秒）               |
| `lazy-mount` / `unmount-on-exit` | `boolean` | `false` | 内容挂载策略                         |

### TTooltipTrigger

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| `as-child` | `boolean` | `false` | 以子元素为渲染目标，行为合并其上 |

### TTooltipContent

| Prop    | 类型     | 默认值 | 说明                              |
| ------- | -------- | ------ | --------------------------------- |
| `class` | `string` | —      | 追加/覆盖气泡样式（经 `cn` 合并） |

## 说明

- 悬停打开依赖 `pointermove`（防止误扫过触发），键盘聚焦同样可触发；`Escape` 关闭
- 位置默认在下方自动避让，可通过 `positioning` 透传给 Ark 原语调整
- 进出场动画基于 `data-[state]` + `tw-animate-css`
