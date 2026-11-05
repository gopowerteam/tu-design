---
title: 组件总览
description: tu-design 全部组件的分类总览与快速入口。
---

# 组件总览

tu-design 按用途将组件分为四类：**基础组件**、**表单组件**、**交互组件** 与 **高阶组件**。所有组件均以源码形式分发，通过 CLI `npx @tu-design/cli add <name>` 安装到你的项目；点击卡片查看各组件的完整文档。

## 基础组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**Alert** 警告提示<br><span>语义化警示条，支持五种变体、内置图标与可关闭交互。</span>](/components/alert)
[**Avatar** 头像<br><span>头像，含图片加载与回退（Ark UI）。</span>](/components/avatar)
[**AvatarGroup** 头像组<br><span>头像组，数量折叠、悬停展开与垂直排列。</span>](/components/avatar-group)
[**Badge** 徽章<br><span>轻量状态徽标，支持四种变体。</span>](/components/badge)
[**Button** 按钮<br><span>带变体与尺寸，支持 `as` 与 `asChild` 组合。</span>](/components/button)
[**Calendar** 日历<br><span>紧凑日历卡，standalone / embedded 双形态。</span>](/components/calendar)
[**Card** 卡片<br><span>卡片容器族：Header/Title/Description/Content/Footer。</span>](/components/card)
[**Empty** 空状态<br><span>空状态占位，含默认插画与描述文案。</span>](/components/empty)
[**Progress** 进度条<br><span>基于 Ark UI Progress 原语，支持语义色、标签与百分比显示、不确定态。</span>](/components/progress)
[**Separator** 分隔线<br><span>分隔线，支持水平与垂直方向。</span>](/components/separator)
[**Skeleton** 骨架屏<br><span>加载占位骨架屏。</span>](/components/skeleton)
[**Spin** 加载中<br><span>加载中旋转指示器，支持独立 spinner 与包裹内容（半透明遮罩）两种形态。</span>](/components/spin)
[**Toast** 轻提示<br><span>全局命令式轻提示：Provider 一次挂载，useToast() 随处调用，语义 type 自动映射主题色。</span>](/components/toast)

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

[**AlertDialog** 确认弹窗<br><span>模态确认弹窗一体式单组件，确认/取消双按钮，支持危险操作语义与异步确认锁定。</span>](/components/alert-dialog)
[**Dialog** 对话框<br><span>模态对话框，焦点圈定与进出场动画。</span>](/components/dialog)
[**Drawer** 抽屉<br><span>从四方向滑出的侧边/顶底面板单组件，进出场动画随方向自适应，内置焦点圈定与遮罩点击关闭。</span>](/components/drawer)
[**ContextMenu** 右键菜单<br><span>单组件模式的右键菜单，items 与 DropdownMenu 同构，右键唤出并定位到指针处。</span>](/components/context-menu)
[**DropdownMenu** 下拉菜单<br><span>键盘导航与 typeahead 高亮的下拉菜单。</span>](/components/dropdown-menu)
[**Popconfirm** 气泡确认<br><span>轻量气泡确认框，点击触发元素弹出，支持异步确认与危险操作变体。</span>](/components/popconfirm)
[**Popover** 气泡<br><span>点击触发的气泡弹层，受控/非受控开关。</span>](/components/popover)
[**Tabs** 标签页<br><span>选项卡，支持键盘导航与双模式受控。</span>](/components/tabs)
[**Tooltip** 文字提示<br><span>悬停或键盘聚焦触发的文字气泡。</span>](/components/tooltip)

</div>

## 高阶组件

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:rounded-lg [&>a]:border [&>a]:border-[var(--vp-c-divider)] [&>a]:px-4 [&>a]:py-3 [&>a]:text-sm [&>a]:leading-6 [&>a]:transition-colors [&>a]:no-underline! [&>a]:text-[var(--vp-c-text-1)]! [&>a:hover]:border-[var(--vp-c-brand-1)] [&_span]:text-[var(--vp-c-text-2)]">

[**FormRender** 表单渲染器<br><span>`defineForm` 配置驱动，Tailwind 栅格自适应布局。</span>](/components/form-render)

[**TableRender** 表格渲染器<br><span>`defineTable` 配置驱动表格，分页/排序/行选择/虚拟滚动开箱即用。</span>](/components/table-render)

[**Timeline** 时间轴<br><span>数据驱动 items 渲染竖向事件流，支持单列/左右交替布局与语义节点色。</span>](/components/timeline)

</div>
