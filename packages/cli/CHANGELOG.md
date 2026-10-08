# @tu-design/cli

## 0.1.1

### Patch Changes

- 45cfe65: 补齐 npm 发布元数据：新增 MIT LICENSE 文件，两包 package.json 补充 description / license / keywords / repository / homepage / bugs 字段。
- 修正默认 registry URL 占位符为 gopowerteam.github.io 实际地址；`--version` 改为从 package.json 读取真实版本（原硬编码 0.0.0 与发版脱节）。
- 7727a07: fix: CLI 纯逻辑层统一 POSIX 路径。修复 Windows 下 `findProjectRoot` 向上查找立即跳到根目录、导致 monorepo 子目录场景误报"请先运行 init"的问题；`resolveTarget` 改为 POSIX join（原 `path.join` 在 Windows 产出反斜杠路径）。真实文件系统操作仍由 node IO 兜底（Windows fs 接受 `/`）。
- a601b07: fix: init 写出的 tokens.css 同步全局边框色兜底（`@layer base { * { border-color: var(--color-border); } }`），修复内嵌 TOKENS_CSS_SOURCE 与 @tu-design/vue tokens.css 的漂移
- Updated dependencies [45cfe65]
- Updated dependencies [da3fa3b]
- Updated dependencies [cb5a03a]
- Updated dependencies [6ca1f4b]
- Updated dependencies [ea8fab5]
- Updated dependencies [da3fa3b]
- Updated dependencies [1c747a1]
- Updated dependencies [da3fa3b]
- Updated dependencies [8540fa7]
- Updated dependencies [da3fa3b]
- Updated dependencies [1c747a1]
- Updated dependencies [3d7b6f9]
- Updated dependencies [6ca1f4b]
  - @tu-design/vue@0.2.0

## 0.1.0

### Minor Changes

- 首个公开预览版：8 个基础组件（Button/Badge/Card/Separator/Skeleton/Input/Label/Avatar）、registry 双通道分发（npm + URL）、`tu-design init` / `tu-design add` CLI。

### Patch Changes

- Updated dependencies
  - @tu-design/vue@0.1.0
