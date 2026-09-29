import { describe, expect, it } from "vite-plus/test";
import { generateRegistry, translateDeps, type RegistryIo } from "./generator";

const catalog = { "@ark-ui/vue": "^5.39.2" };

describe("translateDeps", () => {
  it("catalog: 翻译为具体版本", () =>
    expect(translateDeps({ "@ark-ui/vue": "catalog:" }, catalog)).toEqual({
      "@ark-ui/vue": "^5.39.2",
    }));

  it("catalog 缺键抛错并含包名", () =>
    expect(() => translateDeps({ foo: "catalog:" }, catalog)).toThrow(/foo/));

  it("禁止 workspace: 协议", () =>
    expect(() => translateDeps({ x: "workspace:*" }, catalog)).toThrow());
});

function makeIo(files: Record<string, string>, dirs: Record<string, string[]>): RegistryIo {
  return {
    readDir: (p) => dirs[p] ?? [],
    readFile: (p) => {
      const content = files[p];
      if (content === undefined) throw new Error(`ENOENT: ${p}`);
      return content;
    },
  };
}

function makeFixture() {
  const files: Record<string, string> = {
    "components/button/registry.meta.json": JSON.stringify({
      description: "带变体与尺寸的按钮。",
      registryDependencies: ["utils"],
      dependencies: { "class-variance-authority": "catalog:" },
    }),
    "components/button/Button.vue": "<template><button /></template>",
    "components/button/index.ts": "export const buttonVariants = {};",
    "components/avatar/registry.meta.json": JSON.stringify({
      description: "头像组件。",
      registryDependencies: ["utils"],
      dependencies: { "@ark-ui/vue": "catalog:" },
    }),
    "components/avatar/Avatar.vue": "<template><div /></template>",
    "lib/utils.ts": "export function cn() {}",
    "styles/tokens.css": ":root {}",
  };
  const dirs: Record<string, string[]> = {
    components: ["avatar", "button"],
    "components/avatar": ["Avatar.vue", "registry.meta.json"],
    "components/button": ["Button.vue", "index.ts", "registry.meta.json"],
  };
  const workspaceYaml = [
    "catalog:",
    '  "@ark-ui/vue": ^5.39.2',
    "  class-variance-authority: ^0.7.1",
    "  clsx: ^2.1.1",
    "  tailwind-merge: ^3.7.0",
  ].join("\n");
  return {
    io: makeIo(files, dirs),
    input: {
      componentsDir: "components",
      utilsPath: "lib/utils.ts",
      tokensPath: "styles/tokens.css",
      workspaceYaml,
    },
  };
}

describe("generateRegistry", () => {
  const { io, input } = makeFixture();
  const { items, index } = generateRegistry(io, input);

  it("产出 button/utils/tokens（及 fixture 中其余组件）item", () => {
    const names = items.map((i) => i.name);
    expect(names).toContain("button");
    expect(names).toContain("utils");
    expect(names).toContain("tokens");
    expect(names).toContain("avatar");
  });

  it("任何 item 序列化后不含 catalog:/workspace: 协议", () => {
    for (const item of items) {
      expect(JSON.stringify(item)).not.toMatch(/"(catalog|workspace):/);
    }
  });

  it("index.items 与 items 一一对应且按 name 排序", () => {
    const itemNames = items.map((i) => i.name);
    const indexNames = index.items.map((i) => i.name);
    expect(indexNames).toEqual([...itemNames].sort());
    expect(new Set(indexNames).size).toBe(itemNames.length);
  });

  it("button item 的 files 含 Button.vue 且 content 非空、依赖 utils", () => {
    const button = items.find((i) => i.name === "button")!;
    const vue = button.files.find((f) => f.path === "button/Button.vue");
    expect(vue).toBeDefined();
    expect(vue!.content.length).toBeGreaterThan(0);
    expect(vue!.target).toBe("components/ui/button/Button.vue");
    expect(button.registryDependencies).toContain("utils");
    expect(button.dependencies).toContain("class-variance-authority@^0.7.1");
  });

  it("avatar item 的 @ark-ui/vue 翻译为具体版本", () => {
    const avatar = items.find((i) => i.name === "avatar")!;
    expect(avatar.dependencies).toContain("@ark-ui/vue@^5.39.2");
  });

  it("files 不含测试文件（仅分发源码）", () => {
    const button = items.find((i) => i.name === "button")!;
    for (const f of button.files) {
      expect(f.path).not.toMatch(/\.test\.ts$/);
    }
  });

  it("utils 为 registry:lib，tokens 为 registry:style", () => {
    expect(items.find((i) => i.name === "utils")!.type).toBe("registry:lib");
    expect(items.find((i) => i.name === "tokens")!.type).toBe("registry:style");
  });
});
