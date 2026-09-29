# CLI

通过 `npx tu-design add <name>` 把组件源码添加到你的项目：

```bash
npx tu-design add button
npx tu-design add avatar
npx tu-design add utils tokens   # 基础依赖
```

## 工作机制

CLI 从 registry 服务拉取组件的 **registry JSON**（遵循 [shadcn registry-item schema](https://ui.shadcn.com/schema/registry-item.json)），并将其中内联的文件内容写入你的项目：

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "button",
  "type": "registry:ui",
  "registryDependencies": ["utils"], // 先行安装的依赖项
  "dependencies": ["class-variance-authority@^0.7.1"], // 需要的 npm 依赖
  "files": [
    {
      "path": "button/Button.vue",
      "type": "registry:component",
      "target": "components/ui/button/Button.vue", // 写入位置
      "content": "…", // 源码内联
    },
  ],
}
```

## 依赖链

部分组件依赖基础项，CLI 会按 `registryDependencies` 自动先装：

| 项       | 作用                                                      |
| -------- | --------------------------------------------------------- |
| `utils`  | 生成 `lib/utils.ts` 的 `cn` 工具（clsx + tailwind-merge） |
| `tokens` | 生成 `tokens.css` 主题变量（shadcn 风格，oklch）          |

例如 `button` 声明了 `registryDependencies: ["utils"]`，`avatar` 基于 Ark UI 并声明相应 npm 依赖——首次添加组件时建议先手动补齐 `utils` 与 `tokens`。

## registry 数据源

registry JSON 由 tu-design 仓库维护（`packages/vue/registry/vue/`），文档站 dev 期以 `/r/vue/*.json` 提供中间件伺服、构建期随静态产物发布。
