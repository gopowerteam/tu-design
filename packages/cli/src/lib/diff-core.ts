import type { Io } from "./io";
import type { ComponentsConfig } from "./config";
import { fetchItem } from "./registry";
import type { NpmChannel, RegistryFetcher } from "./registry";
import type { RegistryItem } from "./registry-types";
import { resolveTarget } from "./write";
import { hashContent, readLockfile } from "./lockfile";
import { aliasRootOf } from "./add-core";

export type DiffStatus =
  | "up-to-date"
  | "updatable"
  | "modified"
  | "conflict"
  | "missing"
  | "different";

export interface FileDiff {
  target: string;
  status: DiffStatus;
}

export interface ComponentDiff {
  name: string;
  /** 线上 registry 标注的版本（item.version ?? null）。 */
  remoteVersion: string | null;
  /** lockfile 记录的安装时版本；无记录为 null。 */
  localVersion: string | null;
  /** lockfile 无该组件记录（旧版安装 / 手工放置）。 */
  legacy: boolean;
  /** 单组件 fetch 失败原因（全量 diff 不中断）。 */
  error?: string;
  files: FileDiff[];
}

/**
 * 本地文件 vs 线上 registry vs lockfile 安装时快照的三方比对。
 * 每文件按有序决策树判定（first-match）：
 * 1. 本地 === 线上 → up-to-date
 * 2. 无安装记录（legacy）且与线上不同 → different（两方对比降级）
 * 3. 本地 === 上次安装 → updatable（本地干净，可安全覆盖）
 * 4. 线上 === 上次安装 → modified（远端没动，本地改的）
 * 5. 三方互不相同 → conflict
 */
export async function diffComponents(
  io: Io,
  fetcher: RegistryFetcher,
  registryUrl: string,
  npm: NpmChannel,
  root: string,
  config: ComponentsConfig,
  names?: string[],
): Promise<ComponentDiff[]> {
  const lockfile = readLockfile(io, root);
  const list = names ?? Object.keys(lockfile.packages);
  const aliasRoot = aliasRootOf(root);

  const out: ComponentDiff[] = [];
  for (const name of list) {
    const record = lockfile.packages[name] ?? null;
    const diff: ComponentDiff = {
      name,
      remoteVersion: null,
      localVersion: record?.version ?? null,
      legacy: record === null,
      files: [],
    };
    let item: RegistryItem;
    try {
      item = await fetchItem(fetcher, registryUrl, npm, name);
    } catch (error) {
      diff.error = error instanceof Error ? error.message : String(error);
      out.push(diff);
      continue;
    }
    diff.remoteVersion = item.version ?? null;

    for (const file of item.files) {
      const target = resolveTarget(file.target, config, aliasRoot);
      const remoteHash = hashContent(file.content);
      const installedHash = record?.files[target] ?? null;
      let status: DiffStatus;
      if (!io.exists(target)) {
        status = "missing";
      } else {
        const localHash = hashContent(io.readFile(target));
        if (localHash === remoteHash) {
          status = "up-to-date";
        } else if (installedHash === null) {
          status = "different";
        } else if (localHash === installedHash) {
          status = "updatable";
        } else if (remoteHash === installedHash) {
          status = "modified";
        } else {
          status = "conflict";
        }
      }
      diff.files.push({ target, status });
    }
    out.push(diff);
  }
  return out;
}
