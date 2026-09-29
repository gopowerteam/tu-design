import { describe, expect, it } from "vite-plus/test";
import { collectDeps, resolveTopo, runAdd } from "./add-core";
import { defaultConfig } from "./config";
import type { RegistryItem } from "./registry-types";
import type { Io } from "./io";

function item(
  name: string,
  registryDependencies: string[] = [],
  dependencies: string[] = [],
): RegistryItem {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:ui",
    ...(registryDependencies.length ? { registryDependencies } : {}),
    ...(dependencies.length ? { dependencies } : {}),
    files: [
      {
        path: `${name}/${name}.vue`,
        type: "registry:component",
        target: `components/ui/${name}/${name}.vue`,
        content: `<template><!-- ${name} --></template>`,
      },
    ],
  };
}

const ITEMS: Record<string, RegistryItem> = {
  button: item("button", ["utils"], ["clsx@^2"]),
  utils: item("utils", [], ["tailwind-merge@^3"]),
  a: item("a", ["b"]),
  b: item("b", ["a"]),
  solo: item("solo"),
};

describe("resolveTopo", () => {
  const fetchOne = async (n: string) => {
    const it = ITEMS[n];
    if (!it) throw new Error(`no item ${n}`);
    return it;
  };

  it("拓扑序依赖在前", async () => {
    const out = await resolveTopo(["button"], fetchOne);
    expect(out.map((i) => i.name)).toEqual(["utils", "button"]);
  });

  it("重复输入只产出一次", async () => {
    const out = await resolveTopo(["button", "button"], fetchOne);
    expect(out.map((i) => i.name)).toEqual(["utils", "button"]);
  });

  it("环引用报错并列出路径", async () => {
    await expect(resolveTopo(["a"], fetchOne)).rejects.toThrow(/a -> b -> a/);
  });
});

describe("collectDeps", () => {
  it("合并去重保持出现序", () => {
    const r = collectDeps([
      item("x", [], ["clsx@^2"]),
      item("y", [], ["clsx@^2", "tailwind-merge@^3"]),
    ]);
    expect(r.dependencies).toEqual(["clsx@^2", "tailwind-merge@^3"]);
    expect(r.devDependencies).toEqual([]);
  });

  it("出现序按 items 传入顺序（拓扑序）", () => {
    const r = collectDeps([ITEMS.utils, ITEMS.button]);
    expect(r.dependencies).toEqual(["tailwind-merge@^3", "clsx@^2"]);
  });
});

function memIo(files: Record<string, string> = {}) {
  const store = { ...files };
  const io: Io & {
    fetchJson: (url: string) => Promise<unknown>;
    exec: (cmd: string[]) => void;
    snapshot: () => Record<string, string>;
  } = {
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
    fetchJson: async (url) => {
      const name = url
        .split("/")
        .pop()!
        .replace(/\.json$/, "");
      const it = ITEMS[name];
      if (!it) throw new Error(`404 ${name}`);
      return it;
    },
    exec: (cmd) => {
      store["__exec__"] = JSON.stringify(cmd);
    },
    snapshot: () => ({ ...store }),
  };
  return io;
}

function project(): Record<string, string> {
  const files: Record<string, string> = {
    "/proj/components.json": JSON.stringify(defaultConfig("http://r/vue")),
    "/proj/package.json": JSON.stringify({}),
  };
  return files;
}

describe("runAdd", () => {
  it("集成：写入文件并安装依赖", async () => {
    const io = memIo(project());
    const summary = await runAdd(io, "/proj/a/b", ["button"], {});
    expect(summary.files).toContain("/proj/src/components/ui/button/button.vue");
    expect(summary.dependencies).toEqual(["tailwind-merge@^3", "clsx@^2"]);
    const cmd = JSON.parse(io.readFile("__exec__")) as string[];
    expect(cmd).toContain("clsx@^2");
    expect(io.readFile("/proj/src/components/ui/button/button.vue")).toContain("button");
  });

  it("无依赖时不 exec", async () => {
    const io = memIo(project());
    await runAdd(io, "/proj", ["solo"], {});
    expect(io.exists("__exec__")).toBe(false);
  });
});
