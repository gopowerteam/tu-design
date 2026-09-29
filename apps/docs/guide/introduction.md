# 介绍

tu-design 是一个 [shadcn/ui](https://ui.shadcn.com) 思路的 **Vue 3 组件注册表（registry）**：组件不是黑盒 npm 依赖，而是通过 CLI 把**源码直接拷贝**进你的项目，你拥有全部代码，随意修改。

## 特性

- **源码交付**：`npx tu-design add <name>` 将组件源码写入 `components/ui/<name>/`，无运行时依赖绑定
- **Tailwind CSS 4**：组件样式由 utility class 与 CSS 变量（shadcn 风格 tokens，oklch 色彩空间）驱动
- **明暗模式**：`<html>` 上切换 `.dark` class 即可翻转全部主题变量
- **无头交互**：交互类组件（如 Avatar）基于 [Ark UI Vue](https://ark-ui.com) 的无头实现，可访问性开箱即用
- **registry 规范**：registry JSON 遵循 shadcn [registry-item schema](https://ui.shadcn.com/schema/registry-item.json)，工具链兼容

## 工作方式

1. 在你的项目完成一次性安装配置（见[安装](/guide/installation)）
2. 用 CLI 添加需要的组件（见 [CLI](/guide/cli)）
3. 组件源码落在你手里，按需改造

## 当前组件

组件清单见左侧「组件」分组：Avatar、Badge、Button、Card、Input、Label、Separator、Skeleton。
