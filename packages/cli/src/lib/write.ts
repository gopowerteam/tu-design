import { join } from "node:path";
import type { Io } from "./io";
import type { ComponentsConfig } from "./config";
import type { RegistryItem } from "./registry-types";

function parentDir(dir: string): string | null {
  if (dir === "/") {
    return null;
  }
  const idx = dir.lastIndexOf("/");
  return idx <= 0 ? "/" : dir.slice(0, idx);
}

/** 自 cwd 向上找最近的 components.json；到文件系统根仍无 → 抛错提示 init。 */
export function findProjectRoot(io: Io, cwd: string): string {
  let dir = cwd;
  for (;;) {
    if (io.exists(`${dir}/components.json`)) {
      return dir;
    }
    const up = parentDir(dir);
    if (up === null) {
      throw new Error(
        `未找到 components.json（自 ${cwd} 向上层均未命中）——请先运行 \`tu-design init\``,
      );
    }
    dir = up;
  }
}

/** registry target 恒为 POSIX /；此处按平台逐段 join 规范化。 */
export function resolveTarget(target: string, config: ComponentsConfig, aliasRoot: string): string {
  // config 当前用于保留 alias 语义的扩展位（target 已按 components/ui 布局生成）
  void config;
  const root = aliasRoot.replace(/[/\\]+$/, "");
  return join(root, ...target.split("/"));
}

export interface WritePlan {
  path: string;
  content: string;
  exists: boolean;
}

export function planWrites(
  items: RegistryItem[],
  io: Io,
  aliasRoot: string,
  config: ComponentsConfig,
): WritePlan[] {
  const plans: WritePlan[] = [];
  for (const item of items) {
    for (const file of item.files) {
      const path = resolveTarget(file.target, config, aliasRoot);
      plans.push({ path, content: file.content, exists: io.exists(path) });
    }
  }
  return plans;
}

export async function writeFiles(
  plans: WritePlan[],
  io: Io,
  opts: { overwrite?: boolean; confirm?: (msg: string) => Promise<boolean> },
): Promise<string[]> {
  const written: string[] = [];
  for (const plan of plans) {
    if (plan.exists && !opts.overwrite) {
      if (!opts.confirm) {
        continue;
      }
      const ok = await opts.confirm(`文件已存在，覆盖？${plan.path}`);
      if (!ok) {
        continue;
      }
    }
    io.writeFile(plan.path, plan.content);
    written.push(plan.path);
  }
  return written;
}
