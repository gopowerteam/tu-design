import { describe, expect, it } from "vite-plus/test";
import { diffComponents } from "./diff-core";
import { defaultConfig } from "./config";
import { LOCKFILE_NAME } from "./lockfile";
import { hashNormalizedContent } from "./rewrite";
import type { Lockfile } from "./lockfile";
import type { RegistryItem } from "./registry-types";
import type { Io } from "./io";
import type { RegistryFetcher, NpmChannel } from "./registry";

const CONFIG = defaultConfig("http://r/vue");
const ROOT = "/p";
const TARGET = (name: string) => `${ROOT}/src/components/ui/${name}/${name}.vue`;
const REMOTE = "remote-content";

function item(name: string, content: string): RegistryItem {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:ui",
    files: [
      {
        path: `${name}/${name}.vue`,
        type: "registry:component",
        target: `components/ui/${name}/${name}.vue`,
        content,
      },
    ],
  };
}

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

function lockFile(packages: Lockfile["packages"]): Record<string, string> {
  return {
    [`${ROOT}/${LOCKFILE_NAME}`]: `${JSON.stringify({ lockfileVersion: 1, packages }, null, 2)}\n`,
  };
}

const NPM_EMPTY: NpmChannel = { hasItem: () => false, readItem: () => undefined };

function fetcherOf(items: Record<string, RegistryItem>): RegistryFetcher {
  return {
    async fetchJson(url) {
      const name = url
        .split("/")
        .pop()!
        .replace(/\.json$/, "");
      const it = items[name];
      if (!it) throw new Error(`404 ${name}`);
      return it;
    },
  };
}

async function run(
  io: Io,
  items: Record<string, RegistryItem>,
  names?: string[],
): Promise<Awaited<ReturnType<typeof diffComponents>>> {
  return diffComponents(io, fetcherOf(items), "http://r/vue", NPM_EMPTY, ROOT, CONFIG, names);
}

describe("diffComponents 决策树", () => {
  const ITEMS = { w: item("w", REMOTE) };
  // 决策树测试显式传 names（不走 lockfile key 缺省）；lockfile 仅用于提供安装时 hash

  it("本地不存在 → missing", async () => {
    const io = memIo(
      lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent(REMOTE) } },
      }),
    );
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "missing" }]);
  });

  it("本地 === 线上 → up-to-date（即使也无安装记录，优先于 different）", async () => {
    const io = memIo({ ...lockFile({}), [TARGET("w")]: REMOTE });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "up-to-date" }]);
  });

  it("本地 === 上次安装 → updatable", async () => {
    const io = memIo({
      ...lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent("installed") } },
      }),
      [TARGET("w")]: "installed",
    });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "updatable" }]);
  });

  it("线上 === 上次安装（本地不同）→ modified", async () => {
    const io = memIo({
      ...lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent(REMOTE) } },
      }),
      [TARGET("w")]: "user-edit",
    });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "modified" }]);
  });

  it("三方互不相同 → conflict", async () => {
    const io = memIo({
      ...lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent("installed") } },
      }),
      [TARGET("w")]: "user-edit",
    });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "conflict" }]);
  });

  it("legacy（无 lockfile 记录）且内容不同 → different", async () => {
    const io = memIo({ ...lockFile({}), [TARGET("w")]: "user-edit" });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "different" }]);
    expect(d?.legacy).toBe(true);
    expect(d?.localVersion).toBeNull();
  });
});

