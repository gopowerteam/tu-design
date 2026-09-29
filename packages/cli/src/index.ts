#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program.name("tu-design").description("tu-design 组件 registry CLI").version("0.0.0");

program
  .command("init")
  .description("初始化 components.json 并注入基础依赖与样式 tokens")
  .option("--registry <url>", "registry URL 通道")
  .action(() => {
    console.log("TODO: init");
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
