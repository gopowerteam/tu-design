#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { Command } from "commander";
import picocolors from "picocolors";
import { detect } from "package-manager-detector";
import { nodeIo } from "./io/node";
import { DEFAULT_REGISTRY } from "./lib/config";
import { runInit } from "./lib/init-core";
import { detectPackageManager, installDependencies, type ExecIo } from "./lib/pm";

const RUNTIME_DEPS = ["clsx", "tailwind-merge", "class-variance-authority"];

function makeExecIo(cwd: string): ExecIo {
  return {
    ...nodeIo,
    exec(cmd) {
      const result = spawnSync(cmd[0]!, cmd.slice(1), { cwd, stdio: "inherit" });
      if (result.status !== 0) {
        throw new Error(`命令执行失败：${cmd.join(" ")}`);
      }
    },
  };
}

const program = new Command();

program.name("tu-design").description("tu-design 组件 registry CLI").version("0.0.0");

program
  .command("init")
  .description("初始化 components.json 并注入基础依赖与样式 tokens")
  .option("--registry <url>", "registry URL 通道", DEFAULT_REGISTRY)
  .action(async (opts: { registry: string }) => {
    const cwd = process.cwd();
    try {
      const summary = runInit(nodeIo, cwd, { registry: opts.registry });
      console.log(`✔ 已写入 ${summary.configPath}`);
      console.log(`✔ 已注入 cn 工具 ${summary.cnPath}`);
      console.log(
        summary.skippedCss
          ? `ℹ ${summary.cssPath} 已包含 tokens，跳过`
          : `✔ 已合并 tokens 至 ${summary.cssPath}`,
      );
      const detected = await detect({ cwd });
      const pm = detectPackageManager(detected?.agent);
      console.log(`ℹ 使用 ${pm} 安装 ${RUNTIME_DEPS.join(" ")}`);
      installDependencies(makeExecIo(cwd), cwd, RUNTIME_DEPS, false, pm);
      console.log("✔ 依赖安装完成");
    } catch (error) {
      console.error(picocolors.red(`✖ ${error instanceof Error ? error.message : error}`));
      process.exitCode = 1;
    }
  });

program
  .command("add <components...>")
  .description("添加组件源码到项目")
  .option("--registry <url>", "覆盖 components.json 中的 registry URL")
  .option("--overwrite", "覆盖已存在的文件而不询问")
  .action(() => {
    console.log("TODO: add");
  });

program.parse();
