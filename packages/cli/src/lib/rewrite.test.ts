import { describe, expect, it } from "vite-plus/test";
import { hashNormalizedContent, normalizeContent, rewriteContent } from "./rewrite";

const ALIAS_ROOT = "/proj/src";
const DEEP_FILE = `${ALIAS_ROOT}/components/ui/button/button.vue`;
const SHALLOW_FILE = `${ALIAS_ROOT}/lib/utils.ts`;

describe("normalizeContent / hashNormalizedContent", () => {
  it("空白归一化：缩进/折行/行尾差异不影响 hash", () => {
    const a = 'import { cn } from "@/lib/utils";\nexport const x = 1;\n';
    const b = 'import  {  cn } from "@/lib/utils";\r\n  export const x = 1;   ';
    expect(normalizeContent(a)).not.toContain(" ");
    expect(hashNormalizedContent(a)).toBe(hashNormalizedContent(b));
  });

  it("语义内容差异 → hash 不同", () => {
    expect(hashNormalizedContent("a")).not.toBe(hashNormalizedContent("b"));
  });
});

describe("rewriteContent", () => {
  it("按文件深度改写静态 from 导入（components/ui/x 层 → 深度 3）", () => {
    const src = 'import { cn } from "@/lib/utils";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(
      'import { cn } from "../../../lib/utils";\n',
    );
  });

  it("浅层文件深度 1", () => {
    const src = 'import { Button } from "@/components/ui/button";\n';
    expect(rewriteContent(src, SHALLOW_FILE, ALIAS_ROOT)).toBe(
      'import { Button } from "../components/ui/button";\n',
    );
  });

  it("动态 import 同样改写", () => {
    const src = 'const m = await import("@/lib/utils");\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(
      'const m = await import("../../../lib/utils");\n',
    );
  });

  it("export ... from 同样改写", () => {
    const src = 'export { cn } from "@/lib/utils";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(
      'export { cn } from "../../../lib/utils";\n',
    );
  });

  it("非 import 上下文的 @/ 字面量不受影响", () => {
    const src = 'const path = "@/lib/utils";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(src);
  });

  it("非 alias 规格（如 vue）原样", () => {
    const src = 'import { ref } from "vue";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(src);
  });

  it("裸 @/ 根（无余下路径）保守不改写", () => {
    const src = 'import x from "@/";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(src);
  });

  it("非源码扩展名原样返回", () => {
    const src = '/* @import "@/lib/utils" */\n';
    expect(rewriteContent(src, `${ALIAS_ROOT}/styles/tokens.css`, ALIAS_ROOT)).toBe(src);
  });

  it("aliasRoot 之外的文件路径原样返回（防御）", () => {
    const src = 'import { cn } from "@/lib/utils";\n';
    expect(rewriteContent(src, "/elsewhere/a.ts", ALIAS_ROOT)).toBe(src);
  });

  it("多处导入一次性全部改写", () => {
    const src =
      'import { cn } from "@/lib/utils";\nimport { Button } from "@/components/ui/button";\n';
    expect(rewriteContent(src, DEEP_FILE, ALIAS_ROOT)).toBe(
      'import { cn } from "../../../lib/utils";\nimport { Button } from "../../../components/ui/button";\n',
    );
  });
});
