import { describe, expect, it } from "vite-plus/test";
import { collectDeps, resolveTopo, runAdd } from "./add-core";
import { defaultConfig } from "./config";
import { hashContent, readLockfile } from "./lockfile";
import { hashNormalizedContent } from "./rewrite";
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
      hashNormalizedContent("<template><!-- button --></template>"),
    );
  });

  it("registry item 带 version → lockfile 记录该版本", async () => {
    const io = memIo(project());
    io.fetchJson = async () => ({ ...item("solo"), version: "2.3.4" });
    await runAdd(io, "/proj", ["solo"], {});
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.solo?.version).toBe("2.3.4");
  });

  it("已存在且内容相同 → upToDate，不写入但 lockfile 建条目（provenance 明确）", async () => {
    const io = memIo({ ...project(), [SOLO_TARGET]: "<template><!-- solo --></template>" });
    const summary = await runAdd(io, "/proj", ["solo"], {});
    expect(summary.files).toEqual([]);
    expect(summary.upToDate).toEqual([SOLO_TARGET]);
    expect(summary.overwrites).toEqual([]);
    expect(summary.conflicts).toEqual([]);
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.solo?.version).toBeNull();
    expect(lock.packages.solo?.files[SOLO_TARGET]).toBe(
      hashNormalizedContent("<template><!-- solo --></template>"),
    );
  });

  it("多文件组件部分幂等跳过（upToDate）+ 部分新写入 → lockfile 记录全部落点", async () => {
    const io = memIo({ ...project(), [MULTI_A]: "A:multi" }); // A 与远端一致 → upToDate；B 新文件
    const summary = await runAdd(io, "/proj", ["multi"], {});
    expect(summary.upToDate).toEqual([MULTI_A]);
    expect(summary.files).toEqual([MULTI_B]);
    const lock = readLockfile(io, "/proj");
    expect(Object.keys(lock.packages.multi?.files ?? {}).sort()).toEqual([MULTI_A, MULTI_B].sort());
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
      hashNormalizedContent("<template><!-- solo --></template>"),
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

/** 含 @/ alias 导入的 fixture：--relative-imports 场景专用。 */
function aliasItem(name: string): RegistryItem {
  return {
    ...item(name),
    files: [
      {
        path: `${name}/${name}.vue`,
        type: "registry:component",
        target: `components/ui/${name}/${name}.vue`,
        content: `import { cn } from "@/lib/utils";\n<template><!-- ${name} --></template>`,
      },
    ],
  };
}

const ALI_TARGET = "/proj/src/components/ui/ali/ali.vue";
const ALI_REWRITTEN = `import { cn } from "../../../lib/utils";\n<template><!-- ali --></template>`;

describe("runAdd --all", () => {
  it("从 lockfile 展开全部记录名并覆盖升级", async () => {
    const existing: Lockfile = {
      lockfileVersion: 1,
      packages: {
        solo: { version: null, files: {} },
        multi: { version: null, files: {} },
      },
    };
    const io = memIo({
      ...project(),
      ["/proj/components.lock.json"]: `${JSON.stringify(existing, null, 2)}\n`,
      ["/proj/src/components/ui/solo/solo.vue"]: "old",
    });
    const summary = await runAdd(io, "/proj", [], { all: true, overwrite: true });
    expect(summary.files).toContain("/proj/src/components/ui/solo/solo.vue");
    expect(summary.files).toContain("/proj/src/components/ui/multi/A.vue");
    expect(summary.files).toContain("/proj/src/components/ui/multi/B.vue");
    expect(io.readFile("/proj/src/components/ui/solo/solo.vue")).toContain("solo");
  });

  it("--all 与显式组件名互斥", async () => {
    const io = memIo(project());
    await expect(runAdd(io, "/proj", ["solo"], { all: true })).rejects.toThrow(/互斥/);
  });

  it("lockfile 为空时 --all 报错提示先装具体组件", async () => {
    const io = memIo(project());
    await expect(runAdd(io, "/proj", [], { all: true })).rejects.toThrow(/没有记录/);
  });

  it("未指定组件名且未启用 --all → 报错提示", async () => {
    const io = memIo(project());
    await expect(runAdd(io, "/proj", [], {})).rejects.toThrow(/未指定组件名/);
  });
});

describe("runAdd --no-install", () => {
  it("跳过依赖安装，但依赖清单照常返回", async () => {
    const io = memIo(project());
    const summary = await runAdd(io, "/proj", ["button"], { noInstall: true });
    expect(summary.dependencies).toEqual(["tailwind-merge@^3", "clsx@^2"]);
    expect(io.exists("__exec__")).toBe(false);
  });
});

describe("runAdd --relative-imports", () => {
  it("写入内容为相对导入，lock 记录改写后归一化 hash 与 relativeImports 标记", async () => {
    const io = memIo(project());
    io.fetchJson = async () => aliasItem("ali");
    const summary = await runAdd(io, "/proj", ["ali"], { relativeImports: true });
    expect(summary.files).toEqual([ALI_TARGET]);
    expect(io.readFile(ALI_TARGET)).toBe(ALI_REWRITTEN);
    const lock = readLockfile(io, "/proj");
    expect(lock.packages.ali?.relativeImports).toBe(true);
    expect(lock.packages.ali?.files[ALI_TARGET]).toBe(hashNormalizedContent(ALI_REWRITTEN));
  });

  it("二次 dry-run：本地（改写后内容）→ upToDate", async () => {
    const io = memIo(project());
    io.fetchJson = async () => aliasItem("ali");
    await runAdd(io, "/proj", ["ali"], { relativeImports: true });
    const s = await runAdd(io, "/proj", ["ali"], { relativeImports: true, dryRun: true });
    expect(s.upToDate).toEqual([ALI_TARGET]);
    expect(s.overwrites).toEqual([]);
  });

  it("用户 fmt 重排空白不触发覆盖（归一化比对）", async () => {
    const io = memIo(project());
    io.fetchJson = async () => aliasItem("ali");
    await runAdd(io, "/proj", ["ali"], { relativeImports: true });
    io.writeFile(
      ALI_TARGET,
      `import  {  cn  }  from  "../../../lib/utils";\n\n<template>  <!--  ali  -->  </template>`,
    );
    const s = await runAdd(io, "/proj", ["ali"], { relativeImports: true, dryRun: true });
    expect(s.upToDate).toEqual([ALI_TARGET]);
    expect(s.overwrites).toEqual([]);
  });

  it("未启用改写时内容原样写入（回归：行为与 0.5.0 一致）", async () => {
    const io = memIo(project());
    io.fetchJson = async () => aliasItem("ali");
    await runAdd(io, "/proj", ["ali"], {});
    expect(io.readFile(ALI_TARGET)).toBe(
      `import { cn } from "@/lib/utils";\n<template><!-- ali --></template>`,
    );
  });
});
