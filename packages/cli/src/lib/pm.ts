import type { Io } from "./io";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const PM_NAMES: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

/** agent 形如 "pnpm@9.15.0"；未知识别为 npm。 */
export function detectPackageManager(agent: string | undefined): PackageManager {
  if (!agent) {
    return "npm";
  }
  const name = agent.split("@")[0] ?? agent;
  return (PM_NAMES as readonly string[]).includes(name) ? (name as PackageManager) : "npm";
}

/** 由 cwd 锁文件推断包管理器（package-manager-detector 的纯 IO 兜底路径）。 */
export function detectPackageManagerFromLockfiles(io: Io, cwd: string): PackageManager {
  if (io.exists(`${cwd}/pnpm-lock.yaml`)) return "pnpm";
  if (io.exists(`${cwd}/yarn.lock`)) return "yarn";
  if (io.exists(`${cwd}/bun.lockb`) || io.exists(`${cwd}/bun.lock`)) return "bun";
  return "npm";
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
