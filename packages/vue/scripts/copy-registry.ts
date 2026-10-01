import { cpSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// dist 内嵌 registry 复制。build 脚本原本用 rm -rf / cp -r shell 命令，Windows 无 POSIX 工具会失败，
// 故改为 node:fs 实现（与 generate-registry 一致走 tsx）。
const pkgRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const dest = join(pkgRoot, "dist", "registry", "vue");

rmSync(dest, { recursive: true, force: true });
cpSync(join(pkgRoot, "registry", "vue"), dest, { recursive: true });
