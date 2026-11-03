/**
 * 从 @tu-design/vue 源码生成 init 注入源码常量（src/lib/generated-sources.ts）。
 * 路径基于 import.meta.url 解析，与 cwd 无关。
 * 运行：pnpm --filter @tu-design/cli generate:sources
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vueSrc = resolve(scriptDir, "../../vue/src");

const sources = {
  /** ← packages/vue/src/styles/tokens.css */
  TOKENS_CSS_SOURCE: readFileSync(resolve(vueSrc, "styles/tokens.css"), "utf8"),
  /** ← packages/vue/src/lib/utils.ts */
  CN_UTIL_SOURCE: readFileSync(resolve(vueSrc, "lib/utils.ts"), "utf8"),
};

const banner =
  "// 本文件由 scripts/generate-sources.ts 生成，勿手改。\n" +
  "// 再生成：pnpm --filter @tu-design/cli generate:sources\n\n";

const body = Object.entries(sources)
  .map(([name, content]) => `export const ${name} = ${JSON.stringify(content)};\n`)
  .join("\n");

const outPath = resolve(scriptDir, "../src/lib/generated-sources.ts");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, banner + body);
console.log(`generated: ${outPath}`);
