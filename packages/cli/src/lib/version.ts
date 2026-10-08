/** 从 package.json 原始文本解析版本号（纯函数，便于测试）。 */
export function parsePkgVersion(raw: string): string {
  const parsed = JSON.parse(raw) as { version?: unknown };
  if (typeof parsed.version !== "string" || parsed.version.length === 0) {
    throw new Error("package.json 缺少 version 字段");
  }
  return parsed.version;
}
