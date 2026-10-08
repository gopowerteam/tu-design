# @tu-design/vue

## 0.2.0

### Minor Changes

- da3fa3b: 新增 Checkbox 复选框（registry 项 `checkbox`）：基于 Ark UI Checkbox 原语，`v-model:checked`（Boolean casting 规避同 Dialog）、HiddenInput/Control/Indicator/Label 全结构、标签插槽点击可切换。
- cb5a03a: 新增 Dialog 模态对话框组件族（registry 项 `dialog`，依赖 `@ark-ui/vue`）：Dialog（支持 `v-model:open`，非受控语义由组件内部实现，规避 Boolean prop casting 与 zag uncontrolled 状态同步问题）/ DialogTrigger / DialogContent（含 Backdrop、居中定位与内置关闭按钮）/ DialogHeader / DialogTitle / DialogDescription / DialogFooter / DialogClose。Trigger 与 Close 支持 `asChild`；进出场动画基于 `data-[state]` + tw-animate-css；自动导入白名单同步扩展。
- 6ca1f4b: 新增 DropdownMenu 下拉菜单组件族（registry 项 `dropdown-menu`）：DropdownMenu（`v-model:open` + `select` 事件）、DropdownMenuTrigger（asChild）、DropdownMenuContent、DropdownMenuItem（value/disabled，缺省自动生成 value）、DropdownMenuLabel、DropdownMenuSeparator、DropdownMenuGroup。
- ea8fab5: tokens.css 新增全局边框色兜底：`@layer base { * { border-color: var(--color-border); } }`，对齐 shadcn v4 官方 tokens。组件代码中的裸 `border` 类不再回退 currentColor，自动使用 `--border` token。
- da3fa3b: 新增 RadioGroup 单选组（registry 项 `radio-group`）：RadioGroup（`v-model:value`）+ RadioGroupItem（value/ItemText 插槽）。选中指示用 group variant CSS 实现（zag 无 item-indicator 拆件）。
- 1c747a1: 新增 Select 下拉选择组件族（registry 项 `select`，依赖 `@ark-ui/vue`）：Select（items 构建 collection，`v-model` 单选 string 语义——zag 内部数组表示已在包装层转换）、SelectTrigger（asChild + 内置 chevron）、SelectValueText、SelectContent、SelectItem（内置 ItemText 与勾选指示）。
- da3fa3b: 新增 Slider 滑块（registry 项 `slider`）：基于 Ark UI Slider 原语，`v-model` 恒为 number[]（单值/区间通用），HiddenInput 须渲染于 Thumb 内部（thumb props 上下文）。
- 8540fa7: 新增 `Slot` 组合原语（registry 项 `slot`）：把组件的 class 与 attrs 合并到默认插槽的第一个元素子节点上而不渲染额外 DOM——自动展平 `<slot />` 转发产生的 Fragment，子元素自身 props 优先、class 经 cn 冲突合并、事件链式触发。`Button` 新增 `asChild` 属性（与 `as` 互补，asChild 优先），为交互组件批次的组合范式奠基；自动导入白名单同步支持 `<TSlot>`。
- da3fa3b: 新增 Switch 开关（registry 项 `switch`）：基于 Ark UI Switch 原语，`v-model:checked`、滑块动效由 data-[state] + transition 驱动、标签插槽支持。
- 1c747a1: 新增 Tabs 选项卡组件族（registry 项 `tabs`）：Tabs（`v-model:value`，映射 Ark 的 modelValue）、TabsList、TabsTrigger（value/disabled）、TabsContent。激活态样式基于 zag 的 `data-[selected]`。
- 3d7b6f9: 新增 `TuDesignResolver`，配合 unplugin-vue-components 实现组件自动导入：模板中免 import 直接使用 `<TButton>` / `<t-button>`。白名单与组件导出同步（单元测试强制校验），规避 Vue 内置组件（Transition/Teleport 等）误解析。
- 6ca1f4b: 新增 Tooltip 文字提示组件族（registry 项 `tooltip`）：Tooltip（`v-model:open`、`delay-duration`/`close-duration`）、TooltipTrigger（asChild）、TooltipContent。内部映射 Ark 原语的 `openDelay`/`closeDelay`，公开 API 保持 shadcn 命名习惯。

### Patch Changes

- 45cfe65: 补齐 npm 发布元数据：新增 MIT LICENSE 文件，两包 package.json 补充 description / license / keywords / repository / homepage / bugs 字段。

## 0.1.0

### Minor Changes

- 首个公开预览版：8 个基础组件（Button/Badge/Card/Separator/Skeleton/Input/Label/Avatar）、registry 双通道分发（npm + URL）、`tu-design init` / `tu-design add` CLI。
