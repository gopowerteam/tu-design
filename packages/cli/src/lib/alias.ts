import type { Io } from "./io";

/**
 * 将 paths 合并进 tsconfig 文本。JSON round-trip（不引入 AST 依赖）：
 * 解析失败时返回原文，由调用方提示手动配置。注意：会丢失 tsconfig 中的注释。
 */
export function mergeTsconfigPaths(source: string, paths: Record<string, string[]>): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return source;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return source;
  }
  const root = parsed as Record<string, unknown>;
  const options =
    typeof root.compilerOptions === "object" && root.compilerOptions !== null
      ? (root.compilerOptions as Record<string, unknown>)
      : {};
  const existing =
    typeof options.paths === "object" && options.paths !== null
      ? (options.paths as Record<string, string[]>)
      : {};
  options.paths = { ...existing, ...paths };
  root.compilerOptions = options;
  return `${JSON.stringify(root, null, 2)}\n`;
}

export interface ViteAlias {
  find: string;
  replacement: string;
}

/**
 * 将 alias 注入 vite 配置文本（纯字符串变换，无 AST）：
 * - 已有 alias 对象 → 在对象首行后追加键
 * - 有 resolve 无 alias → 在 resolve 块内补 alias
 * - 都没有 → 在 defineConfig({ 后插入 resolve 块
 * - 无 defineConfig / 结构不识别 → 返回原文（调用方打印手动指引）
 */
export function mergeViteAlias(source: string, alias: ViteAlias): string {
  if (!source.includes("defineConfig(")) {
    return source;
  }
  const entry = `    "${alias.find}": ${alias.replacement},\n`;

  if (source.includes("alias: {")) {
    const idx = source.indexOf("alias: {");
    const insertAt = idx + "alias: {".length;
    return `${source.slice(0, insertAt)}\n${entry}${source.slice(insertAt)}`;
  }

  if (source.includes("resolve: {")) {
    const idx = source.indexOf("resolve: {");
    const insertAt = idx + "resolve: {".length;
    const block = `\n  alias: {\n${entry}  },`;
    return `${source.slice(0, insertAt)}${block}${source.slice(insertAt)}`;
  }

  const idx = source.indexOf("defineConfig({");
  if (idx === -1) {
    return source;
  }
  const insertAt = idx + "defineConfig({".length;
  const block = `\n  resolve: {\n    alias: {\n${entry}    },\n  },`;
  return `${source.slice(0, insertAt)}${block}${source.slice(insertAt)}`;
}

export function applyAliases(io: Io, cwd: string, aliasRoot: string): void {
  const tsconfigPath = `${cwd}/tsconfig.json`;
  if (io.exists(tsconfigPath)) {
    const merged = mergeTsconfigPaths(io.readFile(tsconfigPath), {
      "@/*": [`./${aliasRoot}/*`],
    });
    io.writeFile(tsconfigPath, merged);
  }

  const viteConfigPath = `${cwd}/vite.config.ts`;
  if (io.exists(viteConfigPath)) {
    const merged = mergeViteAlias(io.readFile(viteConfigPath), {
      find: "@",
      replacement: JSON.stringify(`${cwd}/${aliasRoot}`),
    });
    io.writeFile(viteConfigPath, merged);
  }
}
