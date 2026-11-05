import { basename, dirname } from "node:path/posix";
import { parse } from "yaml";
import type { RegistryFile, RegistryIndex, RegistryItem, RegistryMeta } from "./types";

const SCHEMA_ITEM = "https://ui.shadcn.com/schema/registry-item.json";
const SCHEMA_INDEX = "https://ui.shadcn.com/schema/registry.json";

export interface RegistryIo {
  readDir(path: string): string[];
  readFile(path: string): string;
}

/**
 * 递归收集组件目录下的相对文件路径（支持子目录，如 form-render/widgets/）。
 * 文件判定用 readFile 可读性：真实 fs 读目录抛 EISDIR、mock io 未知路径抛 ENOENT，
 * 两种实现下「可读 = 文件、不可读 = 目录」均成立。
 */
function collectRelativeFiles(io: RegistryIo, dir: string, prefix = ""): string[] {
  return io.readDir(dir).flatMap((name) => {
    const full = `${dir}/${name}`;
    const rel = prefix ? `${prefix}/${name}` : name;
    try {
      io.readFile(full);
      return [rel];
    } catch {
      return collectRelativeFiles(io, full, rel);
    }
  });
}

export function parseCatalog(workspaceYaml: string): Record<string, string> {
  const doc = parse(workspaceYaml) as { catalog?: Record<string, string> };
  return doc.catalog ?? {};
}

export function translateDeps(
  deps: Record<string, string>,
  catalog: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, spec] of Object.entries(deps)) {
    if (spec.startsWith("workspace:")) {
      throw new Error(`registry 禁止 workspace: 协议：${name}`);
    }
    if (spec === "catalog:") {
      const version = catalog[name];
      if (!version) {
        throw new Error(`catalog 缺少包 ${name} 的版本，无法生成 registry`);
      }
      out[name] = version;
    } else {
      out[name] = spec;
    }
  }
  return out;
}

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_, __: string, c: string) => c.toUpperCase());
}

