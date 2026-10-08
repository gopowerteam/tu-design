import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { generateRegistry, type RegistryIo } from "./generator";

/**
 * 防漂移：已提交的 registry/vue/*.json 必须与源码实时生成结果一致。
 * 改动 src/components、src/lib/utils.ts、src/styles/tokens.css 或
 * workspace catalog 后，需执行 `vp run generate:registry` 同步提交物。
 */
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const registryDir = join(pkgDir, "registry", "vue");

const io: RegistryIo = {
  readDir: (path) => readdirSync(path),
  readFile: (path) => readFileSync(path, "utf8"),
};

const { items, index } = generateRegistry(io, {
  componentsDir: join(pkgDir, "src/components"),
  utilsPath: join(pkgDir, "src/lib/utils.ts"),
  tokensPath: join(pkgDir, "src/styles/tokens.css"),
  workspaceYaml: readFileSync(join(pkgDir, "../../pnpm-workspace.yaml"), "utf8"),
});

describe("registry 防漂移", () => {
  it("registry.json 与生成结果一致", () =>
    expect(JSON.parse(readFileSync(join(registryDir, "registry.json"), "utf8"))).toEqual(index));

  it.each(items.map((item) => item.name))("%s.json 与生成结果一致", (name) => {
    const item = items.find((i) => i.name === name)!;
    expect(JSON.parse(readFileSync(join(registryDir, `${name}.json`), "utf8"))).toEqual(item);
  });
});
