import { readFileSync, writeFileSync } from "node:fs";

/**
 * vp pack 的 exports 写回会把 bin 键名改写为包名末段（"cli"），
 * 与 spec §3 pin 的 CLI bin 名 `tu-design` 冲突 —— build 后恢复。
 */
const path = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(path, "utf8")) as { bin?: Record<string, string> };
pkg.bin = { "tu-design": "./dist/index.mjs" };
writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
