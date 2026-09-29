import { createHighlighter, type Highlighter } from "shiki";

let promise: Promise<Highlighter> | undefined;

/** 模块级单例：服务端构建期与客户端各初始化一次，进程内复用 */
export function getHighlighter() {
  promise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["vue", "ts", "bash"],
  });
  return promise;
}
