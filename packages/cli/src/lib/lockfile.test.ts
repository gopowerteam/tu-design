import { describe, expect, it } from "vite-plus/test";
import { LOCKFILE_NAME, hashContent, readLockfile, writeLockfile } from "./lockfile";
import type { Lockfile } from "./lockfile";
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

const LOCK_PATH = `/p/${LOCKFILE_NAME}`;

describe("hashContent", () => {
  it("确定性：同内容同 hash", () => {
    expect(hashContent("abc")).toBe(hashContent("abc"));
  });

  it("sha256 hex（64 位小写十六进制）", () => {
    expect(hashContent("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("内容不同 hash 不同", () => {
    expect(hashContent("abc")).not.toBe(hashContent("abd"));
  });
});

describe("readLockfile / writeLockfile", () => {
  const LOCK: Lockfile = {
    lockfileVersion: 1,
    packages: {
      button: { version: "1.2.0", files: { "/p/src/x.vue": hashContent("x") } },
      solo: { version: null, files: {} },
    },
  };

  it("roundtrip：write 后 read 等值", () => {
    const io = memIo();
    writeLockfile(io, "/p", LOCK);
    expect(io.exists(LOCK_PATH)).toBe(true);
    expect(readLockfile(io, "/p")).toEqual(LOCK);
  });

  it("写入格式：2 空格缩进 + 尾部换行", () => {
    const io = memIo();
    writeLockfile(io, "/p", LOCK);
    expect(io.readFile(LOCK_PATH)).toBe(`${JSON.stringify(LOCK, null, 2)}\n`);
  });

  it("文件缺失 → 空 lockfile", () => {
    expect(readLockfile(memIo(), "/p")).toEqual({ lockfileVersion: 1, packages: {} });
  });

  it("非法 JSON → throw 并点名文件", () => {
    const io = memIo({ [LOCK_PATH]: "{ broken" });
    expect(() => readLockfile(io, "/p")).toThrow(new RegExp(`${LOCKFILE_NAME}.*不是合法 JSON`));
  });

  it.each([
    ["顶层不是对象", "[]"],
    ["顶层是原始值", "42"],
    ["lockfileVersion 非法", JSON.stringify({ lockfileVersion: 2, packages: {} })],
    ["lockfileVersion 缺失", JSON.stringify({ packages: {} })],
    ["缺 packages", JSON.stringify({ lockfileVersion: 1 })],
    ["packages 是数组", JSON.stringify({ lockfileVersion: 1, packages: [] })],
    ["package 条目不是对象", JSON.stringify({ lockfileVersion: 1, packages: { a: 1 } })],
    [
      "version 类型非法",
      JSON.stringify({ lockfileVersion: 1, packages: { a: { version: 3, files: {} } } }),
    ],
    ["files 缺失", JSON.stringify({ lockfileVersion: 1, packages: { a: { version: null } } })],
    [
      "files 值不是字符串",
      JSON.stringify({
        lockfileVersion: 1,
        packages: { a: { version: null, files: { "x.vue": 9 } } },
      }),
    ],
  ])("结构非法（%s）→ throw", (_label, raw) => {
    const io = memIo({ [LOCK_PATH]: raw });
    expect(() => readLockfile(io, "/p")).toThrow(LOCKFILE_NAME);
  });
});
