import { loadConfig } from "./config";
import { fetchItem, resolveRegistryUrl } from "./registry";
import type { RegistryFetcher, NpmChannel } from "./registry";
import type { RegistryItem } from "./registry-types";
import { detectPackageManagerForProject, installDependencies } from "./pm";
import { findProjectRoot, planWrites, resolveTarget, writeFiles } from "./write";
import { readLockfile, writeLockfile } from "./lockfile";
import { hashNormalizedContent, rewriteContent } from "./rewrite";
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

export interface AddOptions {
  overwrite?: boolean;
  registry?: string;
  confirm?: (msg: string) => Promise<boolean>;
  npm?: NpmChannel;
  dryRun?: boolean;
  /** 升级 components.lock.json 记录的全部组件；与显式组件名互斥。 */
  all?: boolean;
  /** 跳过依赖安装（workspace:/catalog: 协议场景由调用方自行安装）。 */
  noInstall?: boolean;
  /** 把产出源码中的 `@/` alias 导入改写为相对导入。 */
  relativeImports?: boolean;
}

/**
 * add / diff 共用：解析参与组件名列表。
 * --all 从 lockfile 展开全部记录名；与显式组件名互斥，lockfile 为空时报错提示。
 * @param io IO 通道（读 lockfile）
 * @param root 项目根
 * @param names 显式组件名（可为空数组）
 * @param opts.all 是否全量展开
 * @returns 参与组件名
 */
function resolveNames(io: Io, root: string, names: string[], all?: boolean): string[] {
  if (!all) {
    if (names.length === 0) {
      throw new Error("未指定组件名（或使用 --all 全量升级 lockfile 记录的全部组件）");
    }
    return names;
  }
  if (names.length > 0) {
    throw new Error("--all 与显式组件名互斥，二者只取其一");
  }
  const lock = readLockfile(io, root);
  const allNames = Object.keys(lock.packages);
  if (allNames.length === 0) {
    throw new Error("components.lock.json 没有记录（先 add 具体组件后才能 --all 全量升级）");
  }
  return allNames;
}

/**
 * 运行 add 命令：拉取 registry item（拓扑序）、写入组件源码、更新 lockfile，
 * 并按需安装依赖。--all 全量升级 lock 记录；--no-install 跳过依赖安装；
 * --relative-imports 在写入前把 `@/` alias 导入改写为相对导入（lockfile 记录改写后
 * 内容的归一化 hash 与 relativeImports 标记，供 diff 按同款基准三方比对）。
 * @param io IO 通道（含 registry fetch 与子进程 exec）
 * @param cwd 运行目录（向上查找 components.json 定位项目根）
 * @param names 显式组件名；配合 opts.all 留空
 * @param opts 覆盖安装/registry 通道/dry-run/all/no-install/relative-imports 选项
 * @returns 写入/覆盖/冲突/最新跳过/依赖清单摘要
 */
export async function runAdd(
  io: Io & RegistryFetcher & { exec(cmd: string[]): void },
  cwd: string,
  names: string[],
  opts: AddOptions,
): Promise<AddSummary> {
  const root = findProjectRoot(io, cwd);
  const config = loadConfig(io, root);
  const registryUrl = resolveRegistryUrl(config, opts.registry);
  const aliasRoot = aliasRootOf(root);

  const finalNames = resolveNames(io, root, names, opts.all);

  const npm: NpmChannel = opts.npm ?? { hasItem: () => false, readItem: () => undefined };
  const items = await resolveTopo(finalNames, (name) => fetchItem(io, registryUrl, npm, name));

  const planned = planWrites(items, io, aliasRoot, config);
  // --relative-imports：改写发生在 plan 阶段，后续 writeFiles/dry-run/lockfile
  // 全部消费改写后内容，比对口径天然一致
  const plans = opts.relativeImports
    ? planned.map((p) => ({ ...p, content: rewriteContent(p.content, p.path, aliasRoot) }))
    : planned;
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
      if (hashNormalizedContent(io.readFile(plan.path)) === hashNormalizedContent(plan.content)) {
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

  // lockfile 更新：provenance 判定按文件状态——
  // written / upToDate（内容 === 远端）→ 已知来源；declined / conflicts（本地与远端不一致且未写）→ 不明。
  // 仅当某 item 的全部文件 provenance 明确时记录（含 upToDate：幂等跳过的文件内容就是远端内容，
  // 只认「已写入」会让部分幂等的覆盖升级丢掉版本号——playground T6/T7 回归抓到的缺陷）。
  // hash 口径：归一化(写入内容)——写入内容含 --relative-imports 改写，与本地/diff 比对基准一致。
  const lockfile = readLockfile(io, root);
  const knownRemote = new Set([...result.written, ...result.upToDate]);
  const contentByPath = new Map(plans.map((p) => [p.path, p.content]));
  for (const item of items) {
    const files: Record<string, string> = {};
    let allKnown = true;
    for (const file of item.files) {
      const target = resolveTarget(file.target, config, aliasRoot);
      if (!knownRemote.has(target)) {
        allKnown = false;
        break;
      }
      files[target] = hashNormalizedContent(contentByPath.get(target) ?? file.content);
    }
    if (allKnown) {
      lockfile.packages[item.name] = {
        version: item.version ?? null,
        files,
        ...(opts.relativeImports ? { relativeImports: true } : {}),
      };
    }
  }
  writeLockfile(io, root, lockfile);

  if (opts.noInstall !== true) {
    const pm = detectPackageManagerForProject(io, root);
    if (dependencies.length > 0) {
      installDependencies(io, root, dependencies, false, pm);
    }
    if (devDependencies.length > 0) {
      installDependencies(io, root, devDependencies, true, pm);
    }
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
