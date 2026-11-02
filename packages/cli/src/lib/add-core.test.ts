import { describe, expect, it } from "vite-plus/test";
import { collectDeps, resolveTopo, runAdd } from "./add-core";
import { defaultConfig } from "./config";
import { hashContent, readLockfile } from "./lockfile";
import type { Lockfile } from "./lockfile";
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

function multiFileItem(name: string): RegistryItem {
  return {
    ...item(name),
    files: [
      {
        path: `${name}/A.vue`,
        type: "registry:component",
        target: `components/ui/${name}/A.vue`,
        content: `A:${name}`,
      },
      {
        path: `${name}/B.vue`,
        type: "registry:component",
        target: `components/ui/${name}/B.vue`,
        content: `B:${name}`,
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
  multi: multiFileItem("multi"),
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
  const SOLO_TARGET = "/proj/src/components/ui/solo/solo.vue";
  const MULTI_A = "/proj/src/components/ui/multi/A.vue";
  const MULTI_B = "/proj/src/components/ui/multi/B.vue";
  const LOCK_PATH = "/proj/components.lock.json";

  it("集成：写入文件并安装依赖，lockfile 记录 version 与文件 hash", async () => {
    const io = memIo(project());
    const summary = await runAdd(io, "/proj/a/b", ["button"], {});
    expect(summary.files).toContain("/proj/src/components/ui/button/button.vue");
    expect(summary.overwrites).toEqual([]);
    expect(summary.dependencies).toEqual(["tailwind-merge@^3", "clsx@^2"]);
    const cmd = JSON.parse(io.readFile("__exec__")) as string[];
    expect(cmd).toContain("clsx@^2");
    expect(io.readFile("/proj/src/components/ui/button/button.vue")).toContain("button");
    // 拓扑序里 utils + button 全部写入 → 两者都记入 lockfile
    const lock = readLockfile(io, "/proj");
    expect(lock.lockfileVersion).toBe(1);
    expect(lock.packages.button?.version).toBeNull();
    expect(lock.packages.utils?.version).toBeNull();
    expect(Object.keys(lock.packages.button?.files ?? {})).toEqual([
      "/proj/src/components/ui/button/button.vue",
    ]);
    expect(lock.packages.button?.files["/proj/src/components/ui/button/button.vue"]).toBe(
      hashContent("<template><!-- button --></template>"),
    );
  });

  it("registry item 带 version → lockfile 记录该版本", async () => {
    const io = memIo(project());
    io.fetchJson = async () => ({ ...item("solo"), version: "2.3.4" });
    await runAdd(io, "/proj", ["solo"], {});
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.solo?.version).toBe("2.3.4");
  });

  it("已存在且内容相同 → upToDate，不写入、lockfile 不新建条目", async () => {
    const io = memIo({ ...project(), [SOLO_TARGET]: "<template><!-- solo --></template>" });
    const summary = await runAdd(io, "/proj", ["solo"], {});
    expect(summary.files).toEqual([]);
    expect(summary.upToDate).toEqual([SOLO_TARGET]);
    expect(summary.overwrites).toEqual([]);
    expect(summary.conflicts).toEqual([]);
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.solo).toBeUndefined();
  });

  it("冲突且未覆盖 → conflicts，lockfile 不新建条目", async () => {
    const io = memIo({ ...project(), [SOLO_TARGET]: "user-edited" });
    const summary = await runAdd(io, "/proj", ["solo"], {});
    expect(summary.conflicts).toEqual([SOLO_TARGET]);
    expect(summary.files).toEqual([]);
    expect(readLockfile(io, "/proj").packages.solo).toBeUndefined();
  });

  it("已有 lockfile 条目且本次未全写 → 条目保持原值", async () => {
    const existing: Lockfile = {
      lockfileVersion: 1,
      packages: {
        solo: { version: "1.0.0", files: { [SOLO_TARGET]: hashContent("1.0.0-content") } },
      },
    };
    const io = memIo({
      ...project(),
      [SOLO_TARGET]: "user-edited",
      [LOCK_PATH]: `${JSON.stringify(existing, null, 2)}\n`,
    });
    await runAdd(io, "/proj", ["solo"], {});
    expect(readLockfile(io, "/proj")).toEqual(existing);
  });

  it("--overwrite 覆盖 → written+overwrites，lockfile 更新为新 hash", async () => {
    const io = memIo({ ...project(), [SOLO_TARGET]: "user-edited" });
    const summary = await runAdd(io, "/proj", ["solo"], { overwrite: true });
    expect(summary.files).toEqual([SOLO_TARGET]);
    expect(summary.overwrites).toEqual([SOLO_TARGET]);
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.solo?.files[SOLO_TARGET]).toBe(
      hashContent("<template><!-- solo --></template>"),
    );
  });

  it("多文件组件部分跳过 → 该 item 的 lockfile 条目保持原样", async () => {
    const io = memIo({ ...project(), [MULTI_A]: "user-edited" }); // A 冲突跳过，B 新文件写入
    const summary = await runAdd(io, "/proj", ["multi"], {});
    expect(summary.conflicts).toEqual([MULTI_A]);
    expect(summary.files).toEqual([MULTI_B]);
    expect(readLockfile(io, "/proj").packages.multi).toBeUndefined();
  });

  it("多文件组件全部写入 → lockfile 记录全部落点", async () => {
    const io = memIo(project());
    await runAdd(io, "/proj", ["multi"], {});
    const lock = readLockfile(io, "/proj");
    expect(Object.keys(lock.packages.multi?.files ?? {}).sort()).toEqual([MULTI_A, MULTI_B].sort());
  });

  it("dry-run：不写盘、不装依赖、不写 lockfile，报告将写入文件", async () => {
    const io = memIo(project());
    const summary = await runAdd(io, "/proj", ["button"], { dryRun: true });
    expect(summary.dryRun).toBe(true);
    expect(summary.files).toEqual([
      "/proj/src/components/ui/utils/utils.vue",
      "/proj/src/components/ui/button/button.vue",
    ]);
    expect(summary.overwrites).toEqual([]);
    expect(summary.upToDate).toEqual([]);
    expect(summary.conflicts).toEqual([]);
    expect(summary.declined).toEqual([]);
    expect(io.exists("/proj/src/components/ui/button/button.vue")).toBe(false);
    expect(io.exists(LOCK_PATH)).toBe(false);
    expect(io.exists("__exec__")).toBe(false);
  });

  it("dry-run：内容相同 → upToDate；不同 → files+overwrites；conflicts 恒空", async () => {
    const same = memIo({ ...project(), [SOLO_TARGET]: "<template><!-- solo --></template>" });
    const s1 = await runAdd(same, "/proj", ["solo"], { dryRun: true });
    expect(s1.upToDate).toEqual([SOLO_TARGET]);
    expect(s1.files).toEqual([]);
    expect(s1.overwrites).toEqual([]);
    expect(s1.conflicts).toEqual([]);

    const edited = memIo({ ...project(), [SOLO_TARGET]: "user-edited" });
    const s2 = await runAdd(edited, "/proj", ["solo"], { dryRun: true });
    expect(s2.files).toEqual([SOLO_TARGET]);
    expect(s2.overwrites).toEqual([SOLO_TARGET]);
    expect(s2.conflicts).toEqual([]);
    expect(edited.readFile(SOLO_TARGET)).toBe("user-edited");
  });

  it("无依赖时不 exec", async () => {
    const io = memIo(project());
    await runAdd(io, "/proj", ["solo"], {});
    expect(io.exists("__exec__")).toBe(false);
  });

  // registry 是外部输入：恶意 target 必须在落盘前被拦住，且不写任何文件
  it("target 越出 aliasRoot → 抛错且不写盘、不装依赖", async () => {
    const evil: RegistryItem = {
      ...item("evil"),
      files: [
        {
          path: "evil/Evil.vue",
          type: "registry:component",
          target: "../../../etc/evil.ts",
          content: "x",
        },
      ],
    };
    const io = memIo(project());
    io.fetchJson = async () => evil;
    await expect(runAdd(io, "/proj", ["evil"], {})).rejects.toThrow(/evil.*target/);
    expect(io.exists("/etc/evil.ts")).toBe(false);
    expect(io.exists("__exec__")).toBe(false);
  });
});
