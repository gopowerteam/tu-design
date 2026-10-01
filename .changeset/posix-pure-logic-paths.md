---
"@tu-design/cli": patch
---

fix: CLI 纯逻辑层统一 POSIX 路径。修复 Windows 下 `findProjectRoot` 向上查找立即跳到根目录、导致 monorepo 子目录场景误报"请先运行 init"的问题；`resolveTarget` 改为 POSIX join（原 `path.join` 在 Windows 产出反斜杠路径）。真实文件系统操作仍由 node IO 兜底（Windows fs 接受 `/`）。
