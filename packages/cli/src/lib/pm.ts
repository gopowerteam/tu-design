import { parseJson } from "./json";
import type { Io } from "./io";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const PM_NAMES: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

/** agent 形如 "pnpm@9.15.0"；未知/缺失返回 null，由调用方决定降级方式。 */
export function parsePackageManager(agent: string | undefined): PackageManager | null {
  if (!agent) {
    return null;
  }
  const name = agent.split("@")[0] ?? agent;
  return (PM_NAMES as readonly string[]).includes(name) ? (name as PackageManager) : null;
}

/** agent 形如 "pnpm@9.15.0"；未知识别为 npm。 */
export function detectPackageManager(agent: string | undefined): PackageManager {
  return parsePackageManager(agent) ?? "npm";
}

/** 由 cwd 锁文件推断包管理器（纯 IO 路径，可在 memIo 下测试）。 */
export function detectPackageManagerFromLockfiles(io: Io, cwd: string): PackageManager {
  if (io.exists(`${cwd}/pnpm-lock.yaml`)) return "pnpm";
  if (io.exists(`${cwd}/yarn.lock`)) return "yarn";
  if (io.exists(`${cwd}/bun.lockb`) || io.exists(`${cwd}/bun.lock`)) return "bun";
  return "npm";
}

/**
 * 项目包管理器的唯一判定口径（init 与 add 共用，避免两条命令对同一项目给出不同答案）：
 * `packageManager` 字段（Corepack 声明的意图）优先，其次锁文件（实际使用证据），最后 npm。
 * package.json 缺失或不可解析时静默降级——报错是 init 自己的前置校验职责。
 */
export function detectPackageManagerForProject(io: Io, cwd: string): PackageManager {
  const pkgPath = `${cwd}/package.json`;
  if (io.exists(pkgPath)) {
    try {
      const raw = parseJson(io.readFile(pkgPath), "package.json") as { packageManager?: unknown };
      const declared = parsePackageManager(
        typeof raw.packageManager === "string" ? raw.packageManager : undefined,
      );
      if (declared) {
        return declared;
      }
    } catch {
      // 落回锁文件判定
    }
  }
  return detectPackageManagerFromLockfiles(io, cwd);
}

export function buildInstallCommand(pm: PackageManager, deps: string[], dev?: boolean): string[] {
  const base: Record<PackageManager, [string, string]> = {
    pnpm: ["pnpm", "add"],
    npm: ["npm", "install"],
    yarn: ["yarn", "add"],
    bun: ["bun", "add"],
  };
  const devFlag: Record<PackageManager, string> = {
    pnpm: "-D",
    npm: "-D",
    yarn: "-D",
    bun: "-d",
  };
  const cmd = [...base[pm], ...deps];
  return dev ? [...cmd, devFlag[pm]] : cmd;
}

export type ExecIo = Io & { exec(cmd: string[]): void };

export function installDependencies(
  io: ExecIo,
  cwd: string,
  deps: string[],
  dev?: boolean,
  pm: PackageManager = detectPackageManagerFromLockfiles(io, cwd),
): void {
  if (deps.length === 0) {
    return;
  }
  io.exec(buildInstallCommand(pm, deps, dev));
}
