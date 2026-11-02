import { describe, expect, it } from "vite-plus/test";
import {
  generateRegistry,
  rewriteShippedImports,
  translateDeps,
  type RegistryIo,
  type ShippedLayout,
} from "./generator";

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
      version: "1.2.3",
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

  it("每个 item 与 index 条目都写入 input.version", () => {
    for (const item of items) {
      expect(item.version).toBe(input.version);
    }
    for (const entry of index.items) {
      expect(entry.version).toBe(input.version);
    }
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

const layout: ShippedLayout = {
  srcPath: "src/components/slot/Slot.ts",
  componentsRel: "src/components",
  aliasPrefix: "src/",
};

describe("rewriteShippedImports", () => {
  it("@/components/<x> 补 ui 段（静态 / 副作用 / 动态三种位置）", () => {
    const out = rewriteShippedImports(
      `import { Slot } from "@/components/slot";\nexport * from "@/components/form";\nconst m = await import("@/components/tooltip");`,
      layout,
    );
    expect(out).toContain('from "@/components/ui/slot"');
    expect(out).toContain('from "@/components/ui/form"');
    expect(out).toContain('import("@/components/ui/tooltip")');
  });

  it("已是 ui 形态不重复叠加", () => {
    expect(rewriteShippedImports(`import { B } from "@/components/ui/button";`, layout)).toBe(
      `import { B } from "@/components/ui/button";`,
    );
  });

  it("上溯出 components 的相对引用改为别名绝对形式", () => {
    const escape = rewriteShippedImports(`import { cn } from "../../lib/utils";`, layout);
    expect(escape).toBe(`import { cn } from "@/lib/utils";`);
  });

  it("落在 components 树内的相对引用保持原样（ui 布局下依然成立）", () => {
    const sib = rewriteShippedImports(`import Badge from "../badge/Badge.vue";`, {
      ...layout,
      srcPath: "src/components/table-render/column-renders.ts",
    });
    expect(sib).toBe(`import Badge from "../badge/Badge.vue";`);
    expect(rewriteShippedImports(`import X from "./Button.vue";`, layout)).toBe(
      `import X from "./Button.vue";`,
    );
  });

  it("非 import 位置的同名字符串不被改写", () => {
    const src = `const doc = "@/components/button";`;
    expect(rewriteShippedImports(src, layout)).toBe(src);
  });
});

/** 在 makeFixture 的 io 上覆盖/追加文件，构造校验用例 */
function fixtureIo(extraFiles: Record<string, string>, extraDirs: Record<string, string[]> = {}) {
  const files: Record<string, string> = {
    "components/button/registry.meta.json": JSON.stringify({
      description: "按钮。",
      registryDependencies: ["utils"],
    }),
    "components/button/Button.vue": `<script setup>import { cn } from "@/lib/utils"</script>`,
    "components/button/index.ts": `export const Button = {}`,
    "lib/utils.ts": "export function cn() {}",
    "styles/tokens.css": ":root {}",
  };
  const dirs: Record<string, string[]> = {
    components: ["button"],
    "components/button": ["Button.vue", "index.ts", "registry.meta.json"],
  };
  return makeIo({ ...files, ...extraFiles }, { ...dirs, ...extraDirs });
}

const fixtureInput = {
  componentsDir: "components",
  utilsPath: "lib/utils.ts",
  tokensPath: "styles/tokens.css",
  workspaceYaml:
    "catalog:\n  clsx: ^2.1.1\n  tailwind-merge: ^3.7.0\n  class-variance-authority: ^0.7.1\n",
  version: "1.2.3",
};

describe("generateRegistry 分发完整性校验", () => {
  it("组件目录缺 registry.meta.json 抛错（而非静默消失）", () => {
    const io = fixtureIo(
      { "components/orphan/Orphan.vue": `<template />` },
      { components: ["button", "orphan"], "components/orphan": ["Orphan.vue"] },
    );
    expect(() => generateRegistry(io, fixtureInput)).toThrow(/orphan.*registry\.meta\.json/);
  });

  it("源码 import 了未声明的兄弟组件 → 抛错并点名缺失项", () => {
    const io = fixtureIo(
      {
        "components/button/Button.vue": `<script setup>import { Avatar } from "@/components/avatar"</script>`,
        "components/avatar/registry.meta.json": JSON.stringify({ description: "头像。" }),
        "components/avatar/Avatar.vue": `<template />`,
      },
      {
        components: ["avatar", "button"],
        "components/avatar": ["Avatar.vue", "registry.meta.json"],
      },
    );
    expect(() => generateRegistry(io, fixtureInput)).toThrow(/button.*avatar/);
  });

  it("相对 ../<sibling> 同样纳入依赖校验", () => {
    const io = fixtureIo(
      {
        "components/button/Button.vue": `<script setup>import Badge from "../badge/Badge.vue"</script>`,
        "components/badge/registry.meta.json": JSON.stringify({ description: "徽标。" }),
        "components/badge/Badge.vue": `<template />`,
      },
      { components: ["badge", "button"], "components/badge": ["Badge.vue", "registry.meta.json"] },
    );
    expect(() => generateRegistry(io, fixtureInput)).toThrow(/button.*badge/);
  });

  it("引用了不存在的 registry 项 → 抛错", () => {
    const io = fixtureIo({
      "components/button/registry.meta.json": JSON.stringify({
        description: "按钮。",
        registryDependencies: ["utils", "nope"],
      }),
      "components/button/Button.vue": `<script setup>import { X } from "@/components/nope"</script>`,
    });
    expect(() => generateRegistry(io, fixtureInput)).toThrow(/nope/);
  });

  it("多余声明（模板用途、无静态 import）不报错", () => {
    const io = fixtureIo({
      "components/button/registry.meta.json": JSON.stringify({
        description: "按钮。",
        registryDependencies: ["utils", "input", "label"],
      }),
    });
    expect(() => generateRegistry(io, fixtureInput)).not.toThrow();
  });

  it("未知扩展名不静默发布", () => {
    const io = fixtureIo(
      { "components/button/README.md": "# 说明" },
      {
        components: ["button"],
        "components/button": ["Button.vue", "index.ts", "registry.meta.json", "README.md"],
      },
    );
    expect(() => generateRegistry(io, fixtureInput)).toThrow(/README\.md/);
  });

  it("分发文件 type 按扩展名映射", () => {
    const { items } = generateRegistry(fixtureIo({}), fixtureInput);
    const button = items.find((i) => i.name === "button")!;
    expect(button.files.find((f) => f.path.endsWith(".vue"))!.type).toBe("registry:component");
    expect(button.files.find((f) => f.path.endsWith(".ts"))!.type).toBe("registry:lib");
  });
});

/** 取 fixture 生成的 tokens 项。 */
function tokensItem(io: ReturnType<typeof fixtureIo>, input = fixtureInput) {
  return generateRegistry(io, input).items.find((i) => i.name === "tokens")!;
}

// 真实事故：tokens.css 有 `@import "tw-animate-css"`，registry 项却没声明依赖，
// 用户 add/init 后首屏构建 Can't resolve。依赖由 CSS 内容反推，人不需记忆。
describe("tokens 项依赖来自 tokens.css 的 @import", () => {
  it("裸包 @import 声明为依赖，版本取 catalog", () => {
    const io = fixtureIo({ "styles/tokens.css": '@import "tw-animate-css";\n:root {}' });
    const input = {
      ...fixtureInput,
      workspaceYaml: `${fixtureInput.workspaceYaml}  tw-animate-css: ^1.4.0\n`,
    };
    expect(tokensItem(io, input).dependencies).toEqual(["tw-animate-css@^1.4.0"]);
  });

  it("catalog 缺该包版本 → 抛错，不发布装不完备的 style 项", () => {
    const io = fixtureIo({ "styles/tokens.css": '@import "mystery-css";' });
    expect(() => tokensItem(io)).toThrow(/mystery-css/);
  });

  it("相对路径 @import 不当作 npm 依赖", () => {
    const io = fixtureIo({ "styles/tokens.css": '@import "./base.css";\n:root {}' });
    expect(tokensItem(io).dependencies).toBeUndefined();
  });
});
