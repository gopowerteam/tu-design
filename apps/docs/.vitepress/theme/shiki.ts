import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from "shiki";

let promise: Promise<Highlighter> | undefined;

/**
 * 模块级单例：服务端构建期与客户端各初始化一次，进程内复用。
 * 用 JS 正则引擎（而非默认 oniguruma WASM）：避免 wasm 进入全站客户端 bundle，
 * 且水合时无需下载/实例化 wasm（审查 I-1）。
 */
export function getHighlighter() {
  promise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: ["vue"],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return promise;
}
