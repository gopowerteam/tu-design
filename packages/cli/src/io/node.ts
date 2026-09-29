import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { NpmChannel } from "../lib/registry";
import type { Io } from "../lib/io";

export const nodeIo: Io = {
  exists: (path) => existsSync(path),
  readFile: (path) => readFileSync(path, "utf8"),
  writeFile: (path, content) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  },
  readDir: (path) => readdirSync(path),
};

/** npm 通道：读取依赖 @tu-design/vue 包内 dist/registry/vue/<name>.json。 */
export const nodeNpmChannel: NpmChannel = {
  hasItem(name) {
    return existsSync(npmItemPath(name));
  },
  readItem(name) {
    return JSON.parse(readFileSync(npmItemPath(name), "utf8"));
  },
};

function npmItemPath(name: string): string {
  const require = createRequire(import.meta.url);
  const pkgJson = require.resolve("@tu-design/vue/package.json");
  return join(dirname(pkgJson), "dist/registry/vue", `${name}.json`);
}
