---
"@tu-design/vue": minor
---

新增 Dialog 模态对话框组件族（registry 项 `dialog`，依赖 `@ark-ui/vue`）：Dialog（支持 `v-model:open`，非受控语义由组件内部实现，规避 Boolean prop casting 与 zag uncontrolled 状态同步问题）/ DialogTrigger / DialogContent（含 Backdrop、居中定位与内置关闭按钮）/ DialogHeader / DialogTitle / DialogDescription / DialogFooter / DialogClose。Trigger 与 Close 支持 `asChild`；进出场动画基于 `data-[state]` + tw-animate-css；自动导入白名单同步扩展。
