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

/**
 * override（--registry）优先于 components.json。
 * 去掉尾部 `/`：拼接处是 `${url}/${name}.json`，用户从浏览器地址栏复制带斜杠的 URL
 * 会拼出 `//button.json`，不少静态托管据此 404。
 */
export function resolveRegistryUrl(config: ComponentsConfig, override?: string): string {
  return (override ?? config.registry).replace(/\/+$/, "");
}

/** registry item 最小结构校验（name/type/files），files 逐文件校验形态。 */
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
  const badFile = (obj.files as unknown[]).findIndex(
    (f) =>
      typeof f !== "object" ||
      f === null ||
      typeof (f as Record<string, unknown>).path !== "string" ||
      typeof (f as Record<string, unknown>).target !== "string" ||
      typeof (f as Record<string, unknown>).content !== "string",
  );
  if (badFile !== -1) {
    throw new Error(
      `registry item ${String(obj.name)} 的 files[${badFile}] 缺少 path/target/content 字符串字段`,
    );
  }
  if (obj.version !== undefined && typeof obj.version !== "string") {
    throw new Error(
      `registry item ${String(obj.name)} 的 version 字段必须是字符串，得到 ${obj.version === null ? "null" : typeof obj.version}`,
    );
  }
  return raw as RegistryItem;
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 双通道解析：URL 优先（fetch `${registryUrl}/${name}.json`），
 * 失败 / 404 / 校验不过时回退 npm 通道；双失败抛错含组件名与 URL 通道的真实原因
 * （吞掉原因会让用户去查 npm，问题其实出在 registry 网络或 JSON 损坏）。
 */
export async function fetchItem(
  fetcher: RegistryFetcher,
  registryUrl: string,
  npm: NpmChannel,
  name: string,
): Promise<RegistryItem> {
  const url = `${registryUrl}/${name}.json`;
  let urlFailure: string;
  try {
    return validateRegistryItem(await fetcher.fetchJson(url));
  } catch (error) {
    urlFailure = reasonOf(error);
  }
  if (npm.hasItem(name)) {
    return validateRegistryItem(npm.readItem(name));
  }
  throw new Error(
    `无法获取组件 ${name}：URL 通道 ${url} 失败（${urlFailure}），npm 通道（@tu-design/vue）亦不可用`,
  );
}

export type { RegistryItem, RegistryType } from "./registry-types";
