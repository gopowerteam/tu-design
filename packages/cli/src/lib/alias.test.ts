import { describe, expect, it } from "vite-plus/test";
import { applyAliases, mergeTsconfigPaths, mergeViteAlias } from "./alias";
import type { Io } from "./io";

function memIo(files: Record<string, string> = {}) {
  const store = { ...files };
  const io: Io = {
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
  return io;
}

describe("mergeTsconfigPaths", () => {
  it("无 compilerOptions 时注入 paths 与 @/*", () => {
    const out = mergeTsconfigPaths("{}", { "@/*": ["./src/*"] });
    expect(out).toContain('"paths"');
    expect(out).toContain('"@/*"');
    expect(out).toContain("./src/*");
  });

  it("已有 paths 时合并不丢原键", () => {
    const source = JSON.stringify({
      compilerOptions: { paths: { "@/*": ["./app/*"] } },
    });
    const out = mergeTsconfigPaths(source, { "@/*": ["./src/*"] });
    const parsed = JSON.parse(out);
    expect(parsed.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
  });

  it("新键与已有键共存", () => {
    const source = JSON.stringify({
      compilerOptions: { paths: { "@components/*": ["./app/components/*"] } },
    });
    const out = mergeTsconfigPaths(source, { "@/*": ["./src/*"] });
    const parsed = JSON.parse(out);
    expect(parsed.compilerOptions.paths["@components/*"]).toEqual(["./app/components/*"]);
    expect(parsed.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
  });

  it("非法 JSON 返回原文", () => {
    expect(mergeTsconfigPaths("not json", { "@/*": ["./src/*"] })).toBe("not json");
  });
});

describe("mergeViteAlias", () => {
  it("空 defineConfig 注入 resolve.alias", () => {
    const out = mergeViteAlias("export default defineConfig({});\n", {
      find: "@",
      replacement: `new URL("./src", import.meta.url).pathname`,
    });
    expect(out).toContain("resolve");
    expect(out).toContain("alias");
    expect(out).toContain('"@"');
    expect(out).toContain("new URL");
  });

  it("无 defineConfig 返回原文", () => {
    const src = "export default {};\n";
    expect(mergeViteAlias(src, { find: "@", replacement: "x" })).toBe(src);
  });

  it("已有 alias 时追加键", () => {
    const src = `export default defineConfig({\n  resolve: {\n    alias: {\n      "@x": "/x",\n    },\n  },\n});\n`;
    const out = mergeViteAlias(src, { find: "@", replacement: "/src" });
    expect(out).toContain('"@x"');
    expect(out).toContain('"@"');
  });

  it("resolve 存在但无 alias 时补 alias 块", () => {
    const src = `export default defineConfig({\n  resolve: {\n    extensions: [".ts"],\n  },\n});\n`;
    const out = mergeViteAlias(src, { find: "@", replacement: "/src" });
    expect(out).toContain("alias");
    expect(out).toContain('"@"');
  });
});

describe("applyAliases", () => {
  it("改写 tsconfig.json 与 vite.config.ts", () => {
    const io = memIo({
      "/proj/tsconfig.json": JSON.stringify({ compilerOptions: {} }),
      "/proj/vite.config.ts": "export default defineConfig({});\n",
    });
    applyAliases(io, "/proj", "src");
    expect(io.readFile("/proj/tsconfig.json")).toContain("./src/*");
    const vite = io.readFile("/proj/vite.config.ts");
    expect(vite).toContain("alias");
    expect(vite).toContain('"/proj/src"');
  });

  it("文件不存在时静默跳过", () => {
    const io = memIo({});
    expect(() => applyAliases(io, "/proj", "src")).not.toThrow();
  });
});
