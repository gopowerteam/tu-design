# 组件更新端到端测试（playground）

用**真实 CLI 产物**（`packages/cli/dist/index.mjs`）+ 本地假 registry + stub 包管理器，
对「组件发布修复 → 安装项目更新」的完整链路做端到端验证。

## 运行

```bash
# 前置：CLI 需要先构建（仓库根执行过 pnpm build 或 vp run ready 即可）
bash apps/playground/component-update/run-tests.sh
```

脚本自包含：每次运行重建 `mock-registry/`（拷贝 `packages/vue/registry/vue`）与两个模拟用户项目
（`fake-project/`、`fake-project-legacy/`），退出码 = 失败断言数，可作回归脚本反复执行。

## 测试矩阵（12 组场景）

| 场景                          | 验证点                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| T1 首次 `add --dry-run`       | 纯预览：输出将写入清单，不落盘、不写 lockfile                                                         |
| T2 首次 `add`                 | 源码写入、`registryDependencies` 拓扑（utils/slot）、lockfile 记录版本、依赖安装                      |
| T3 重复 `add`                 | 内容相同静默跳过（幂等）、lockfile 不变                                                               |
| T4 干净态 `diff`              | 全部「最新」，无可更新/冲突/缺失                                                                      |
| T5 本地改动                   | diff「本地已改」；非 TTY 无 `--overwrite` → 警告 + 退出码 1；`--overwrite` 覆盖；跳过时 lockfile 不动 |
| T6 线上发布新版               | 「可更新」→ dry-run 预览将覆盖 → 覆盖后 lockfile 版本升级                                             |
| T7 本地与线上都变             | 「冲突」+ git diff 提示 → 非 TTY 退出码 1 → `--overwrite` 解决                                        |
| T8 本地缺文件                 | 「缺失」→ `add --overwrite` 补齐                                                                      |
| T9 legacy 项目（无 lockfile） | 降级两方对比「不一致(未跟踪)」→ 安装后建立 lockfile                                                   |
| T10 不存在的组件              | 单组件获取失败不中断，退出码恒 0                                                                      |
| T11 lockfile 损坏             | 明确报错点名文件，不静默当空                                                                          |
| T12 多组件拓扑安装            | badge/utils/tokens 各自记录版本，全量 diff 干净                                                       |

## 组成部分

- `serve-registry.mjs` — 静态伺服 mock-registry（模拟 GitHub Pages 线上 registry）
- `bin/pnpm` — stub 包管理器：记录安装命令后直接成功，隔离真实网络
- `run-tests.sh` — 全部场景与断言
- `bump_registry()`（脚本内函数）— 模拟一次线上发布：改 version + 改 Button.vue 内容

生成物（mock-registry / fake-project* / 日志）不入库，见 `.gitignore`。
