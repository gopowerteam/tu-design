/**
 * init 注入到用户项目根目录 AGENTS.md 的 AI 协作规则。
 * 目的：让 AI 编码代理遵循 tu-design 的组件安装 / 导入 / 主题约定，
 * 而不是手写组件源码或硬编码样式，绕开 registry 分发链路。
 */
export const AGENTS_MD_SOURCE = `# tu-design AI 协作规则

本项目使用 tu-design（shadcn 风格 Vue 3 组件库），AI 协作约定如下：

## 组件安装

- 组件必须通过 CLI 安装：在项目根目录执行 \`npx @tu-design/cli add <name>\`，禁止手写组件源码。
- 首次接入先安装基础项：\`npx @tu-design/cli add utils tokens\`。

## 导入约定

- 组件经 unplugin-vue-components + \`TuDesignResolver\` 自动导入，模板直接写 \`<Button />\`，无需手动 import。
- \`cn\` 来自 \`@/lib/utils\`。

## 主题约定

- 颜色/圆角一律使用语义 token 类（\`bg-primary\`、\`text-muted-foreground\`、\`rounded-md\`），禁止硬编码十六进制色值。
- 暗色模式由 \`.dark\` class 驱动。

## 参考资料

- 完整组件清单：https://gopowerteam.github.io/tu-design/llms.txt（可整页抓取给 AI）
- 全量文档：https://gopowerteam.github.io/tu-design/llms-full.txt（可整页抓取给 AI）
`;
