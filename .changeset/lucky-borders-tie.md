---
"@tu-design/vue": minor
---

tokens.css 新增全局边框色兜底：`@layer base { * { border-color: var(--color-border); } }`，对齐 shadcn v4 官方 tokens。组件代码中的裸 `border` 类不再回退 currentColor，自动使用 `--border` token。
