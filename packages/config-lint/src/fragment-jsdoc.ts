import type { LintFragment, LintOverrides, LintRules } from "./define-lint-config.ts";

/**
 * jsdoc 结构规则集（oxlint 原生 jsdoc 插件 13 条 + 自研 require-jsdoc）。
 *
 * 取舍说明（TS 项目惯例）：
 * - 不启用 `require-param-type` / `require-returns-type`：TS 签名已有类型，JSDoc 重复标注纯冗余
 * - 不启用 `require-throws-*` / `require-property*`：throw 断言误报多、typedef 场景本项目未使用
 * - `require-param` / `require-param-description` / `require-returns` 等为核心完整性校验
 * - 自研 `require-jsdoc`（oxlint 原生未实现，oxc#1170）由 jsdoc-plugin.js 提供
 */
export const jsdocRules: LintRules = {
  "jsdoc/require-param": "error",
  "jsdoc/require-param-description": "error",
  "jsdoc/require-param-name": "error",
  "jsdoc/require-returns": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/require-yields": "error",
  "jsdoc/check-tag-names": "error",
  "jsdoc/check-access": "error",
  "jsdoc/check-property-names": "error",
  "jsdoc/empty-tags": "error",
  "jsdoc/no-blank-blocks": "error",
  "jsdoc/implements-on-classes": "error",
  "jsdoc/no-defaults": "error",
  "@tu-design/config-lint/require-jsdoc": "error",
};

/**
 * require-jsdoc 豁免清单（overrides，按片段顺序拼接在 base 之后）：
 * - 测试文件：测试名即文档；`require-*` 结构规则（@param/@returns 完整性）一并关闭
 *   ——测试内的 mock 工厂注释是行内说明而非 API 文档；保留 check-* 轻量拼写规范
 * - `.vue`：`<script setup>` 顶层绑定是组件内部实现而非模块 API；结构规则
 *   （require-param 等）对 `.vue` script 仍生效（实测），仅关闭强制 JSDoc
 * - `packages/config-lint/**`：规则自举（dogfooding）豁免，规则稳定后移除
 */
export const jsdocExemptOverrides: LintOverrides = [
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**"],
    rules: {
      "@tu-design/config-lint/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-name": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-yields": "off",
    },
  },
  {
    files: ["**/*.vue"],
    rules: { "@tu-design/config-lint/require-jsdoc": "off" },
  },
  {
    files: ["packages/config-lint/**"],
    rules: { "@tu-design/config-lint/require-jsdoc": "off" },
  },
];

/** jsdoc 片段：jsdoc 插件 + 结构规则 + settings + 豁免 overrides（插件注册项见 repoJsdocPlugin） */
export const jsdocFragment: LintFragment = {
  plugins: ["jsdoc"],
  rules: jsdocRules,
  settings: {
    jsdoc: { ignoreInternal: true, ignorePrivate: true },
  },
  overrides: jsdocExemptOverrides,
};

/** 自研插件注册项（specifier 形式，与 `vite-plus/oxlint-plugin` 同构；由 base 显式引用） */
export const repoJsdocPlugin = {
  name: "@tu-design/config-lint",
  specifier: "@tu-design/config-lint/jsdoc-plugin",
} as const;
