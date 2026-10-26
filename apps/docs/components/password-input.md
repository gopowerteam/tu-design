---
title: PasswordInput 密码输入
description: 密码输入框：内置明文/掩码切换按钮（Eye/EyeOff 图标，带 aria 语义），默认 autocomplete="current-password"。
---

# PasswordInput

密码输入框：内置明文/掩码切换按钮（Eye/EyeOff 图标，带 `aria-label`/`aria-pressed` 语义），默认 `autocomplete="current-password"`。

安装：

```bash
npx tu-design add password-input
```

## 基础用法

`v-model` 绑定密码值，`v-model:visible` 同步明文状态：

<DemoPreview file="password-input/PasswordInputDemo.vue" />

## 禁用与校验态

`disabled` 时输入框与切换按钮同时禁用；`invalid` 套 destructive 样式：

<DemoPreview file="password-input/PasswordInputStates.vue" />

## API

### Props

| 项                | 类型                                   | 说明                                            |
| ----------------- | -------------------------------------- | ----------------------------------------------- |
| `v-model`         | `string`                               | 密码值                                          |
| `v-model:visible` | `boolean`                              | 明文显示状态（默认掩码）                        |
| `autoComplete`    | `"current-password" \| "new-password"` | 默认 `"current-password"`                       |
| `placeholder`     | `string`                               | 输入框占位符                                    |
| `disabled`        | `boolean`                              | 禁用态（输入框与切换按钮同时禁用）              |
| `invalid`         | `boolean`                              | 校验失败态（`data-invalid` + destructive 样式） |
| `class`           | `string`                               | 追加/覆盖样式（经 `cn` 合并）                   |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

### Events

| 事件                | 载荷                 | 说明         |
| ------------------- | -------------------- | ------------ |
| `update:modelValue` | `(value: string)`    | 密码值变化   |
| `update:visible`    | `(visible: boolean)` | 明文状态切换 |

### Slots

| 插槽              | 作用域        | 说明                                            |
| ----------------- | ------------- | ----------------------------------------------- |
| `visibility-icon` | `{ visible }` | 切换按钮图标（可见时显示 EyeOff，默认显示 Eye） |

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`：

<DemoPreview file="password-input/PasswordInputFormDemo.vue" />
