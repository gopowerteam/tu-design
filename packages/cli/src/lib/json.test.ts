import { describe, expect, it } from "vite-plus/test";
import { parseJson } from "./json";

describe("parseJson", () => {
  it("合法 JSON 原样返回", () => expect(parseJson('{"a":1}', "x.json")).toEqual({ a: 1 }));

  it("报错带上文件名与原因（裸 SyntaxError 无法定位是哪个文件）", () => {
    expect(() => parseJson("{ broken", "components.json")).toThrow(
      /^components\.json 不是合法 JSON：/,
    );
  });
});
