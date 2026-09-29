import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import type { Io } from "../lib/io";

export const nodeIo: Io = {
  exists: (path) => existsSync(path),
  readFile: (path) => readFileSync(path, "utf8"),
  writeFile: (path, content) => writeFileSync(path, content),
  readDir: (path) => readdirSync(path),
};
