import { createHash } from "node:crypto";
import { parseJson } from "./json";
import type { Io } from "./io";

/** 组件版本记录文件，位于项目根（components.json 旁）。 */
export const LOCKFILE_NAME = "components.lock.json";

export interface LockfilePackage {
  /** 安装时的组件版本；registry 未标注则为 null。 */
  version: string | null;
  /**
   * 文件落点（绝对路径）→ 归一化内容 sha256。
   *
   * 口径（v0.6.0 起）：hashNormalizedContent——0.5.0 及之前是逐字节精确 hash。
   * 旧记录与本地内容未变时不受影响（up-to-date 判定不依赖 installedHash），
   * 仅当远端发生真实变更时首次比对会落入 conflict，覆盖安装一次即重建为新口径。
   */
  files: Record<string, string>;
  /**
   * 安装时是否启用了 --relative-imports 内容改写。
   * diff 依赖它决定远端比对基准是否同样改写（undefined 视为 false，v1 记录兼容）。
   */
  relativeImports?: boolean;
}

export interface Lockfile {
  lockfileVersion: 1;
  packages: Record<string, LockfilePackage>;
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/** 刻意不含 installedAt 之类时间戳字段：跨机器安装会产生 VCS diff 噪音。 */
function validateLockfile(raw: unknown): Lockfile {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${LOCKFILE_NAME} 内容不是 JSON 对象`);
  }
  const obj = raw as Record<string, unknown>;
  if (obj.lockfileVersion !== 1) {
    throw new Error(
      `${LOCKFILE_NAME} 的 lockfileVersion 必须是 1，得到 ${JSON.stringify(obj.lockfileVersion)}`,
    );
  }
  const packages = obj.packages;
  if (typeof packages !== "object" || packages === null || Array.isArray(packages)) {
    throw new Error(`${LOCKFILE_NAME} 缺少 packages 对象`);
  }
  const out: Record<string, LockfilePackage> = {};
  for (const [name, pkg] of Object.entries(packages as Record<string, unknown>)) {
    if (typeof pkg !== "object" || pkg === null || Array.isArray(pkg)) {
      throw new Error(`${LOCKFILE_NAME} 的 packages.${name} 不是对象`);
    }
    const entry = pkg as Record<string, unknown>;
    if (entry.version !== null && typeof entry.version !== "string") {
      throw new Error(
        `${LOCKFILE_NAME} 的 packages.${name}.version 必须是字符串或 null，得到 ${typeof entry.version}`,
      );
    }
    if (typeof entry.files !== "object" || entry.files === null || Array.isArray(entry.files)) {
      throw new Error(`${LOCKFILE_NAME} 的 packages.${name}.files 必须是对象`);
    }
    if (entry.relativeImports !== undefined && typeof entry.relativeImports !== "boolean") {
      throw new Error(
        `${LOCKFILE_NAME} 的 packages.${name}.relativeImports 必须是 boolean 或缺省，得到 ${typeof entry.relativeImports}`,
      );
    }
    const files: Record<string, string> = {};
    for (const [path, hash] of Object.entries(entry.files as Record<string, unknown>)) {
      if (typeof hash !== "string") {
        throw new Error(
          `${LOCKFILE_NAME} 的 packages.${name}.files.${path} 必须是字符串，得到 ${typeof hash}`,
        );
      }
      files[path] = hash;
    }
    out[name] = {
      version: entry.version as string | null,
      files,
      ...(entry.relativeImports === true ? { relativeImports: true } : {}),
    };
  }
  return { lockfileVersion: 1, packages: out };
}

/** 文件缺失 → 空 lockfile；存在但 JSON/结构非法 → throw（损坏的 lockfile 不能静默当空处理）。 */
export function readLockfile(io: Io, root: string): Lockfile {
  const path = `${root}/${LOCKFILE_NAME}`;
  if (!io.exists(path)) {
    return { lockfileVersion: 1, packages: {} };
  }
  return validateLockfile(parseJson(io.readFile(path), LOCKFILE_NAME));
}

export function writeLockfile(io: Io, root: string, lockfile: Lockfile): void {
  io.writeFile(`${root}/${LOCKFILE_NAME}`, `${JSON.stringify(lockfile, null, 2)}\n`);
}
