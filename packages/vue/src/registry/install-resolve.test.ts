import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import type { RegistryItem } from "./types";

/**
 * 装机可解析性：每个 item 的源码 import，必须能在「该 item + 其传递 registryDependencies」
 * 的文件集里找到落点。这是 CLI 分发链路的真实验收标准 —— 漏声明依赖或 import 前缀写错，
 * 用户 add 出来的代码就是编译不过的 broken 文件，而单测与类型检查都在库内别名下跑，看不见它。
 *
 * 别名按 init 写入的配置解析（`@` → `<项目>/src`），文件落点即 item 的 target。
 * 三方包说明符（vue / @ark-ui / @tanstack / clsx …）由 npm dependencies 负责，不在此校验。
 */
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const registryDir = join(pkgDir, "registry", "vue");

const items: RegistryItem[] = readdirSync(registryDir)
  .filter((f) => f.endsWith(".json") && f !== "registry.json")
  .map((f) => JSON.parse(readFileSync(join(registryDir, f), "utf8")) as RegistryItem);

const byName = new Map(items.map((i) => [i.name, i]));

/** 传递依赖拓扑展开（含自身）→ 安装后落盘的文件路径集合（相对项目根） */
function installedFiles(name: string, seen = new Set<string>()): Set<string> {
  if (seen.has(name)) return seen;
  seen.add(name);
  for (const dep of byName.get(name)?.registryDependencies ?? []) installedFiles(dep, seen);
  const out = new Set<string>();
  for (const n of seen) {
    for (const file of byName.get(n)?.files ?? []) out.add(`src/${file.target}`);
  }
  return out;
}

function specifiers(content: string): string[] {
  const out: string[] = [];
  for (const re of [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) out.push(m[1]!);
  }
  return out;
}

/** 纯 POSIX 相对解析（分发 target 恒为 / 分隔） */
function resolveRelative(fromDir: string, spec: string): string {
  const segs = fromDir.split("/").filter(Boolean);
  for (const part of spec.split("/")) {
    if (part === "..") segs.pop();
    else if (part !== "." && part !== "") segs.push(part);
  }
  return segs.join("/");
}

/** 模块落点：目录形式补 index，源码文件补扩展名 */
function resolves(files: Set<string>, pathNoExt: string): boolean {
  return [
    pathNoExt,
    `${pathNoExt}.ts`,
    `${pathNoExt}.vue`,
    `${pathNoExt}/index.ts`,
    `${pathNoExt}/index.vue`,
  ].some((c) => files.has(c));
}

describe("registry 装机可解析性", () => {
  it("registry 非空（防止 glob 失配导致校验空跑）", () => {
    expect(items.length).toBeGreaterThan(40);
  });

  it.each(items.map((i) => [i.name, i] as const))(
    "%s 的内部 import 均在安装集内可解析",
    (_name, item) => {
      const files = installedFiles(item.name);
      const broken: string[] = [];
      for (const file of item.files) {
        for (const spec of specifiers(file.content)) {
          let target: string | null = null;
          if (spec.startsWith("@/")) target = `src/${spec.slice(2)}`;
          else if (spec.startsWith("."))
            target = resolveRelative(`src/${dirname(file.target)}`, spec);
          if (!target) continue;
          // tokens.css 是被合并进全局样式的资源，不作为模块被 import
          if (!resolves(files, target)) broken.push(`${file.target} → ${spec}（落点 ${target}）`);
        }
      }
      expect(broken).toEqual([]);
    },
  );
});
