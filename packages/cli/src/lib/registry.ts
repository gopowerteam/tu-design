import type { ComponentsConfig } from "./config";
import type { RegistryItem } from "./registry-types";

export interface RegistryFetcher {
  fetchJson(url: string): Promise<unknown>;
}

export interface NpmChannel {
  hasItem(name: string): boolean;
  readItem(name: string): unknown;
}

const ITEM_TYPES: readonly string[] = ["registry:ui", "registry:lib", "registry:style"];

/** override（--registry）优先于 components.json。 */
export function resolveRegistryUrl(config: ComponentsConfig, override?: string): string {
  return override ?? config.registry;
}

/** registry item 最小结构校验（name/type/files）。 */
export function validateRegistryItem(raw: unknown): RegistryItem {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("registry item 不是 JSON 对象");
  }
  const obj = raw as Record<string, unknown>;
  const missing: string[] = [];
  if (typeof obj.name !== "string") missing.push("name");
  if (typeof obj.type !== "string" || !ITEM_TYPES.includes(obj.type)) missing.push("type");
  if (!Array.isArray(obj.files)) missing.push("files");
  if (missing.length > 0) {
    throw new Error(`registry item 缺少字段：${missing.join("、")}`);
  }
  return raw as RegistryItem;
}

/**
 * 双通道解析：URL 优先（fetch `${registryUrl}/${name}.json`），
 * 失败 / 404 / 校验不过时回退 npm 通道；双失败抛错含组件名。
 */
export async function fetchItem(
  fetcher: RegistryFetcher,
  registryUrl: string,
  npm: NpmChannel,
  name: string,
): Promise<RegistryItem> {
  try {
    const raw = await fetcher.fetchJson(`${registryUrl}/${name}.json`);
    return validateRegistryItem(raw);
  } catch {
    // URL 通道不可用，走 npm 兜底
  }
  if (npm.hasItem(name)) {
    return validateRegistryItem(npm.readItem(name));
  }
  throw new Error(`无法获取组件 ${name}：URL 通道与 npm 通道（@tu-design/vue）均不可用`);
}

export type { RegistryItem, RegistryType } from "./registry-types";
