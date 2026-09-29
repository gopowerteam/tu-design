import { parse } from "yaml";
import type { RegistryFile, RegistryIndex, RegistryItem, RegistryMeta } from "./types";

const SCHEMA_ITEM = "https://ui.shadcn.com/schema/registry-item.json";
const SCHEMA_INDEX = "https://ui.shadcn.com/schema/registry.json";

export interface RegistryIo {
  readDir(path: string): string[];
  readFile(path: string): string;
}

export function parseCatalog(workspaceYaml: string): Record<string, string> {
  const doc = parse(workspaceYaml) as { catalog?: Record<string, string> };
  return doc.catalog ?? {};
}

export function translateDeps(
  deps: Record<string, string>,
  catalog: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, spec] of Object.entries(deps)) {
    if (spec.startsWith("workspace:")) {
      throw new Error(`registry 禁止 workspace: 协议：${name}`);
    }
    if (spec === "catalog:") {
      const version = catalog[name];
      if (!version) {
        throw new Error(`catalog 缺少包 ${name} 的版本，无法生成 registry`);
      }
      out[name] = version;
    } else {
      out[name] = spec;
    }
  }
  return out;
}

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_, __: string, c: string) => c.toUpperCase());
}

/** 官方 registry-item schema 的 dependencies 是字符串数组 —— 以 name@version 形式钉具体版本。 */
function toNameAtVersion(deps: Record<string, string>): string[] {
  return Object.entries(deps).map(([name, version]) => `${name}@${version}`);
}

export function generateRegistry(
  io: RegistryIo,
  input: {
    componentsDir: string;
    utilsPath: string;
    tokensPath: string;
    workspaceYaml: string;
  },
): { items: RegistryItem[]; index: RegistryIndex } {
  const catalog = parseCatalog(input.workspaceYaml);
  const items: RegistryItem[] = [];

  for (const dir of io.readDir(input.componentsDir).slice().sort()) {
    let metaRaw: string;
    try {
      metaRaw = io.readFile(`${input.componentsDir}/${dir}/registry.meta.json`);
    } catch {
      continue;
    }
    const meta = JSON.parse(metaRaw) as RegistryMeta;
    const files: RegistryFile[] = io
      .readDir(`${input.componentsDir}/${dir}`)
      .filter((f) => f !== "registry.meta.json" && !f.endsWith(".test.ts"))
      .sort()
      .map((f) => ({
        path: `${dir}/${f}`,
        type: "registry:component",
        target: `components/ui/${dir}/${f}`,
        content: io.readFile(`${input.componentsDir}/${dir}/${f}`),
      }));
    const dependencies = translateDeps(meta.dependencies ?? {}, catalog);
    const devDependencies = translateDeps(meta.devDependencies ?? {}, catalog);
    items.push({
      $schema: SCHEMA_ITEM,
      name: dir,
      type: "registry:ui",
      description: meta.description,
      ...(meta.registryDependencies?.length
        ? { registryDependencies: meta.registryDependencies }
        : {}),
      ...(Object.keys(dependencies).length ? { dependencies: toNameAtVersion(dependencies) } : {}),
      ...(Object.keys(devDependencies).length
        ? { devDependencies: toNameAtVersion(devDependencies) }
        : {}),
      files,
    });
  }

  items.push({
    $schema: SCHEMA_ITEM,
    name: "utils",
    type: "registry:lib",
    description: "cn 类名合并工具（clsx + tailwind-merge）。",
    dependencies: toNameAtVersion(
      translateDeps(
        {
          clsx: "catalog:",
          "tailwind-merge": "catalog:",
          "class-variance-authority": "catalog:",
        },
        catalog,
      ),
    ),
    files: [
      {
        path: "lib/utils.ts",
        type: "registry:lib",
        target: "lib/utils.ts",
        content: io.readFile(input.utilsPath),
      },
    ],
  });

  items.push({
    $schema: SCHEMA_ITEM,
    name: "tokens",
    type: "registry:style",
    description: "Tailwind CSS v4 语义 tokens（shadcn 官方 v4 集合）。",
    files: [
      {
        path: "styles/tokens.css",
        type: "registry:style",
        target: "styles/tokens.css",
        content: io.readFile(input.tokensPath),
      },
    ],
  });

  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  const index: RegistryIndex = {
    $schema: SCHEMA_INDEX,
    name: "tu-design",
    items: sorted.map((i) => ({
      name: i.name,
      title: toPascal(i.name),
      type: i.type,
      description: i.description,
    })),
  };

  return { items: sorted, index };
}
