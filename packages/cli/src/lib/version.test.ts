import { describe, expect, it } from "vite-plus/test";
import { parsePkgVersion } from "./version";

describe("parsePkgVersion", () => {
  it("解析 version 字段", () =>
    expect(parsePkgVersion(`{"name":"x","version":"1.2.3"}`)).toBe("1.2.3"));

  it("缺失或空 version 抛错", () => {
    expect(() => parsePkgVersion(`{"name":"x"}`)).toThrow(/version/);
    expect(() => parsePkgVersion(`{"version":""}`)).toThrow(/version/);
  });
});
