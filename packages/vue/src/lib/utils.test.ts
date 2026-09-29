import { describe, expect, it } from "vite-plus/test";
import { cn } from "./utils";

describe("cn", () => {
  it("合并并去重同组冲突 class", () => expect(cn("p-2", "p-4")).toBe("p-4"));
  it("保留非冲突 class", () => expect(cn("p-2", "text-sm")).toBe("p-2 text-sm"));
  it("忽略 falsy 输入", () => expect(cn("p-2", false, undefined)).toBe("p-2"));
});
