import { describe, expect, it, vi } from "vite-plus/test";
import { defaultConfig } from "./config";
import { findProjectRoot, planWrites, resolveTarget, writeFiles } from "./write";
import type { RegistryItem } from "./registry-types";
import type { Io } from "./io";

const CONFIG = defaultConfig("http://x/r/vue");

const ITEM: RegistryItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "button",
  type: "registry:ui",
  files: [
    {
      path: "button/Button.vue",
      type: "registry:component",
      target: "components/ui/button/Button.vue",
      content: "<template />",
    },
    {
      path: "button/index.ts",
      type: "registry:component",
      target: "components/ui/button/index.ts",
      content: "export {}",
    },
  ],
};

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

describe("resolveTarget", () => {
  it("aliasRoot 与 target 逐段 join 且无重复分隔符", () => {
    expect(resolveTarget("components/ui/button/Button.vue", CONFIG, "/p/src")).toBe(
      "/p/src/components/ui/button/Button.vue",
    );
  });

  it("aliasRoot 尾部斜杠不产生 //", () => {
    expect(resolveTarget("components/ui/x.ts", CONFIG, "/p/src/")).toBe(
      "/p/src/components/ui/x.ts",
    );
  });
});

// registry 可由第三方托管，target 是外部输入：必须钳在 aliasRoot 内，
// 否则一个坏 JSON 就能把源码写到项目外（~/.bashrc、/etc/…）。
describe("resolveTarget 路径穿越", () => {
  it.each([
    ["绝对路径", "/etc/passwd"],
    ["Windows 盘符", "C:/Users/x/.bashrc"],
    ["上溯逸出 aliasRoot", "../../evil.ts"],
    ["反斜杠上溯逸出", "..\\..\\evil.ts"],
    ["归一后为空", "./"],
    ["空 target", ""],
  ])("%s（%s）抛错", (_label, target) => {
    expect(() => resolveTarget(target, CONFIG, "/p/src")).toThrow(/target/);
  });

  it("归一后仍在 aliasRoot 内的 .. 允许", () => {
    expect(resolveTarget("components/ui/../../x.ts", CONFIG, "/p/src")).toBe("/p/src/x.ts");
  });

  it("冗余 . 与 // 被归一", () => {
    expect(resolveTarget("components/./ui//x.ts", CONFIG, "/p/src")).toBe(
      "/p/src/components/ui/x.ts",
    );
  });

  it("planWrites 的报错点名 registry 项与文件", () => {
    const bad: RegistryItem = {
      ...ITEM,
      name: "evil",
      files: [
        { path: "evil/Evil.vue", type: "registry:component", target: "../evil.ts", content: "" },
      ],
    };
    expect(() => planWrites([bad], memIo(), "/p/src", CONFIG)).toThrow(/evil.*Evil\.vue.*target/);
  });
});

describe("findProjectRoot", () => {
  it("嵌套 cwd 向上找到 components.json", () => {
    const io = memIo({ "/p/components.json": "{}" });
    expect(findProjectRoot(io, "/p/a/b")).toBe("/p");
  });

  it("cwd 本身即项目根", () => {
    const io = memIo({ "/p/components.json": "{}" });
    expect(findProjectRoot(io, "/p")).toBe("/p");
  });

  it("到根仍无则抛错提示 init", () => {
    expect(() => findProjectRoot(memIo(), "/p/a")).toThrow(/init/);
  });
});

describe("planWrites / writeFiles", () => {
  it("plan 标记已存在文件", () => {
    const io = memIo({ "/p/src/components/ui/button/Button.vue": "old" });
    const plans = planWrites([ITEM], io, "/p/src", CONFIG);
    expect(plans).toHaveLength(2);
    const vue = plans.find((p) => p.path.endsWith("Button.vue"))!;
    const ts = plans.find((p) => p.path.endsWith("index.ts"))!;
    expect(vue.exists).toBe(true);
    expect(ts.exists).toBe(false);
  });

  it("冲突 + confirm=false → 跳过且不写", async () => {
    const io = memIo({ "/p/src/components/ui/button/Button.vue": "old" });
    const plans = planWrites([ITEM], io, "/p/src", CONFIG);
    const confirm = vi.fn().mockResolvedValue(false);
    const written = await writeFiles(plans, io, { confirm });
    expect(written).toEqual(["/p/src/components/ui/button/index.ts"]);
    expect(io.readFile("/p/src/components/ui/button/Button.vue")).toBe("old");
  });

  it("冲突 + confirm=true → 覆盖", async () => {
    const io = memIo({ "/p/src/components/ui/button/Button.vue": "old" });
    const plans = planWrites([ITEM], io, "/p/src", CONFIG);
    const confirm = vi.fn().mockResolvedValue(true);
    const written = await writeFiles(plans, io, { confirm });
    expect(written).toHaveLength(2);
    expect(io.readFile("/p/src/components/ui/button/Button.vue")).toBe("<template />");
  });

  it("overwrite=true → 不询问直接覆盖", async () => {
    const io = memIo({ "/p/src/components/ui/button/Button.vue": "old" });
    const plans = planWrites([ITEM], io, "/p/src", CONFIG);
    const confirm = vi.fn();
    const written = await writeFiles(plans, io, { overwrite: true, confirm });
    expect(written).toHaveLength(2);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("无 confirm 注入且冲突时默认跳过", async () => {
    const io = memIo({ "/p/src/components/ui/button/Button.vue": "old" });
    const plans = planWrites([ITEM], io, "/p/src", CONFIG);
    const written = await writeFiles(plans, io, {});
    expect(written).toHaveLength(1);
  });
});
