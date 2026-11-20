/** 任意结构的数据行（弱类型容器，字段由调用方决定） */
export type RowRecord = Record<string, unknown>;

/** 行扫描开关：索引与查重可按需裁剪（未启用选择时零开销） */
export interface ScanOptions {
  withIndex: boolean;
  withDuplicates: boolean;
}

/** 行扫描结果：`index` 永不为 undefined（关闭时为空 Map） */
export interface ScanResult<T> {
  index: Map<string, T>;
  duplicates: string[];
}

/**
 * 行主键 → 行标识字符串（行身份单一权威）
 *
 * 仅当 rowKey 已配置且记录字段非 null/undefined 时取 `String(value)`；
 * 否则退化为 `index-${index}`（索引由调用方按遍历序提供）。
 * @param record - 行记录
 * @param key - rowKey 字段名；未配置时为空
 * @param index - 行索引（退化标识来源）
 * @returns 行标识字符串
 */
export function toRowId(record: RowRecord, key: string | undefined, index: number): string {
  const value = key ? record[key] : undefined;
  return value === undefined || value === null ? `index-${index}` : String(value);
}

/**
 * 单遍 DFS 扫描数据窗口：建立 id → 行索引并按批查重
 *
 * 递归条件只看记录上的 childrenKey 是否为数组（与 tree 开关无关，故树形子行也纳入）；
 * 索引与查重**只收纳非空 rowKey 值**——缺字段记录不生成 `index-N` 索引键、不参与查重，
 * 避免 DFS 下兜底键相撞造成的假重复。索引为后写覆盖，duplicates 批内去重且保持首次发现序。
 * @param rows - 数据窗口（当前页/当前数据源）
 * @param key - rowKey 字段名；未配置时索引与查重均为空
 * @param childrenKey - 子行字段名
 * @param options - 索引/查重开关
 * @returns 行索引与重复 id 列表（跨调用无残留）
 */
export function scanRows<T extends RowRecord>(
  rows: readonly T[],
  key: string | undefined,
  childrenKey: string,
  options: ScanOptions,
): ScanResult<T> {
  const index = new Map<string, T>();
  const seen = new Set<string>();
  const duplicates: string[] = [];

  function visit(list: readonly T[]) {
    for (const record of list) {
      const value = key ? record[key] : undefined;
      if (value !== undefined && value !== null) {
        const id = String(value);
        if (options.withIndex) index.set(id, record);
        if (options.withDuplicates) {
          if (seen.has(id)) {
            if (!duplicates.includes(id)) duplicates.push(id);
          } else {
            seen.add(id);
          }
        }
      }
      const children = record[childrenKey];
      if (Array.isArray(children)) visit(children as readonly T[]);
    }
  }

  visit(rows);
  return { index, duplicates };
}
