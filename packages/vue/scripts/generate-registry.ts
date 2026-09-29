import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateRegistry, type RegistryIo } from "../src/registry/generator.ts";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const outDir = join(pkgDir, "registry/vue");
mkdirSync(outDir, { recursive: true });
for (const item of items) {
  writeFileSync(join(outDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}
writeFileSync(join(outDir, "registry.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`registry: ${items.length + 1} files -> ${outDir}`);
