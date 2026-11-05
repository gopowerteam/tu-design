import { defineConfig } from "vite-plus";
import { defineLintConfig, jsdocFragment, repoJsdocPlugin } from "@tu-design/config-lint/config";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: defineLintConfig(
    // base：项目自有规则，永远放最前；后续新片段（分层依赖、Vue 专属等）依次追加
    {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }, repoJsdocPlugin],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    jsdocFragment,
  ),
  run: {
    cache: true,
  },
  test: {
    projects: [
      "packages/vue/vitest.config.ts",
      "packages/cli/vite.config.ts",
      "packages/config-lint/vitest.config.ts",
    ],
  },
});
