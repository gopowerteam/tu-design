import { describe, expect, it } from "vite-plus/test";
import {
  formatIsoDate,
  formatIsoMonth,
  formatIsoYear,
  parseIsoDate,
  parseIsoMonth,
  parseIsoRange,
  parseIsoYear,
} from "./shared";

describe("parseIsoDate / formatIsoDate", () => {
  it("ISO 串 ↔ DateValue 往返", () => {
    const d = parseIsoDate("2026-10-09");
    expect(d).toBeDefined();
    expect(d!.year).toBe(2026);
    expect(d!.month).toBe(10);
    expect(d!.day).toBe(9);
    expect(formatIsoDate(d!)).toBe("2026-10-09");
  });

  it("非法/非严格 ISO 返回 undefined", () => {
    expect(parseIsoDate("")).toBeUndefined();
    expect(parseIsoDate("abc")).toBeUndefined();
    expect(parseIsoDate("2026-2-3")).toBeUndefined();
  });

  it("兼容 locale 分隔符：/ 分隔的补零日期归一为 ISO（zag 键入清洗路径）", () => {
    const d = parseIsoDate("2026/10/09");
    expect(d).toBeDefined();
    expect(formatIsoDate(d!)).toBe("2026-10-09");
  });
});

describe("parseIsoMonth / formatIsoMonth", () => {
  it("ISO 月串 ↔ DateValue 往返（锚定 1 日）", () => {
    const m = parseIsoMonth("2026-10");
    expect(m).toBeDefined();
    expect(m!.year).toBe(2026);
    expect(m!.month).toBe(10);
    expect(m!.day).toBe(1);
    // 月值格式化不能走 toString()（会带 day），须手动拼接
    expect(formatIsoMonth(m!)).toBe("2026-10");
  });

  it("非法/非补零返回 undefined，/ 分隔符兼容", () => {
    expect(parseIsoMonth("")).toBeUndefined();
    expect(parseIsoMonth("abc")).toBeUndefined();
    expect(parseIsoMonth("2026-1")).toBeUndefined();
    expect(parseIsoMonth("2026/10")).toBeDefined();
    expect(parseIsoMonth("2026-10-15")).toBeUndefined();
  });
});

describe("parseIsoYear / formatIsoYear", () => {
  it("ISO 年串 ↔ DateValue 往返（锚定 1 月 1 日）", () => {
    const y = parseIsoYear("2026");
    expect(y).toBeDefined();
    expect(y!.year).toBe(2026);
    expect(formatIsoYear(y!)).toBe("2026");
  });

  it("非四位年份返回 undefined", () => {
    expect(parseIsoYear("")).toBeUndefined();
    expect(parseIsoYear("26")).toBeUndefined();
    expect(parseIsoYear("2026-01")).toBeUndefined();
  });
});

describe("parseIsoRange", () => {
  it("两侧合法解析为有序 DateValue 元组", () => {
    const r = parseIsoRange(["2026-10-09", "2026-10-15"]);
    expect(r).toBeDefined();
    expect(r![0].day).toBe(9);
    expect(r![1].day).toBe(15);
  });

  it("乱序输入归一为 start ≤ end", () => {
    const r = parseIsoRange(["2026-10-15", "2026-10-09"]);
    expect(r).toBeDefined();
    expect(r![0].day).toBe(9);
    expect(r![1].day).toBe(15);
  });

  it("null / 任一侧非法返回 undefined", () => {
    expect(parseIsoRange(null)).toBeUndefined();
    expect(parseIsoRange(undefined)).toBeUndefined();
    expect(parseIsoRange(["abc", "2026-10-09"])).toBeUndefined();
    expect(parseIsoRange(["2026-10-09", ""])).toBeUndefined();
  });
});
