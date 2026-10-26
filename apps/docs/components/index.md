---
title: 组件总览
description: tu-design 全部组件的分类总览与快速入口。
---

# 组件总览

tu-design 按用途将组件分为四类：**基础组件**、**表单组件**、**交互组件** 与 **高阶组件**。所有组件均以源码形式分发，通过 CLI `npx tu-design add <name>` 安装到你的项目；点击卡片查看各组件的完整文档。

## 基础组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**Avatar** 头像<br><span>头像，含图片加载与回退（Ark UI）。</span>](/components/avatar)
[**Badge** 徽章<br><span>轻量状态徽标，支持四种变体。</span>](/components/badge)
[**Button** 按钮<br><span>带变体与尺寸，支持 `as` 与 `asChild` 组合。</span>](/components/button)
[**Calendar** 日历<br><span>紧凑日历卡，standalone / embedded 双形态。</span>](/components/calendar)
[**Card** 卡片<br><span>卡片容器族：Header/Title/Description/Content/Footer。</span>](/components/card)
[**Separator** 分隔线<br><span>分隔线，支持水平与垂直方向。</span>](/components/separator)
[**Skeleton** 骨架屏<br><span>加载占位骨架屏。</span>](/components/skeleton)

</div>

## 表单组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**Form** 表单<br><span>TanStack Form + Valibot 校验的表单家族。</span>](/components/form)
[**Cascader** 级联选择<br><span>多列联动面板，一站式 props 驱动，支持单/多选。</span>](/components/cascader)
[**Checkbox** 多选框<br><span>复选框，标签点击同样可切换。</span>](/components/checkbox)
[**CurrencyInput** 金额输入<br><span>万/元/角/分单位后缀与自动换算。</span>](/components/currency-input)
[**DatePicker** 日期选择<br><span>输入框 + 日历弹层，`yyyy-MM-dd` 字符串受控。</span>](/components/date-picker)
[**DateRangePicker** 日期范围<br><span>双月弹层点选起止，有序元组受控。</span>](/components/date-range-picker)
[**MonthPicker** 月份<br><span>锁定月视图的月份选择器。</span>](/components/month-picker)
[**WeekPicker** 周<br><span>点选归一整周并高亮所在周。</span>](/components/week-picker)
[**YearPicker** 年份<br><span>锁定年视图的年份选择器。</span>](/components/year-picker)
[**Input** 输入框<br><span>文本输入框，支持 `v-model` 与 attrs 透传。</span>](/components/input)
[**Label** 标签<br><span>表单标签。</span>](/components/label)
[**NumberInput** 数字输入<br><span>内置加减步进按钮与数值边界。</span>](/components/number-input)
[**PasswordInput** 密码输入<br><span>内置明文/掩码切换按钮。</span>](/components/password-input)
[**PinInput** 验证码输入<br><span>多格 OTP 输入，自动跳格与粘贴分发。</span>](/components/pin-input)
[**RadioGroup** 单选组<br><span>单选组，键盘 `↑`/`↓` 导航。</span>](/components/radio-group)
[**Select** 选择器<br><span>下拉选择框，内置键盘导航与选中回显。</span>](/components/select)
[**Slider** 滑块<br><span>支持单值与区间、键盘微调。</span>](/components/slider)
[**Switch** 开关<br><span>开关切换，`data-[state]` 动效驱动。</span>](/components/switch)
[**Textarea** 文本域<br><span>多行文本输入，支持 invalid 校验态。</span>](/components/textarea)
[**TreeSelect** 树选择<br><span>树形下拉，勾选级联与搜索过滤。</span>](/components/tree-select)

</div>

## 交互组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**Dialog** 对话框<br><span>模态对话框，焦点圈定与进出场动画。</span>](/components/dialog)
[**DropdownMenu** 下拉菜单<br><span>键盘导航与 typeahead 高亮的下拉菜单。</span>](/components/dropdown-menu)
[**Popover** 气泡<br><span>点击触发的气泡弹层，受控/非受控开关。</span>](/components/popover)
[**Tabs** 标签页<br><span>选项卡，支持键盘导航与双模式受控。</span>](/components/tabs)
[**Tooltip** 文字提示<br><span>悬停或键盘聚焦触发的文字气泡。</span>](/components/tooltip)

</div>

## 高阶组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**FormRender** 表单渲染器<br><span>`defineForm` 配置驱动，Tailwind 栅格自适应布局。</span>](/components/form-render)

</div>
