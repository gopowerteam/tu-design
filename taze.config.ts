// taze 为全局安装，本地无 taze 包可 import，故不用 defineConfig，直接默认导出
export default {
  // 升到最新稳定大版本（含 breaking），npm 安装统一手动走 vp install
  mode: "major",
  includeLocked: true,
  recursive: true,
  install: false,

  // 保护测试 fixture 与 VitePress 缓存生成物
  ignorePaths: ["**/node_modules/**", "apps/playground/**", "apps/docs/.vitepress/**"],

  // devEngines.packageManager 的 pnpm 属环境契约（AGENTS.md 明确钉死 12.6.0），不随依赖升级；
  // typescript@7 段整体拒绝（TS7 native 暂无法被 vue-tsc 解析，见 catalog 注释），6.x 内仍正常升级
  exclude: ["pnpm", "typescript@7"],

  packageMode: {
    // 钉在 2.0 alpha 线：major 模式会解析到 stable 1.x（降级），必须用 latest 跟随 alpha
    vitepress: "latest",
  },
};
