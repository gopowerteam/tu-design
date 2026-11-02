import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { AGENTS_MD_SOURCE } from "./ai-rules";
import {
  CN_UTIL_SOURCE,
  RUNTIME_DEPS,
  TOKENS_CSS_SOURCE,
  detectTailwindV4,
  mergeTokensCss,
  runInit,
} from "./init-core";
import type { Io } from "./io";

function memIo(files: Record<string, string> = {}) {
  const store = { ...files };
  const io: Io & { snapshot(): Record<string, string> } = {
    exists: (p) => p in store,
    readFile: (p) => {
      const c = store[p];
      if (c === undefined) throw new Error(`ENOENT: ${p}`);
      return c;
    },
    writeFile: (p, c) => {
      store[p] = c;
    },
    readDir: () => [],
    snapshot: () => ({ ...store }),
  };
  return io;
}

const PKG_OK = {
  devDependencies: { tailwindcss: "^4.1.0" },
};
const CSS_OK = `@import "tailwindcss";\nbody { color: red; }\n`;

function fixture() {
  return memIo({
    "/proj/package.json": JSON.stringify(PKG_OK),
    "/proj/src/assets/main.css": CSS_OK,
  });
}

describe("detectTailwindV4", () => {
  it("依赖与 css import 齐备 → true", () => expect(detectTailwindV4(PKG_OK, CSS_OK)).toBe(true));

  it("缺 tailwindcss 依赖 → false", () => expect(detectTailwindV4({}, CSS_OK)).toBe(false));

  it("tailwindcss 非 v4 → false", () =>
    expect(detectTailwindV4({ devDependencies: { tailwindcss: "^3.4.0" } }, CSS_OK)).toBe(false));

  it("css 无 @import tailwindcss → false", () =>
    expect(detectTailwindV4(PKG_OK, "body {}")).toBe(false));
});

describe("mergeTokensCss", () => {
  const tokens = TOKENS_CSS_SOURCE;

  it("幂等：已含 @custom-variant dark 时原样返回", () => {
    const css = `@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));`;
    expect(mergeTokensCss(css, tokens)).toBe(css);
  });

  it("插入位置紧随 tailwind import", () => {
    const out = mergeTokensCss(CSS_OK, tokens);
    expect(out.indexOf("@custom-variant")).toBeGreaterThan(out.indexOf('@import "tailwindcss"'));
  });
});

describe("TOKENS_CSS_SOURCE / CN_UTIL_SOURCE", () => {
  it("TOKENS_CSS_SOURCE 与 @tu-design/vue 的 tokens.css 一致（防漂移）", () => {
    const real = readFileSync(
      new URL("../../../vue/src/styles/tokens.css", import.meta.url),
      "utf8",
    );
    expect(TOKENS_CSS_SOURCE.trimEnd()).toBe(real.trimEnd());
  });

  it("CN_UTIL_SOURCE 导出 cn 且使用 clsx + tailwind-merge", () => {
    expect(CN_UTIL_SOURCE).toContain("export function cn");
    expect(CN_UTIL_SOURCE).toContain("clsx");
    expect(CN_UTIL_SOURCE).toContain("twMerge");
  });
});

/** 源码（TS import / CSS @import）里引用的裸包名，去重排序。 */
function barePackageRefs(source: string): string[] {
  const specs = [
    ...[...source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g)].map((m) => m[1]!),
    ...[...source.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]!),
  ];
  return [...new Set(specs.filter((s) => !s.startsWith(".")))].sort();
}

// 真实事故：init 注入的 tokens.css 有 `@import "tw-animate-css"`，但安装清单没有它，
// 每个新项目首屏构建即 Can't resolve。清单由注入内容反推，而不是靠人记住。
describe.each([
  ["TOKENS_CSS_SOURCE", TOKENS_CSS_SOURCE],
  ["CN_UTIL_SOURCE", CN_UTIL_SOURCE],
  ["AGENTS_MD_SOURCE", AGENTS_MD_SOURCE],
])("RUNTIME_DEPS 覆盖 %s", (_name, source) => {
  it("注入内容的每个裸包引用都会被 init 装上", () => {
    expect(barePackageRefs(source).filter((n) => !RUNTIME_DEPS.includes(n))).toEqual([]);
  });
});

