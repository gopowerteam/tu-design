import { validateRegistryItem, type RegistryFetcher } from "./registry";
import type { RegistryItem } from "./registry-types";

/** registry.json 索引项的精简视图（MCP 只暴露 AI 需要的三个字段）。 */
export interface RegistryIndexEntry {
  name: string;
  title: string;
  description: string;
}

/** 组件名只允许小写字母、数字与连字符：防路径穿越与 URL 注入。 */
const NAME_RE = /^[a-z0-9-]+$/;

/**
 * registry URL 尾斜杠会让拼接变成 //name.json，多数静态托管据此 404。
 * @param registryUrl - registry 基础 URL
 * @returns 去掉尾部斜杠后的 URL
 */
function trimUrl(registryUrl: string): string {
  return registryUrl.replace(/\/+$/, "");
}

/**
 * 提取任意抛出值的可读信息：Error 取 message，其余值字符串化。
 * @param error - catch 捕获的任意值
 * @returns 错误消息文本
 */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 拉取 registry 索引（GET `${registryUrl}/registry.json`），过滤只留 registry:ui 组件。
 * 最小形态校验：items 为数组、每项 name 为 string；错误消息中文且含 URL，便于定位数据源问题。
 * @param fetcher - URL 通道实现（HTTP 拉取 JSON）
 * @param registryUrl - registry 基础 URL
 * @returns registry:ui 组件的精简索引项列表
 */
export async function fetchRegistryIndex(
  fetcher: RegistryFetcher,
  registryUrl: string,
): Promise<RegistryIndexEntry[]> {
  const url = `${trimUrl(registryUrl)}/registry.json`;
  const raw = await fetcher.fetchJson(url);
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`registry index 不是 JSON 对象：${url}`);
  }
  const items = (raw as Record<string, unknown>).items;
  if (!Array.isArray(items)) {
    throw new Error(`registry index 缺少 items 数组：${url}`);
  }
  return items
    .map((item, index): { name: string; type: unknown; title: unknown; description: unknown } => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).name !== "string"
      ) {
        throw new Error(`registry index items[${index}] 缺少 name 字符串字段：${url}`);
      }
      const obj = item as { name: string } & Record<string, unknown>;
      return {
        name: obj.name,
        type: obj.type,
        title: obj.title,
        description: obj.description,
      };
    })
    .filter((item) => item.type === "registry:ui")
    .map((item) => ({
      name: item.name,
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
    }));
}

/**
 * 在 name / title / description 上做大小写不敏感子串过滤（空 query 返回全部）。
 * @param fetcher - URL 通道实现（HTTP 拉取 JSON）
 * @param registryUrl - registry 基础 URL
 * @param query - 检索子串（大小写不敏感）
 * @returns 命中的索引项列表
 */
export async function searchComponents(
  fetcher: RegistryFetcher,
  registryUrl: string,
  query: string,
): Promise<RegistryIndexEntry[]> {
  const entries = await fetchRegistryIndex(fetcher, registryUrl);
  const q = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q),
  );
}

/**
 * 拉取单个组件 registry item（GET `${registryUrl}/${name}.json`）。
 * 只走线上 URL 通道并复用 validateRegistryItem 校验，不用 fetchItem 的 npm 回退——
 * MCP 是只读查询面，npm 本地回退会让查询结果取决于安装缓存，语义混乱。
 * 返回项附加 installHint，引导 AI 用 CLI 安装而不是复制源码。
 * @param fetcher - URL 通道实现（HTTP 拉取 JSON）
 * @param registryUrl - registry 基础 URL
 * @param name - 组件名（仅小写字母、数字与连字符）
 * @returns 校验通过的 registry item，附 installHint 安装提示
 */
export async function getComponent(
  fetcher: RegistryFetcher,
  registryUrl: string,
  name: string,
): Promise<RegistryItem & { installHint: string }> {
  if (!NAME_RE.test(name)) {
    throw new Error(`非法组件名 ${name}：只允许小写字母、数字与连字符`);
  }
  const url = `${trimUrl(registryUrl)}/${name}.json`;
  let raw: unknown;
  try {
    raw = await fetcher.fetchJson(url);
  } catch (error) {
    throw new Error(`无法获取组件 ${name}：${url} 拉取失败（${reasonOf(error)}）`);
  }
  let item: RegistryItem;
  try {
    item = validateRegistryItem(raw);
  } catch (error) {
    throw new Error(`组件 ${name} 的 registry item 校验失败：${url}（${reasonOf(error)}）`);
  }
  return { ...item, installHint: `npx @tu-design/cli add ${item.name}` };
}
