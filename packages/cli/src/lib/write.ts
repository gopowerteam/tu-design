import type { Io } from "./io";
import type { ComponentsConfig } from "./config";
import type { RegistryItem } from "./registry-types";
import { hashContent } from "./lockfile";

function parentDir(dir: string): string | null {
  if (dir === "/") {
    return null;
  }
  const idx = dir.lastIndexOf("/");
  return idx <= 0 ? "/" : dir.slice(0, idx);
}

/** 自 cwd 向上找最近的 components.json；到文件系统根仍无 → 抛错提示 init。 */
export function findProjectRoot(io: Io, cwd: string): string {
  // 纯逻辑层统一 POSIX 分隔符，真实 Windows cwd（反斜杠）也能正确逐级上溯
  let dir = cwd.replace(/\\/g, "/");
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

/**
 * registry target 恒为 POSIX /；纯逻辑层统一 POSIX 路径，真实 fs 由 node IO 兜底（Windows 同样接受 /）。
 *
 * target 来自远端 JSON（registry 可被任意第三方托管），必须钳在 aliasRoot 内：
 * 绝对路径、盘符路径、或逸出 aliasRoot 的 `..` 一律拒绝，否则一个恶意/损坏的
 * registry 项能把源码写到项目外（`~/.bashrc`、`/etc/…`）。
 * 逐段归一后仍留在 aliasRoot 内的 `..`（如 `components/ui/../../x.ts`）允许。
 */
export function resolveTarget(target: string, config: ComponentsConfig, aliasRoot: string): string {
  // config 当前用于保留 alias 语义的扩展位（target 已按 components/ui 布局生成）
  void config;
  const root = aliasRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const unix = target.replace(/\\/g, "/");
  if (unix.startsWith("/") || /^[A-Za-z]:\//.test(unix)) {
    throw new Error(`registry target 必须是相对路径，得到 ${target}`);
  }
  const segs: string[] = [];
  for (const part of unix.split("/")) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      if (segs.length === 0) {
        throw new Error(`registry target 越出项目目录：${target}`);
      }
      segs.pop();
      continue;
    }
    segs.push(part);
  }
  if (segs.length === 0) {
    throw new Error(`registry target 解析后为空：${target}`);
  }
  return `${root}/${segs.join("/")}`;
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
      let path: string;
      try {
        path = resolveTarget(file.target, config, aliasRoot);
      } catch (error) {
        // 报错要点名是哪个 registry 项的哪个文件，否则用户只看到一个无上下文的 target 字符串
        throw new Error(
          `项 ${item.name} 的文件 ${file.path}：${error instanceof Error ? error.message : String(error)}`,
        );
      }
      plans.push({ path, content: file.content, exists: io.exists(path) });
    }
  }
  return plans;
}

export interface WriteResult {
  /** 实际写入的路径（含覆盖）。 */
  written: string[];
  /** written 中覆盖了已存在文件的路径。 */
  overwrites: string[];
  /** 已存在且内容相同 → 静默跳过（TTY / 非 TTY 一致，不询问）。 */
  upToDate: string[];
  /** TTY confirm 被用户拒绝。 */
  declined: string[];
  /** 已存在、内容不同、且无 confirm 函数（非 TTY）→ 跳过。 */
  conflicts: string[];
}

/**
 * 覆盖安全语义：内容比对（sha256）优先于存在性判断——
 * 内容相同的重复安装不算冲突，静默跳过；只有「存在且内容不同」才进入覆盖询问 / conflict 分支。
 */
export async function writeFiles(
  plans: WritePlan[],
  io: Io,
  opts: { overwrite?: boolean; confirm?: (msg: string) => Promise<boolean> },
): Promise<WriteResult> {
  const result: WriteResult = {
    written: [],
    overwrites: [],
    upToDate: [],
    declined: [],
    conflicts: [],
  };
  for (const plan of plans) {
    if (io.exists(plan.path)) {
      if (hashContent(io.readFile(plan.path)) === hashContent(plan.content)) {
        result.upToDate.push(plan.path);
        continue;
      }
      if (opts.overwrite) {
        io.writeFile(plan.path, plan.content);
        result.written.push(plan.path);
        result.overwrites.push(plan.path);
        continue;
      }
      if (opts.confirm) {
        const ok = await opts.confirm(`文件已有本地改动，覆盖？${plan.path}`);
        if (ok) {
          io.writeFile(plan.path, plan.content);
          result.written.push(plan.path);
          result.overwrites.push(plan.path);
        } else {
          result.declined.push(plan.path);
        }
        continue;
      }
      result.conflicts.push(plan.path);
      continue;
    }
    io.writeFile(plan.path, plan.content);
    result.written.push(plan.path);
  }
  return result;
}
