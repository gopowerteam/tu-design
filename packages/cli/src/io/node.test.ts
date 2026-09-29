import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { nodeIo } from "./node";

describe("nodeIo", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it("writeFile 自动创建父目录", () => {
    const base = mkdtempSync(join(tmpdir(), "tu-cli-"));
    dirs.push(base);
    const file = join(base, "src/lib/utils.ts");
    nodeIo.writeFile(file, "export {}");
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toBe("export {}");
  });
});
