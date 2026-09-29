import { describe, expect, it } from "vite-plus/test";
import { defaultConfig, loadConfig, saveConfig, validateConfig } from "./config";
import type { Io } from "./io";

function memIo(files: Record<string, string> = {}): Io & { files: Record<string, string> } {
  const store = { ...files };
  return {
    files: store,
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
  };
}

describe("validateConfig", () => {
  it("空对象抛错且包含 framework", () => expect(() => validateConfig({})).toThrow(/framework/));

  it("framework 非 vue 抛错", () =>
    expect(() => validateConfig({ framework: "react" })).toThrow(/framework/));

  it("缺 aliases 子键时逐项列出", () => {
    const cfg = defaultConfig("https://x/r/vue") as unknown as Record<string, unknown>;
    delete (cfg.aliases as Record<string, unknown>).ui;
    expect(() => validateConfig(cfg)).toThrow(/aliases\.ui/);
  });

  it("合法配置通过并原样返回", () => {
    const cfg = defaultConfig("https://x/r/vue");
    expect(validateConfig(JSON.parse(JSON.stringify(cfg)))).toEqual(cfg);
  });
});

describe("loadConfig / saveConfig", () => {
  it("save 后 load 返回等价配置", () => {
    const io = memIo();
    saveConfig(io, "/proj", defaultConfig("https://x/r/vue"));
    expect(loadConfig(io, "/proj")).toEqual(defaultConfig("https://x/r/vue"));
  });

  it("components.json 不存在时抛错文案含 init", () =>
    expect(() => loadConfig(memIo(), "/proj")).toThrow(/init/));
});
