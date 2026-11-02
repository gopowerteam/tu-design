import { loadConfig } from "./config";
import { fetchItem, resolveRegistryUrl } from "./registry";
import type { RegistryFetcher, NpmChannel } from "./registry";
import type { RegistryItem } from "./registry-types";
import { detectPackageManagerForProject, installDependencies } from "./pm";
import { findProjectRoot, planWrites, resolveTarget, writeFiles } from "./write";
import { hashContent, readLockfile, writeLockfile } from "./lockfile";
import type { Io } from "./io";

export async function resolveTopo(
  names: string[],
  fetchOne: (name: string) => Promise<RegistryItem>,
): Promise<RegistryItem[]> {
  const out: RegistryItem[] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  async function visit(name: string): Promise<void> {
    if (visited.has(name)) {
      return;
    }
    if (stack.includes(name)) {
      const cycle = [...stack.slice(stack.indexOf(name)), name].join(" -> ");
      throw new Error(`registryDependencies 存在循环引用：${cycle}`);
    }
    stack.push(name);
    const item = await fetchOne(name);
    for (const dep of item.registryDependencies ?? []) {
      await visit(dep);
    }
    stack.pop();
    visited.add(name);
    out.push(item);
  }

  for (const name of names) {
    await visit(name);
  }
  return out;
}

export function collectDeps(items: RegistryItem[]): {
  dependencies: string[];
  devDependencies: string[];
} {
  const dependencies: string[] = [];
  const devDependencies: string[] = [];
  const push = (list: string[], dep: string) => {
    // registry 数组形式为 name@version —— 安装命令用完整 spec，去重按完整 spec
    if (!list.includes(dep)) {
      list.push(dep);
    }
  };
  for (const item of items) {
    for (const dep of item.dependencies ?? []) {
      push(dependencies, dep);
    }
    for (const dep of item.devDependencies ?? []) {
      push(devDependencies, dep);
    }
  }
  return { dependencies, devDependencies };
}

export interface AddSummary {
  files: string[];
  overwrites: string[];
  conflicts: string[];
  upToDate: string[];
  declined: string[];
  dependencies: string[];
  devDependencies: string[];
  dryRun?: boolean;
}

export const DEFAULT_ALIAS_ROOT = "src";

/** add / diff 共用：由项目根推出组件源码落点根（aliasRoot）。 */
export function aliasRootOf(root: string): string {
  return `${root}/${DEFAULT_ALIAS_ROOT}`;
}

export async function runAdd(
  io: Io & RegistryFetcher & { exec(cmd: string[]): void },
  cwd: string,
  names: string[],
  opts: {
    overwrite?: boolean;
    registry?: string;
    confirm?: (msg: string) => Promise<boolean>;
    npm?: NpmChannel;
    dryRun?: boolean;
  },
): Promise<AddSummary> {
  const root = findProjectRoot(io, cwd);
  const config = loadConfig(io, root);
  const registryUrl = resolveRegistryUrl(config, opts.registry);
  const aliasRoot = aliasRootOf(root);

  const npm: NpmChannel = opts.npm ?? { hasItem: () => false, readItem: () => undefined };
  const items = await resolveTopo(names, (name) => fetchItem(io, registryUrl, npm, name));

  const plans = planWrites(items, io, aliasRoot, config);
  const { dependencies, devDependencies } = collectDeps(items);

  if (opts.dryRun) {
    // 纯展示：不写盘、不装依赖、不写 lockfile，也不产生 conflict（不触发退出码）
    const files: string[] = [];
    const overwrites: string[] = [];
    const upToDate: string[] = [];
    for (const plan of plans) {
      if (!io.exists(plan.path)) {
        files.push(plan.path);
        continue;
      }
      if (hashContent(io.readFile(plan.path)) === hashContent(plan.content)) {
        upToDate.push(plan.path);
      } else {
        files.push(plan.path);
        overwrites.push(plan.path);
      }
    }
    return {
      files,
      overwrites,
      conflicts: [],
      upToDate,
      declined: [],
      dependencies,
      devDependencies,
      dryRun: true,
    };
  }

  const result = await writeFiles(plans, io, {
    overwrite: opts.overwrite,
    confirm: opts.confirm,
  });

  // lockfile 更新：仅当某 item 的全部文件都写入时记录；任一文件未写入（跳过/拒绝/冲突）
  // → provenance 不明，条目保持原样（不新建不修改）。
  const lockfile = readLockfile(io, root);
  const writtenSet = new Set(result.written);
  for (const item of items) {
    const files: Record<string, string> = {};
    let allWritten = true;
    for (const file of item.files) {
      const target = resolveTarget(file.target, config, aliasRoot);
      if (!writtenSet.has(target)) {
        allWritten = false;
        break;
      }
      files[target] = hashContent(file.content);
    }
    if (allWritten) {
      lockfile.packages[item.name] = { version: item.version ?? null, files };
    }
  }
  writeLockfile(io, root, lockfile);

  const pm = detectPackageManagerForProject(io, root);
  if (dependencies.length > 0) {
    installDependencies(io, root, dependencies, false, pm);
  }
  if (devDependencies.length > 0) {
    installDependencies(io, root, devDependencies, true, pm);
  }

  return {
    files: result.written,
    overwrites: result.overwrites,
    conflicts: result.conflicts,
    upToDate: result.upToDate,
    declined: result.declined,
    dependencies,
    devDependencies,
  };
}
