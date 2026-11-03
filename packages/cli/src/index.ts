#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import picocolors from "picocolors";
import { nodeIo, nodeNpmChannel } from "./io/node";
import { DEFAULT_REGISTRY, loadConfig } from "./lib/config";
import { runInit, RUNTIME_DEPS } from "./lib/init-core";
import { runAdd } from "./lib/add-core";
import { diffComponents } from "./lib/diff-core";
import type { DiffStatus } from "./lib/diff-core";
import { findProjectRoot } from "./lib/write";
import { detectPackageManagerForProject, installDependencies, type ExecIo } from "./lib/pm";
import { resolveRegistryUrl } from "./lib/registry";
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
  .command("add [components...]")
  .description("添加组件源码到项目（--all 时省略组件名，升级 components.lock.json 记录的全部组件）")
  .option("--registry <url>", "覆盖 components.json 中的 registry URL")
  .option("--overwrite", "覆盖已存在的文件而不询问")
  .option("--dry-run", "预览模式：报告将写入/覆盖/已最新的文件，不实际写入")
  .option("--all", "全量升级 components.lock.json 记录的全部组件（与组件名互斥）")
  .option("--no-install", "跳过依赖安装，仅输出依赖清单（workspace:/catalog: 协议场景）")
  .option("--relative-imports", "把写入源码中的 @/ alias 导入改写为相对导入")
  .action(
    async (
      components: string[],
      opts: {
        registry?: string;
        overwrite?: boolean;
        dryRun?: boolean;
        all?: boolean;
        install: boolean;
        relativeImports?: boolean;
      },
    ) => {
      const cwd = process.cwd();
      try {
        if (components.length === 0 && opts.all !== true) {
          throw new Error("请指定组件名，或使用 --all 全量升级 lockfile 记录的全部组件");
        }
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
          dryRun: opts.dryRun,
          all: opts.all,
          noInstall: opts.install === false,
          relativeImports: opts.relativeImports,
          npm: nodeNpmChannel,
          // 仅 TTY 注入询问；非 TTY 不注入 → writeFiles 归入 conflicts（警告 + 退出码 1），
          // 而不是静默跳过且成功退出。
          confirm: process.stdin.isTTY
            ? async (msg) => {
                const { default: prompts } = await import("prompts");
                const r = await prompts({
                  type: "confirm",
                  name: "ok",
                  message: msg,
                  initial: false,
                });
                return r.ok === true;
              }
            : undefined,
        });
        if (summary.dryRun) {
          console.log("ℹ dry-run：未写入任何文件");
          const fresh = summary.files.filter((f) => !summary.overwrites.includes(f));
          if (fresh.length > 0) {
            console.log("将写入：");
            for (const f of fresh) {
              console.log(`  ${f}`);
            }
          }
          if (summary.overwrites.length > 0) {
            console.log("将覆盖：");
            for (const f of summary.overwrites) {
              console.log(`  ${f}`);
            }
          }
          if (summary.upToDate.length > 0) {
            console.log("已最新（跳过）：");
            for (const f of summary.upToDate) {
              console.log(`  ${f}`);
            }
          }
          const willInstall = [...summary.dependencies, ...summary.devDependencies];
          if (willInstall.length > 0) {
            console.log(
              opts.install === false
                ? `ℹ --no-install：请自行安装依赖：${willInstall.join(" ")}`
                : `ℹ 将安装依赖（dry-run 未执行）：${willInstall.join(" ")}`,
            );
          }
          return;
        }
        if (summary.files.length > 0) {
          console.log("✔ 写入文件：");
          for (const f of summary.files) {
            console.log(`  ${f}`);
          }
        } else {
          console.log("ℹ 没有写入任何文件（可能已最新或全部跳过）");
        }
        if (summary.upToDate.length > 0) {
          console.log("ℹ 已是最新（跳过）：");
          for (const f of summary.upToDate) {
            console.log(`  ${f}`);
          }
        }
        if (summary.declined.length > 0) {
          console.log("ℹ 已拒绝覆盖：");
          for (const f of summary.declined) {
            console.log(`  ${f}`);
          }
        }
        if (summary.conflicts.length > 0) {
          console.log(
            picocolors.yellow(
              `⚠ ${summary.conflicts.length} 个文件本地有改动且未覆盖；非交互环境如需覆盖请加 --overwrite`,
            ),
          );
          for (const f of summary.conflicts) {
            console.log(picocolors.yellow(`  ${f}`));
          }
          process.exitCode = 1;
        }
        for (const d of summary.dependencies) {
          console.log(`✔ 依赖 ${picocolors.cyan(d)}`);
        }
        for (const d of summary.devDependencies) {
          console.log(`✔ 开发依赖 ${picocolors.cyan(d)}`);
        }
        if (opts.install === false) {
          const pending = [...summary.dependencies, ...summary.devDependencies];
          if (pending.length > 0) {
            console.log(`ℹ --no-install：请自行安装依赖：${pending.join(" ")}`);
          }
        }
      } catch (error) {
        console.error(
          picocolors.red(`✖ ${error instanceof Error ? error.message : String(error)}`),
        );
        process.exitCode = 1;
      }
    },
  );

