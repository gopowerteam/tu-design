import { hashContent } from "./lockfile";

/**
 * 空白归一化：移除全部空白字符。
 *
 * 动机：registry 源码写入用户项目后，用户的 fmt（prettier 等）会重排空白
 * （缩进、折行、行尾），逐字节 hash 会把「格式重排」误判为「内容变更」，
 * 造成 up-to-date 失效与三方比对假 conflict。归一化后 hash 只对语义内容敏感。
 * @param content 任意文本
 * @returns 移除全部空白后的文本
 */
export function normalizeContent(content: string): string {
  return content.replace(/\s+/g, "");
}

/**
 * 空白归一化 hash：比对基准统一走它（writeFiles upToDate / dry-run 判定 /
 * lockfile 记录 / diff 三方比对），任何一处用精确 hash 都会 reintroduce 假 dirty。
 * @param content 任意文本
 * @returns 归一化后的 sha256（hex）
 */
export function hashNormalizedContent(content: string): string {
  return hashContent(normalizeContent(content));
}

/**
 * registry 产出源码的 alias 公共根：defaultConfig 四个别名（components/utils/ui/lib）
 * 全部以 `@/` 开头，registry 内容里的 import 规格统一是 `@/<aliasRoot 内相对路径>`。
 * 改写按公共根整体处理（而非逐个别名键前缀匹配），天然规避
 * `@/components/ui/...` 同时命中 components 与 ui 两个前缀的重叠判定问题。
 */
const ALIAS_SPEC_ROOT = "@/";

/** 参与 import 改写的文件扩展名；css/json 等非源码文件原样返回。 */
const REWRITE_EXTENSIONS = /\.(?:ts|tsx|mts|cts|vue)$/;

/**
 * 把源码中的 alias 导入改写为相对导入（--relative-imports）。
 *
 * 规则：`from "@/x/y"` 与动态 `import("@/x/y")` 中的规格按
 * 「文件所在目录 → aliasRoot 的相对深度」改写为 `../` 前缀路径：
 * - `/proj/src/components/ui/button/button.vue` 引 `@/lib/utils`
 *   → aliasRoot=/proj/src，深度 3 → `../../../lib/utils`
 * - 规格恰为 `@/`（无余下路径，指向 aliasRoot 自身）语义不明，保守跳过不改写。
 * 仅改写 import 语句内的字符串字面量，字符串/注释中的 `@/` 字面量不受影响。
 * @param content registry 原文内容
 * @param filePath 落盘绝对路径（POSIX），用于推导相对深度
 * @param aliasRoot 项目源码根（`@/` 的实体，如 `<root>/src`）
 * @returns 改写后内容；非源码扩展名或无 alias 引用时原样返回
 */
export function rewriteContent(content: string, filePath: string, aliasRoot: string): string {
  if (!REWRITE_EXTENSIONS.test(filePath)) {
    return content;
  }
  const root = aliasRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const file = filePath.replace(/\\/g, "/");
  if (!file.startsWith(`${root}/`)) {
    return content;
  }
  const depth = file.slice(root.length + 1, file.lastIndexOf("/")).split("/").length;
  const up = "../".repeat(depth);
  const rewriteSpec = (spec: string): string | null => {
    if (!spec.startsWith(ALIAS_SPEC_ROOT)) {
      return null;
    }
    const rest = spec.slice(ALIAS_SPEC_ROOT.length);
    // `@/` 裸根指向 aliasRoot 自身，作为导入目标语义不明，保守不改写
    if (rest === "") {
      return null;
    }
    return `${up}${rest}`;
  };
  return content.replace(
    /(from\s*|import\s*\(\s*)(["'])(@\/[^"']*)\2/g,
    (whole: string, lead: string, quote: string, spec: string): string => {
      const rewritten = rewriteSpec(spec);
      return rewritten === null ? whole : `${lead}${quote}${rewritten}${quote}`;
    },
  );
}
