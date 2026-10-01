---
"@tu-design/vue": minor
---

新增 `Slot` 组合原语（registry 项 `slot`）：把组件的 class 与 attrs 合并到默认插槽的第一个元素子节点上而不渲染额外 DOM——自动展平 `<slot />` 转发产生的 Fragment，子元素自身 props 优先、class 经 cn 冲突合并、事件链式触发。`Button` 新增 `asChild` 属性（与 `as` 互补，asChild 优先），为交互组件批次的组合范式奠基；自动导入白名单同步支持 `<TSlot>`。
