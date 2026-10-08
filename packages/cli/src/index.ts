#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import picocolors from "picocolors";
import { detect } from "package-manager-detector";
import { nodeIo, nodeNpmChannel } from "./io/node";
import { DEFAULT_REGISTRY } from "./lib/config";
import { runInit } from "./lib/init-core";
import { runAdd } from "./lib/add-core";
import { detectPackageManager, installDependencies, type ExecIo } from "./lib/pm";
import { parsePkgVersion } from "./lib/version";

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

program
  .name("tu-design")
  .description("tu-design 组件 registry CLI")
  // 版本号从包根 package.json 读取（原硬编码 0.0.0 与发版脱节）。
  // 读取须留在 src/index.ts 层级：源码（src/../package.json）与打包产物
  // （dist/../package.json）相对包根深度一致，抽到 lib/ 后打包路径会多一层。
  .version(parsePkgVersion(readFileSync(new URL("../package.json", import.meta.url), "utf8")));

program
  .command("init")
  .description("初始化 components.json 并注入基础依赖与样式 tokens")
  .option("--registry <url>", "registry URL 通道", DEFAULT_REGISTRY)
  .option("--css <path>", "全局 CSS 路径（默认自动探测常见位置）")
  .action(async (opts: { registry: string; css?: string }) => {
    const cwd = process.cwd();
    try {
      const summary = runInit(nodeIo, cwd, {
        registry: opts.registry,
        css: opts.css,
      });
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
      console.error(picocolors.red(`✖ ${error instanceof Error ? error.message : String(error)}`));
      process.exitCode = 1;
    }
  });

program
  .command("add <components...>")
  .description("添加组件源码到项目")
  .option("--registry <url>", "覆盖 components.json 中的 registry URL")
  .option("--overwrite", "覆盖已存在的文件而不询问")
  .action(async (components: string[], opts: { registry?: string; overwrite?: boolean }) => {
    const cwd = process.cwd();
    try {
      const addIo: typeof nodeIo & {
        fetchJson(url: string): Promise<unknown>;
        exec(cmd: string[]): void;
      } = {
        ...nodeIo,
        async fetchJson(url) {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${url}`);
          }
          return res.json();
        },
        exec(cmd) {
          const result = spawnSync(cmd[0]!, cmd.slice(1), {
            cwd,
            stdio: "inherit",
          });
          if (result.status !== 0) {
            throw new Error(`命令执行失败：${cmd.join(" ")}`);
          }
        },
      };
      const summary = await runAdd(addIo, cwd, components, {
        registry: opts.registry,
        overwrite: opts.overwrite,
        npm: nodeNpmChannel,
        confirm: async (msg) => {
          if (!process.stdin.isTTY) {
            return false;
          }
          const { default: prompts } = await import("prompts");
          const r = await prompts({
            type: "confirm",
            name: "ok",
            message: msg,
            initial: false,
          });
          return r.ok === true;
        },
      });
      if (summary.files.length > 0) {
        console.log("✔ 写入文件：");
        for (const f of summary.files) {
          console.log(`  ${f}`);
        }
      } else {
        console.log("ℹ 没有写入任何文件（可能全部跳过）");
      }
      for (const d of summary.dependencies) {
        console.log(`✔ 依赖 ${picocolors.cyan(d)}`);
      }
      for (const d of summary.devDependencies) {
        console.log(`✔ 开发依赖 ${picocolors.cyan(d)}`);
      }
    } catch (error) {
      console.error(picocolors.red(`✖ ${error instanceof Error ? error.message : String(error)}`));
      process.exitCode = 1;
    }
  });

program.parse();