/** 模块说明符出现位置：静态 from / 副作用 import / 动态 import()。 */
const SPECIFIER_PATTERNS = [
  /(\bfrom\s*)(["'])([^"']+)\2/g,
  /(\bimport\s+)(["'])([^"']+)\2/g,
  /(\bimport\s*\(\s*)(["'])([^"']+)\2/g,
];

/** 对内容里每个模块说明符施加 fn，保留原关键字与引号风格。 */
function mapSpecifiers(content: string, fn: (spec: string) => string): string {
  let out = content;
  for (const re of SPECIFIER_PATTERNS) {
    out = out.replace(re, (m, pre: string, q: string, spec: string) => {
      const next = fn(spec);
      return next === spec ? m : `${pre}${q}${next}${q}`;
    });
  }
  return out;
}

/** POSIX 相对解析：返回 fromDir 下解析 spec 后的路径。 */
function resolvePosix(fromDir: string, spec: string): string {
  const segs = fromDir.split("/").filter(Boolean);
  for (const part of spec.split("/")) {
    if (part === "..") segs.pop();
    else if (part !== "." && part !== "") segs.push(part);
  }
  return segs.join("/");
}

/** srcPath（别名根相对）所在目录解析相对说明符后的落点。 */
function resolveFromSrc(srcPath: string, spec: string): string {
  return resolvePosix(srcPath.split("/").slice(0, -1).join("/"), spec);
}

/** 改写/引用分析所需的布局坐标。 */
export interface ShippedLayout {
  /** 分发文件相对别名根（用户项目 `@` → src）的路径，如 src/components/slot/Slot.ts */
  srcPath: string;
  /** 组件目录相对别名根的路径，如 src/components（fixture 里就是 components） */
  componentsRel: string;
  /** 别名根目录名带斜杠前缀，如 "src/"；无法判定时为空串 */
  aliasPrefix: string;
}

const ALIAS_COMPONENTS = "@/components/";

/**
 * 分发产物的说明符归一。安装布局是 `components/ui/<dir>/`，而库内源码两种写法装机后都会断：
 * - `@/components/<dir>` 互引（库内 `@` → src）：装机后指向 `src/components/<dir>`，
 *   文件却在 `src/components/ui/<dir>` —— 补 `ui/` 段，与 shadcn 惯例一致；
 * - `../../lib/utils` 之类上溯到 components 之外：装机后落在 `src/components/lib/utils`
 *   —— 换成别名绝对形式 `@/lib/utils`（utils 的目标就是 lib/utils.ts）。
 * 落在 components 树内的相对引用（同目录、兄弟目录）在 ui 布局下依然成立，保持原样。
 */
export function rewriteShippedImports(content: string, layout: ShippedLayout): string {
  const { srcPath, componentsRel, aliasPrefix } = layout;
  return mapSpecifiers(content, (spec) => {
    if (spec.startsWith(ALIAS_COMPONENTS)) {
      return spec.startsWith(`${ALIAS_COMPONENTS}ui/`)
        ? spec
        : spec.replace(ALIAS_COMPONENTS, `${ALIAS_COMPONENTS}ui/`);
    }
    if (spec.startsWith(".")) {
      const landed = resolveFromSrc(srcPath, spec);
      if (landed === componentsRel || landed.startsWith(`${componentsRel}/`)) return spec;
      return `@/${landed.startsWith(aliasPrefix) ? landed.slice(aliasPrefix.length) : landed}`;
    }
    return spec;
  });
}

/** 分发文件的 registry type：按扩展名映射，未知扩展名不静默发布。 */
function fileTypeOf(name: string): string {
  if (name.endsWith(".vue")) return "registry:component";
  if (name.endsWith(".ts")) return "registry:lib";
  throw new Error(`registry 不支持分发 ${name}（仅 .vue/.ts，其它文件须先补 type 映射）`);
}

/**
 * 该说明符（改写后）引用了哪个组件目录；非组件引用（utils/tokens/三方包/自身目录）返回 null。
 */
function referencedComponent(ownDir: string, layout: ShippedLayout, spec: string): string | null {
  const alias = /^@\/components\/(?:ui\/)?([^/]+)/.exec(spec);
  if (alias) return alias[1] === ownDir ? null : alias[1];
  if (spec.startsWith(".")) {
    const landed = resolveFromSrc(layout.srcPath, spec);
    if (!landed.startsWith(`${layout.componentsRel}/`)) return null;
    const top = landed.slice(layout.componentsRel.length + 1).split("/")[0];
    return !top || top === ownDir ? null : top;
  }
  return null;
}

/** 汇总一个 item 分发源码里的跨组件引用集，用于反查 registryDependencies 漏声明。 */
function collectCrossRefs(
  dir: string,
  files: { path: string; content: string }[],
  componentsRel: string,
  aliasPrefix: string,
): Set<string> {
  const refs = new Set<string>();
  for (const file of files) {
    const layout: ShippedLayout = {
      srcPath: `${componentsRel}/${file.path}`,
      componentsRel,
      aliasPrefix,
    };
    mapSpecifiers(file.content, (spec) => {
      const hit = referencedComponent(dir, layout, spec);
      if (hit) refs.add(hit);
      return spec;
    });
  }
  return refs;
}

/**
 * tokens.css 里的 `@import "<pkg>"` 必须声明为 npm 依赖，否则用户项目首屏构建报
 * Can't resolve。版本取自 catalog（与库内开发同源）；catalog 缺版本即生成失败 ——
 * 发布一个装完就跑不起来的 style 项比生成报错更糟。
 */
function cssImportDependencies(css: string, catalog: Record<string, string>): string[] {
  const names = new Set(
    [...css.matchAll(/@import\s+["']([^"']+)["']/g)]
      .map((m) => m[1]!)
      .filter((spec) => !/^(\.|~|url\()/.test(spec)),
  );
  return [...names].sort().map((name) => {
    const version = catalog[name];
    if (!version) {
      throw new Error(`tokens.css @import 了 ${name}，但 catalog 没有该包版本，无法声明其依赖`);
    }
    return `${name}@${version}`;
  });
}

/**
 * 分发源码 import 的外部 npm 包集合（子路径归一到裸包名：`@scope/pkg/x` → `@scope/pkg`）。
 * 相对引用与 `@/` 别名（跨组件/lib 引用，归 registryDependencies 校验管）豁免；
 * `vue` 是 peerDependencies、meta 按惯例不声明，同样豁免。
 * `@/` 豁免必须精确匹配两字符前缀，否则会误豁免 @scope 形式的 npm 包。
 */
function collectExternalImports(files: RegistryFile[]): Set<string> {
  const names = new Set<string>();
  for (const file of files) {
    mapSpecifiers(file.content, (spec) => {
      if (spec.startsWith(".") || spec.startsWith("@/")) return spec;
      if (spec === "vue" || spec.startsWith("vue/")) return spec;
      names.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!);
      return spec;
    });
  }
  return names;
}

/** 官方 registry-item schema 的 dependencies 是字符串数组 —— 以 name@version 形式钉具体版本。 */
function toNameAtVersion(deps: Record<string, string>): string[] {
  return Object.entries(deps).map(([name, version]) => `${name}@${version}`);
}

export function generateRegistry(
  io: RegistryIo,
  input: {
    componentsDir: string;
    utilsPath: string;
    tokensPath: string;
    workspaceYaml: string;
    version: string;
  },
): { items: RegistryItem[]; index: RegistryIndex } {
  const catalog = parseCatalog(input.workspaceYaml);
  const items: RegistryItem[] = [];
  /** 目录名 → 分发源码里真实出现的跨组件引用集，用于反查 registryDependencies 漏声明 */
  const refsByName = new Map<string, Set<string>>();

  // 别名根 = componentsDir 的父目录（库内 src，装机后是用户的 src）；
  // 说明符改写与引用分析都要在「别名根相对」这条坐标下进行。
  const aliasRoot = dirname(input.componentsDir);
  const aliasPrefix = !aliasRoot || aliasRoot === "." ? "" : `${basename(aliasRoot)}/`;
  const componentsRel = `${aliasPrefix}${basename(input.componentsDir)}`;

  for (const dir of io.readDir(input.componentsDir).slice().sort()) {
    let metaRaw: string;
    try {
      metaRaw = io.readFile(`${input.componentsDir}/${dir}/registry.meta.json`);
    } catch {
      // 静默跳过会让新组件「凭空消失」于 registry 且不报错，必须显式失败
      throw new Error(
        `组件目录 ${input.componentsDir}/${dir} 缺 registry.meta.json —— 新组件须补 meta 才能进 registry`,
      );
    }
    const meta = JSON.parse(metaRaw) as RegistryMeta;
    const files: RegistryFile[] = collectRelativeFiles(io, `${input.componentsDir}/${dir}`)
      .filter((f) => f !== "registry.meta.json" && !f.endsWith(".test.ts"))
      .sort()
      .map((f) => {
        const path = `${dir}/${f}`;
        return {
          path,
          type: fileTypeOf(f),
          target: `components/ui/${dir}/${f}`,
          content: rewriteShippedImports(io.readFile(`${input.componentsDir}/${dir}/${f}`), {
            srcPath: `${componentsRel}/${path}`,
            componentsRel,
            aliasPrefix,
          }),
        };
      });
    refsByName.set(dir, collectCrossRefs(dir, files, componentsRel, aliasPrefix));
    const dependencies = translateDeps(meta.dependencies ?? {}, catalog);
    const devDependencies = translateDeps(meta.devDependencies ?? {}, catalog);
    // npm 依赖完整性：meta 的 dependencies 是 CLI 安装的真相源，分发源码里真实出现的
    // 外部包必须声明，否则 add 装出的代码在 pnpm 严格 node_modules 下 typecheck 解析失败
    // （真实事故：date-shared 的 positioning.ts 直引 @zag-js/popper 却漏声明）。只查 missing，
    // 不查 extra（声明了但源码未用的包不影响安装正确性）。
    const imported = collectExternalImports(files);
    const declaredDeps = new Set([
      ...Object.keys(meta.dependencies ?? {}),
      ...Object.keys(meta.devDependencies ?? {}),
    ]);
    const missingDeps = [...imported].filter((name) => !declaredDeps.has(name)).sort();
    if (missingDeps.length > 0) {
      throw new Error(
        `${dir} 的分发源码 import 了 npm 包 ${missingDeps.join("、")}，但 registry.meta.json 的 dependencies 未声明（add ${dir} 会装出 typecheck 解析失败的 broken 代码）`,
      );
    }
    items.push({
      $schema: SCHEMA_ITEM,
      name: dir,
      version: input.version,
      type: "registry:ui",
      description: meta.description,
      ...(meta.registryDependencies?.length
        ? { registryDependencies: meta.registryDependencies }
        : {}),
      ...(Object.keys(dependencies).length ? { dependencies: toNameAtVersion(dependencies) } : {}),
      ...(Object.keys(devDependencies).length
        ? { devDependencies: toNameAtVersion(devDependencies) }
        : {}),
      files,
    });
  }

  items.push({
    $schema: SCHEMA_ITEM,
    name: "utils",
    version: input.version,
    type: "registry:lib",
    description: "cn 类名合并工具（clsx + tailwind-merge）。",
    dependencies: toNameAtVersion(
      translateDeps(
        {
          clsx: "catalog:",
          "tailwind-merge": "catalog:",
          "class-variance-authority": "catalog:",
        },
        catalog,
      ),
    ),
    files: [
      {
        path: "lib/utils.ts",
        type: "registry:lib",
        target: "lib/utils.ts",
        content: io.readFile(input.utilsPath),
      },
    ],
  });

  const tokensDeps = cssImportDependencies(io.readFile(input.tokensPath), catalog);
  items.push({
    $schema: SCHEMA_ITEM,
    name: "tokens",
    version: input.version,
    type: "registry:style",
    description: "Tailwind CSS v4 语义 tokens（shadcn 官方 v4 集合）。",
    ...(tokensDeps.length ? { dependencies: tokensDeps } : {}),
    files: [
      {
        path: "styles/tokens.css",
        type: "registry:style",
        target: "styles/tokens.css",
        content: io.readFile(input.tokensPath),
      },
    ],
  });

  // 依赖完整性：meta 的 registryDependencies 是 CLI 拓扑安装的真相源，
  // 漏声明 = 用户装出来的代码 import 指向未安装的目录。只查 missing，
  // 不查 extra（模板用途的组件无静态 import，扫不到属正常）。
  const knownNames = new Set(items.map((i) => i.name));
  for (const item of items) {
    const refs = refsByName.get(item.name);
    if (!refs || refs.size === 0) continue;
    const declared = new Set(item.registryDependencies ?? []);
    const missing = [...refs].filter((r) => !declared.has(r)).sort();
    if (missing.length > 0) {
      throw new Error(
        `${item.name} 的源码 import 了 ${missing.join("、")}，但 registry.meta.json 的 registryDependencies 未声明（add ${item.name} 会装出缺文件的 broken 代码）`,
      );
    }
    const unknown = [...refs].filter((r) => !knownNames.has(r)).sort();
    if (unknown.length > 0) {
      throw new Error(`${item.name} 引用了不存在的 registry 项：${unknown.join("、")}`);
    }
  }

  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  const index: RegistryIndex = {
    $schema: SCHEMA_INDEX,
    name: "tu-design",
    items: sorted.map((i) => ({
      name: i.name,
      version: i.version,
      title: toPascal(i.name),
      type: i.type,
      description: i.description,
    })),
  };

  return { items: sorted, index };
}
