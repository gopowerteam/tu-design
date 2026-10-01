# Dialog

模态对话框：基于 Ark UI Dialog 原语封装，内置焦点圈定与还原、Escape / 遮罩点击关闭、滚动锁定与 `tw-animate-css` 进出场动画。`TDialogTrigger` / `TDialogClose` 支持 `asChild`，可把行为合并到任意元素或组件（如 `<TButton>`）上。

## 演示

<DemoPreview file="dialog/DialogDemo.vue" />

## 安装

```bash
npx tu-design add dialog
```

依赖说明：registry 项 `dialog` 自动携带 `@ark-ui/vue` 运行时依赖与 `cn` 工具。

## 用法

基础三件套：`TDialog`（根，状态容器）+ `TDialogTrigger`（打开）+ `TDialogContent`（面板）。内容区用 `TDialogHeader` / `TDialogTitle` / `TDialogDescription` / `TDialogFooter` 组装，`TDialogClose` 包裹的元素点击即关闭（含内置右上角关闭按钮，`show-close-button` 可关闭）。

```vue
<script setup lang="ts">
import { ref } from "vue";
</script>

<template>
  <TDialog>
    <TDialogTrigger as-child>
      <TButton>打开对话框</TButton>
    </TDialogTrigger>
    <TDialogContent>
      <TDialogHeader>
        <TDialogTitle>标题</TDialogTitle>
        <TDialogDescription>描述文本。</TDialogDescription>
      </TDialogHeader>
      <TDialogFooter>
        <TDialogClose as-child>
          <TButton variant="ghost">取消</TButton>
        </TDialogClose>
        <TDialogClose as-child>
          <TButton>确认</TButton>
        </TDialogClose>
      </TDialogFooter>
    </TDialogContent>
  </TDialog>
</template>
```

### 受控用法（v-model）

需要程序化控制开关时使用 `v-model:open`：

```vue
<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>

<template>
  <TDialog v-model:open="open">
    <TDialogTrigger as-child>
      <TButton>打开</TButton>
    </TDialogTrigger>
    <TDialogContent>
      <TDialogTitle>受控对话框</TDialogTitle>
    </TDialogContent>
  </TDialog>
</template>
```

## Props

### TDialog

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:open`    | `boolean` | —       | 受控开关；不传为非受控 |
| `default-open`    | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount`      | `boolean` | `false` | 首次打开前不挂载内容   |
| `unmount-on-exit` | `boolean` | `false` | 关闭动画结束后卸载内容 |

### TDialogContent

| Prop                | 类型      | 默认值 | 说明                              |
| ------------------- | --------- | ------ | --------------------------------- |
| `show-close-button` | `boolean` | `true` | 右上角内置关闭按钮                |
| `class`             | `string`  | —      | 追加/覆盖面板样式（经 `cn` 合并） |

### TDialogTrigger / TDialogClose

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| `as-child` | `boolean` | `false` | 以子元素为渲染目标，行为合并其上 |

## 可访问性

- `TDialogTitle` 渲染为 `h2` 并自动关联 `aria-labelledby`；`TDialogDescription` 关联 `aria-describedby`
- 打开时焦点移入对话框并圈定，关闭后还原到触发元素
- `Escape` 与遮罩点击默认关闭（Root 层 `close-on-escape` / `close-on-interact-outside` 可调）
