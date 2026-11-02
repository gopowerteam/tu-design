import { describe, expect, it } from "vite-plus/test";
import { diffComponents } from "./diff-core";
import { defaultConfig } from "./config";
import { LOCKFILE_NAME, hashContent } from "./lockfile";
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
      lockFile({ w: { version: "1.0.0", files: { [TARGET("w")]: hashContent(REMOTE) } } }),
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
      ...lockFile({ w: { version: "1.0.0", files: { [TARGET("w")]: hashContent("installed") } } }),
      [TARGET("w")]: "installed",
    });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "updatable" }]);
  });

  it("线上 === 上次安装（本地不同）→ modified", async () => {
    const io = memIo({
      ...lockFile({ w: { version: "1.0.0", files: { [TARGET("w")]: hashContent(REMOTE) } } }),
      [TARGET("w")]: "user-edit",
    });
    const [d] = await run(io, ITEMS, ["w"]);
    expect(d?.files).toEqual([{ target: TARGET("w"), status: "modified" }]);
  });

  it("三方互不相同 → conflict", async () => {
    const io = memIo({
      ...lockFile({ w: { version: "1.0.0", files: { [TARGET("w")]: hashContent("installed") } } }),
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
      ...lockFile({ v: { version: "1.0.0", files: { [TARGET("v")]: hashContent(REMOTE) } } }),
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
        good: { version: "1.0.0", files: { [TARGET("good")]: hashContent(REMOTE) } },
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
