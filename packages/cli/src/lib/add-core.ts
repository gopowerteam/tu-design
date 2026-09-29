import { loadConfig } from "./config";
import { fetchItem, resolveRegistryUrl } from "./registry";
import type { RegistryFetcher, NpmChannel } from "./registry";
import type { RegistryItem } from "./registry-types";
import { detectPackageManagerFromLockfiles, installDependencies } from "./pm";
import { findProjectRoot, planWrites, writeFiles } from "./write";
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
  const push = (list: string[], name: string) => {
    if (!list.includes(name)) {
      list.push(name);
    }
  };
  for (const item of items) {
    for (const name of Object.keys(item.dependencies ?? {})) {
      push(dependencies, name);
    }
    for (const name of Object.keys(item.devDependencies ?? {})) {
      push(devDependencies, name);
    }
  }
  return { dependencies, devDependencies };
}

export interface AddSummary {
  files: string[];
  dependencies: string[];
  devDependencies: string[];
}

const DEFAULT_ALIAS_ROOT = "src";

export async function runAdd(
  io: Io & RegistryFetcher & { exec(cmd: string[]): void },
  cwd: string,
  names: string[],
  opts: {
    overwrite?: boolean;
    registry?: string;
    confirm?: (msg: string) => Promise<boolean>;
    npm?: NpmChannel;
  },
): Promise<AddSummary> {
  const root = findProjectRoot(io, cwd);
  const config = loadConfig(io, root);
  const registryUrl = resolveRegistryUrl(config, opts.registry);
  const aliasRoot = `${root}/${DEFAULT_ALIAS_ROOT}`;

  const npm: NpmChannel = opts.npm ?? { hasItem: () => false, readItem: () => undefined };
  const items = await resolveTopo(names, (name) => fetchItem(io, registryUrl, npm, name));

  const plans = planWrites(items, io, aliasRoot, config);
  const files = await writeFiles(plans, io, {
    overwrite: opts.overwrite,
    confirm: opts.confirm,
  });

  const { dependencies, devDependencies } = collectDeps(items);
  const pm = detectPackageManagerFromLockfiles(io, root);
  if (dependencies.length > 0) {
    installDependencies(io, root, dependencies, false, pm);
  }
  if (devDependencies.length > 0) {
    installDependencies(io, root, devDependencies, true, pm);
  }

  return { files, dependencies, devDependencies };
}