describe("diffComponents 其他行为", () => {
  it("remoteVersion / localVersion / legacy 字段取值", async () => {
    const items = { v: { ...item("v", REMOTE), version: "2.0.0" } };
    const io = memIo({
      ...lockFile({
        v: { version: "1.0.0", files: { [TARGET("v")]: hashNormalizedContent(REMOTE) } },
      }),
      [TARGET("v")]: REMOTE,
    });
    const [d] = await run(io, items, ["v"]);
    expect(d).toMatchObject({
      name: "v",
      remoteVersion: "2.0.0",
      localVersion: "1.0.0",
      legacy: false,
    });
    expect(d?.error).toBeUndefined();
    expect(d?.files[0]?.status).toBe("up-to-date");
  });

  it("registry 未标注 version → remoteVersion null", async () => {
    const io = memIo(lockFile({ w: { version: null, files: {} } }));
    const [d] = await run(io, { w: item("w", REMOTE) });
    expect(d?.remoteVersion).toBeNull();
    expect(d?.localVersion).toBeNull();
  });

  it("单组件 fetch 失败 → error 字段，不中断其他组件", async () => {
    const items = { good: item("good", REMOTE) };
    const io = memIo({
      ...lockFile({
        bad: { version: null, files: {} },
        good: { version: "1.0.0", files: { [TARGET("good")]: hashNormalizedContent(REMOTE) } },
      }),
      [TARGET("good")]: REMOTE,
    });
    const diffs = await run(io, items);
    expect(diffs.map((d) => d.name)).toEqual(["bad", "good"]);
    expect(diffs[0]?.error).toMatch(/无法获取组件 bad/);
    expect(diffs[0]?.files).toEqual([]);
    expect(diffs[1]?.error).toBeUndefined();
    expect(diffs[1]?.files).toEqual([{ target: TARGET("good"), status: "up-to-date" }]);
  });

  it("names 缺省 → lockfile 全部 key（空 → []）", async () => {
    const empty = memIo({});
    expect(await run(empty, { w: item("w", REMOTE) })).toEqual([]);

    const io = memIo(
      lockFile({
        a: { version: null, files: {} },
        b: { version: null, files: {} },
      }),
    );
    const diffs = await run(io, {}); // fetch 全失败也只影响 error 字段
    expect(diffs.map((d) => d.name)).toEqual(["a", "b"]);
    expect(diffs.every((d) => d.error !== undefined)).toBe(true);
  });

  it("显式 names 可以是 lockfile 之外的组件（legacy 两方对比降级）", async () => {
    const io = memIo({ [TARGET("x")]: "local-only" });
    const [d] = await run(io, { x: item("x", REMOTE) }, ["x"]);
    expect(d?.legacy).toBe(true);
    expect(d?.files).toEqual([{ target: TARGET("x"), status: "different" }]);
  });
});

describe("diffComponents relativeImports 联动", () => {
  const ALI_REMOTE = `import { cn } from "@/lib/utils";\nbody`;
  // target /p/src/components/ui/w/w.vue 深度 3
  const ALI_REWRITTEN = `import { cn } from "../../../lib/utils";\nbody`;

  function aliItem(content: string): RegistryItem {
    return item("w", content);
  }

  it("lock 带 relativeImports 标记 → 远端基准同样改写，本地改写内容判 up-to-date", async () => {
    const io = memIo({
      ...lockFile({
        w: {
          version: "1.0.0",
          relativeImports: true,
          files: { [TARGET("w")]: hashNormalizedContent(ALI_REWRITTEN) },
        },
      }),
      [TARGET("w")]: ALI_REWRITTEN,
    });
    const [d] = await run(io, { w: aliItem(ALI_REMOTE) }, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "up-to-date" }]);
  });

  it("远端真实变更 → updatable（本地干净）", async () => {
    const io = memIo({
      ...lockFile({
        w: {
          version: "1.0.0",
          relativeImports: true,
          files: { [TARGET("w")]: hashNormalizedContent(ALI_REWRITTEN) },
        },
      }),
      [TARGET("w")]: ALI_REWRITTEN,
    });
    const [d] = await run(io, { w: aliItem(`${ALI_REMOTE} /* changed */`) }, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "updatable" }]);
  });

  it("本地空白重排 → 归一化后仍 up-to-date（不误报）", async () => {
    const io = memIo({
      ...lockFile({
        w: {
          version: "1.0.0",
          relativeImports: true,
          files: { [TARGET("w")]: hashNormalizedContent(ALI_REWRITTEN) },
        },
      }),
      [TARGET("w")]: `import  {  cn  }  from  "../../../lib/utils";\n\nbody`,
    });
    const [d] = await run(io, { w: aliItem(ALI_REMOTE) }, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "up-to-date" }]);
  });

  it("无 relativeImports 标记（v1 旧口径）→ 远端不改写，原文内容判 up-to-date", async () => {
    const io = memIo({
      ...lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent(REMOTE) } },
      }),
      [TARGET("w")]: REMOTE,
    });
    const [d] = await run(io, { w: aliItem(REMOTE) }, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "up-to-date" }]);
  });
});

describe("diffComponents hash 口径迁移（v0.6.0 归一化）", () => {
  it("旧 lock 记录（逐字节精确 hash）在远端变更后 → conflict（一次性，覆盖安装重建）", async () => {
    // 模拟 0.5.0 写入的精确 hash：与归一化口径不同的空白形态
    const io = memIo({
      ...lockFile({
        w: { version: "1.0.0", files: { [TARGET("w")]: hashNormalizedContent(REMOTE) + "stale" } },
      }),
      [TARGET("w")]: REMOTE,
    });
    const [d] = await run(io, { w: item("w", "remote-v2") }, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "conflict" }]);
  });
});
