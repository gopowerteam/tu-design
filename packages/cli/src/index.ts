#!/usr/bin/env node
import { Command } from "commander";
import picocolors from "picocolors";
import { DEFAULT_REGISTRY } from "./lib/config";
import { runInit } from "./lib/init-core";
import { nodeIo } from "./io/node";

const program = new Command();

program.name("tu-design").description("tu-design 组件 registry CLI").version("0.0.0");

program
  .command("init")
  .description("初始化 components.json 并注入基础依赖与样式 tokens")
  .option("--registry <url>", "registry URL 通道", DEFAULT_REGISTRY)
  .action((opts: { registry: string }) => {
    try {
      const summary = runInit(nodeIo, process.cwd(), { registry: opts.registry });
      console.log(`✔ 已写入 ${summary.configPath}`);
      console.log(`✔ 已注入 cn 工具 ${summary.cnPath}`);
      console.log(
        summary.skippedCss
          ? `ℹ ${summary.cssPath} 已包含 tokens，跳过`
          : `✔ 已合并 tokens 至 ${summary.cssPath}`,
      );
      console.log("ℹ 请安装依赖：clsx tailwind-merge class-variance-authority");
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
