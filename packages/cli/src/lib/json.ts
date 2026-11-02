/**
 * 统一 JSON 解析报错：裸 SyntaxError 不含文件名，用户无从下手；这里补上来源。
 * label 用面向用户的文件名（如 `components.json`），而不是绝对路径。
 */
export function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} 不是合法 JSON：${reason}`);
  }
}
