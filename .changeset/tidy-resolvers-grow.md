---
"@tu-design/vue": minor
---

新增 `TuDesignResolver`，配合 unplugin-vue-components 实现组件自动导入：模板中免 import 直接使用 `<TButton>` / `<t-button>`。白名单与组件导出同步（单元测试强制校验），规避 Vue 内置组件（Transition/Teleport 等）误解析。
