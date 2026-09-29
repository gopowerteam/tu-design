import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import {
  CN_UTIL_SOURCE,
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
  });

  it("已有 components.json 时校验复用", () => {
    const io = fixture();
    runInit(io, "/proj", opts);
    const first = io.readFile("/proj/components.json");
    runInit(io, "/proj", { registry: "http://y/r/vue" });
    expect(io.readFile("/proj/components.json")).toBe(first);
  });

  it("tailwind 检测失败抛错且不写文件", () => {
    const io = memIo({ "/proj/package.json": JSON.stringify({}) });
    expect(() => runInit(io, "/proj", opts)).toThrow(/Tailwind/);
    expect(io.exists("/proj/components.json")).toBe(false);
  });
});
