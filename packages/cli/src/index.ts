#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import picocolors from "picocolors";
import { nodeIo, nodeNpmChannel } from "./io/node";
import { DEFAULT_REGISTRY } from "./lib/config";
import { runInit, RUNTIME_DEPS } from "./lib/init-core";
import { runAdd } from "./lib/add-core";
import { detectPackageManagerForProject, installDependencies, type ExecIo } from "./lib/pm";
import { parsePkgVersion } from "./lib/version";
import type { RegistryFetcher } from "./lib/registry";

/** 唯一的子进程执行实现：init / add 都走它，失败原因由 stdio 直接透传给用户。 */
function execIn(cwd: string): (cmd: string[]) => void {
  return (cmd) => {
    const result = spawnSync(cmd[0]!, cmd.slice(1), { cwd, stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`命令执行失败：${cmd.join(" ")}`);
    }
  };
}

function makeExecIo(cwd: string): ExecIo {
  return { ...nodeIo, exec: execIn(cwd) };
}

const program = new Command();

// 版本号读取留在 src/index.ts 层级（src/... 与 dist/... 相对包根深度一致，见下）；MCP Server 复用。
const PKG_VERSION = parsePkgVersion(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

program.name("tu-design").description("tu-design 组件 registry CLI").version(PKG_VERSION);

program
  .command("init")
  .description("初始化 components.json 并注入基础依赖与样式 tokens")
  .option("--registry <url>", "registry URL 通道", DEFAULT_REGISTRY)
  .option("--css <path>", "全局 CSS 路径（默认自动探测常见位置）")
  .option("--no-agents", "不写入 AGENTS.md AI 协作规则")
  .action(async (opts: { registry: string; css?: string; agents: boolean }) => {
    const cwd = process.cwd();
    try {
      const summary = runInit(nodeIo, cwd, {
        registry: opts.registry,
        css: opts.css,
        agents: opts.agents,
      });
      console.log(`✔ 已写入 ${summary.configPath}`);
      console.log(`✔ 已注入 cn 工具 ${summary.cnPath}`);
      console.log(
        summary.skippedCss
          ? `ℹ ${summary.cssPath} 已包含 tokens，跳过`
          : `✔ 已合并 tokens 至 ${summary.cssPath}`,
      );
      if (summary.skippedAgents) {
        console.log(
          opts.agents === false ? "ℹ 已按 --no-agents 跳过 AGENTS.md" : "ℹ AGENTS.md 已存在，跳过",
        );
      } else {
        console.log("✔ 已写入 AGENTS.md（AI 协作规则）");
      }
      const pm = detectPackageManagerForProject(nodeIo, cwd);
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
        exec: execIn(cwd),
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

/** MCP 错误统一转 isError 结果（stdout 只承载 JSON-RPC，消息文本放 content）。 */
function mcpError(error: unknown) {
  return {
    isError: true as const,
    content: [
      { type: "text" as const, text: error instanceof Error ? error.message : String(error) },
    ],
  };
}

function registryHttpFetcher(): RegistryFetcher {
  return {
    async fetchJson(url) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
      }
      return res.json();
    },
  };
}

program
  .command("mcp")
  .description("启动 MCP Server（stdio，仅查询组件 registry）")
  .option("--registry <url>", "registry URL 通道", DEFAULT_REGISTRY)
  .action(async (opts: { registry: string }) => {
    // stdout 是 JSON-RPC 协议通道，mcp 模式下一切日志必须走 console.error。
    const log = (msg: string) => console.error(msg);
    try {
      // SDK 与 zod 动态加载：init/add 路径不为 MCP 依赖付出冷启动代价。
      const [
        { McpServer },
        { StdioServerTransport },
        { z },
        { fetchRegistryIndex, searchComponents, getComponent },
      ] = await Promise.all([
        import("@modelcontextprotocol/sdk/server/mcp.js"),
        import("@modelcontextprotocol/sdk/server/stdio.js"),
        import("zod"),
        import("./lib/mcp-core"),
      ]);
      const fetcher = registryHttpFetcher();

      const server = new McpServer({ name: "tu-design", version: PKG_VERSION });

      server.registerTool(
        "list_components",
        { description: "列出全部 tu-design 组件（name / title / description）" },
        async () => {
          try {
            const list = await fetchRegistryIndex(fetcher, opts.registry);
            return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
          } catch (error) {
            return mcpError(error);
          }
        },
      );

      server.registerTool(
        "search_components",
        {
          description:
            "按关键字搜索 tu-design 组件（大小写不敏感，匹配 name / title / description）",
          inputSchema: { query: z.string().describe("搜索关键字，如 table、dialog、表格") },
        },
        async ({ query }) => {
          try {
            const results = await searchComponents(fetcher, opts.registry, query);
            return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
          } catch (error) {
            return mcpError(error);
          }
        },
      );

      server.registerTool(
        "get_component",
        {
          description:
            "获取单个 tu-design 组件的 registry 详情（内联源码 files、依赖、安装提示）；只查询，不安装",
          inputSchema: { name: z.string().describe("组件名，小写字母/数字/连字符，如 button") },
        },
        async ({ name }) => {
          try {
            const item = await getComponent(fetcher, opts.registry, name);
            return { content: [{ type: "text" as const, text: JSON.stringify(item, null, 2) }] };
          } catch (error) {
            return mcpError(error);
          }
        },
      );

      await server.connect(new StdioServerTransport());
      log("tu-design MCP server 运行中（stdio）");
    } catch (error) {
      log(`✖ ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

program.parse();
