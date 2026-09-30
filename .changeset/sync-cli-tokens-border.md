---
"@tu-design/cli": patch
---

fix: init 写出的 tokens.css 同步全局边框色兜底（`@layer base { * { border-color: var(--color-border); } }`），修复内嵌 TOKENS_CSS_SOURCE 与 @tu-design/vue tokens.css 的漂移
