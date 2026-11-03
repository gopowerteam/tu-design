import { defineConfig } from "bumpp";

export default defineConfig({
  recursive: true,
  // 关键：release commit 以 git add --all 暂存全部变更，
  // execute 钩子再生成的 registry 产物（内嵌版本号）才能一并进入 release commit。
  all: true,
  tag: "v{version}",
  commit: "chore: 🔖 release v{version}",
  // bumpp 的 execute 不经 shell（tokenizeArgs 直 spawn），不能写 `cd x && y`；
  // vp run -r 只会在定义了该 script 的包（packages/vue）目录下执行。
  execute: "vp run -r generate:registry",
  // 版本由 pnpm release <version> 显式传入，关闭交互确认（脚本/CI 环境安全）。
  confirm: false,
});