describe("runInit", () => {
  const opts = { registry: "http://x/r/vue" };

  it("写出 components.json 与 cn 工具（alias 解析到 src/lib/utils.ts）", () => {
    const io = fixture();
    const s = runInit(io, "/proj", opts);
    expect(s.configPath).toBe("/proj/components.json");
    expect(s.cnPath).toBe("/proj/src/lib/utils.ts");
    expect(io.exists("/proj/components.json")).toBe(true);
    const cfg = JSON.parse(io.readFile("/proj/components.json"));
    expect(cfg.framework).toBe("vue");
    expect(cfg.registry).toBe("http://x/r/vue");
    expect(io.readFile("/proj/src/lib/utils.ts")).toContain("export function cn");
    expect(s.skippedCss).toBe(false);
    expect(io.readFile("/proj/src/assets/main.css")).toContain("@custom-variant");
  });

  it("二次执行幂等：文件不再变化", () => {
    const io = fixture();
    runInit(io, "/proj", opts);
    const snap = io.snapshot();
    const s2 = runInit(io, "/proj", opts);
    expect(io.snapshot()).toEqual(snap);
    expect(s2.skippedCss).toBe(true);
    expect(s2.skippedAgents).toBe(true);
  });

  it("已有 components.json 时校验复用", () => {
    const io = fixture();
    runInit(io, "/proj", opts);
    const first = io.readFile("/proj/components.json");
    runInit(io, "/proj", { registry: "http://y/r/vue" });
    expect(io.readFile("/proj/components.json")).toBe(first);
  });

  it("缺 package.json 时报错提示在项目根运行", () => {
    const io = memIo({ "/proj/src/assets/main.css": CSS_OK });
    expect(() => runInit(io, "/proj", opts)).toThrow(/未找到 \/proj\/package\.json/);
  });

  it("package.json 语法损坏时报错点名文件", () => {
    const io = memIo({ "/proj/package.json": "{", "/proj/src/assets/main.css": CSS_OK });
    expect(() => runInit(io, "/proj", opts)).toThrow(/package\.json 不是合法 JSON/);
  });

  it("已存在的 components.json 语法损坏时报错点名文件", () => {
    const io = fixture();
    runInit(io, "/proj", opts);
    io.writeFile("/proj/components.json", "{ oops");
    expect(() => runInit(io, "/proj", opts)).toThrow(/components\.json 不是合法 JSON/);
  });

  it("tailwind 检测失败抛错且不写文件", () => {
    const io = memIo({ "/proj/package.json": JSON.stringify({}) });
    expect(() => runInit(io, "/proj", opts)).toThrow(/Tailwind/);
    expect(io.exists("/proj/components.json")).toBe(false);
  });

  it("css 在非默认常见路径时探测命中（vue-ts 模板 src/style.css）", () => {
    const io = memIo({
      "/proj/package.json": JSON.stringify(PKG_OK),
      "/proj/src/style.css": CSS_OK,
    });
    const s = runInit(io, "/proj", opts);
    expect(s.cssPath).toBe("/proj/src/style.css");
    expect(io.readFile("/proj/src/style.css")).toContain("@custom-variant");
  });

  it("opts.css 显式指定路径优先", () => {
    const io = memIo({
      "/proj/package.json": JSON.stringify(PKG_OK),
      "/proj/custom/app.css": CSS_OK,
    });
    const s = runInit(io, "/proj", { ...opts, css: "custom/app.css" });
    expect(s.cssPath).toBe("/proj/custom/app.css");
  });

  it("默认写入 AGENTS.md 且内容含 CLI 安装命令", () => {
    const io = fixture();
    const s = runInit(io, "/proj", opts);
    expect(s.agentsPath).toBe("/proj/AGENTS.md");
    expect(s.skippedAgents).toBe(false);
    expect(io.readFile("/proj/AGENTS.md")).toContain("npx @tu-design/cli add");
  });

  it("AGENTS.md 已存在时不覆盖", () => {
    const io = fixture();
    io.writeFile("/proj/AGENTS.md", "# 自定义规则");
    const s = runInit(io, "/proj", opts);
    expect(s.skippedAgents).toBe(true);
    expect(io.readFile("/proj/AGENTS.md")).toBe("# 自定义规则");
  });

  it("agents: false 时跳过不写", () => {
    const io = fixture();
    const s = runInit(io, "/proj", { ...opts, agents: false });
    expect(s.skippedAgents).toBe(true);
    expect(io.exists("/proj/AGENTS.md")).toBe(false);
  });
});