/** diff 状态的中文标签（展示层职责，纯逻辑层只产英文枚举）。 */
const DIFF_STATUS_LABELS: Record<DiffStatus, string> = {
  "up-to-date": "最新",
  updatable: "可更新",
  modified: "本地已改",
  conflict: "冲突",
  missing: "缺失",
  different: "不一致(未跟踪)",
};

program
  .command("diff [components...]")
  .description("比对本地组件与线上 registry（无参数时比对 components.lock.json 记录的全部组件）")
  .option("--registry <url>", "覆盖 components.json 中的 registry URL")
  .action(async (components: string[] | undefined, opts: { registry?: string }) => {
    const cwd = process.cwd();
    try {
      const diffIo: typeof nodeIo & { fetchJson(url: string): Promise<unknown> } = {
        ...nodeIo,
        async fetchJson(url) {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${url}`);
          }
          return res.json();
        },
      };
      const root = findProjectRoot(nodeIo, cwd);
      const config = loadConfig(nodeIo, root);
      const registryUrl = resolveRegistryUrl(config, opts.registry);
      const names = components && components.length > 0 ? components : undefined;
      const diffs = await diffComponents(
        diffIo,
        diffIo,
        registryUrl,
        nodeNpmChannel,
        root,
        config,
        names,
      );

      if (diffs.length === 0) {
        console.log("ℹ 没有可比对的组件（components.lock.json 不存在或为空；可指定组件名）");
        return;
      }

      const counts = new Map<DiffStatus, number>();
      for (const d of diffs) {
        const localPart = d.legacy ? "本地未跟踪(legacy)" : `本地 ${d.localVersion ?? "-"}`;
        console.log(`▸ ${d.name}（线上 ${d.remoteVersion ?? "-"} / ${localPart}）`);
        for (const f of d.files) {
          console.log(`  ${DIFF_STATUS_LABELS[f.status]}  ${f.target}`);
          counts.set(f.status, (counts.get(f.status) ?? 0) + 1);
        }
        if (d.error !== undefined) {
          console.log(picocolors.yellow(`  ⚠ 获取失败：${d.error}`));
        }
      }

      const stat = (Object.keys(DIFF_STATUS_LABELS) as DiffStatus[])
        .filter((s) => (counts.get(s) ?? 0) > 0)
        .map((s) => `${DIFF_STATUS_LABELS[s]} ${counts.get(s)}`)
        .join("，");
      if (stat.length > 0) {
        console.log(`ℹ 统计：${stat}`);
      }

      const affected = diffs
        .filter((d) =>
          d.files.some(
            (f) => f.status === "updatable" || f.status === "conflict" || f.status === "missing",
          ),
        )
        .map((d) => d.name);
      if (affected.length > 0) {
        console.log(`ℹ 更新：npx @tu-design/cli add ${affected.join(" ")} --overwrite`);
      }
      if ((counts.get("conflict") ?? 0) > 0) {
        console.log(
          picocolors.yellow(
            "⚠ 冲突文件：本地、上次安装、线上三者互不相同，建议先 git diff 人工比对再覆盖",
          ),
        );
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
