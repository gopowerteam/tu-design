import { describe, expect, it } from "vite-plus/test";
import { buildInstallCommand, detectPackageManager, installDependencies, type ExecIo } from "./pm";
import type { Io } from "./io";

describe("detectPackageManager", () => {
  it.each([
    ["pnpm@9.15.0", "pnpm"],
    ["pnpm", "pnpm"],
    ["npm@10.9.0", "npm"],
    ["yarn@4.5.3", "yarn"],
    ["bun@1.2.0", "bun"],
    [undefined, "npm"],
    ["npmpackage@1.0.0", "npm"],
  ] as const)("%s → %s", (agent, expected) => {
    expect(detectPackageManager(agent)).toBe(expected);
  });
});

describe("buildInstallCommand", () => {
  it.each([
    ["pnpm", ["pnpm", "add", "clsx"], false],
    ["pnpm", ["pnpm", "add", "clsx", "-D"], true],
    ["npm", ["npm", "install", "clsx"], false],
    ["npm", ["npm", "install", "clsx", "-D"], true],
    ["yarn", ["yarn", "add", "clsx"], false],
    ["yarn", ["yarn", "add", "clsx", "-D"], true],
    ["bun", ["bun", "add", "clsx"], false],
    ["bun", ["bun", "add", "clsx", "-d"], true],
  ] as const)("%s dev=%s", (pm, expected, dev) => {
    expect(buildInstallCommand(pm, ["clsx"], dev)).toEqual([...expected]);
  });

  it("多依赖顺序保持", () => {
    expect(buildInstallCommand("pnpm", ["a", "b", "c"])).toEqual(["pnpm", "add", "a", "b", "c"]);
  });
});

describe("installDependencies", () => {
  it("调用注入的 exec 并传入完整命令", () => {
    const calls: string[][] = [];
    const io = {
      exists: () => false,
      readFile: () => "",
      writeFile: () => {},
      readDir: () => [],
      exec: (cmd: string[]) => {
        calls.push(cmd);
      },
    } satisfies ExecIo & Io;
    installDependencies(io, "/proj", ["clsx"], true, "pnpm");
    expect(calls).toEqual([["pnpm", "add", "clsx", "-D"]]);
  });

  it("未传 pm 时按锁文件推断", () => {
    const calls: string[][] = [];
    const io = {
      exists: (p: string) => p === "/proj/pnpm-lock.yaml",
      readFile: () => "",
      writeFile: () => {},
      readDir: () => [],
      exec: (cmd: string[]) => {
        calls.push(cmd);
      },
    } satisfies ExecIo & Io;
    installDependencies(io, "/proj", ["clsx"]);
    expect(calls).toEqual([["pnpm", "add", "clsx"]]);
  });
});
