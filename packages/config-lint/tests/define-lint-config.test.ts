import { describe, expect, it } from "vite-plus/test";
import { defineLintConfig } from "../src/define-lint-config.ts";
import type { LintFragment } from "../src/define-lint-config.ts";

describe("defineLintConfig 合并语义", () => {
  it("rules 逐键合并，右侧片段覆盖左侧", () => {
    const merged = defineLintConfig(
      { rules: { "a/rule": "error", "b/rule": "warn" } },
      { rules: { "b/rule": "off", "c/rule": "error" } },
    );
    expect(merged.rules).toEqual({ "a/rule": "error", "b/rule": "off", "c/rule": "error" });
  });

  it("plugins 按值去重追加", () => {
    const merged = defineLintConfig(
      { plugins: ["jsdoc", "unicorn"] },
      { plugins: ["jsdoc", "react"] },
    );
    expect(merged.plugins).toEqual(["jsdoc", "unicorn", "react"]);
  });

  it("jsPlugins 按 specifier 去重追加", () => {
    const merged = defineLintConfig(
      {
        jsPlugins: [
          { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
          { name: "repo", specifier: "repo/jsdoc-plugin" },
        ],
      },
      { jsPlugins: [{ name: "repo-alias", specifier: "repo/jsdoc-plugin" }] },
    );
    expect(merged.jsPlugins).toHaveLength(2);
    expect(merged.jsPlugins?.[1]).toEqual({ name: "repo", specifier: "repo/jsdoc-plugin" });
  });

  it("settings 二层深合并，不丢 base 的其他子键", () => {
    const merged = defineLintConfig(
      { settings: { jsdoc: { ignoreInternal: true }, other: { x: 1 } } },
      { settings: { jsdoc: { ignorePrivate: true } } },
    );
    expect(merged.settings).toEqual({
      jsdoc: { ignoreInternal: true, ignorePrivate: true },
      other: { x: 1 },
    });
  });

  it("overrides 按片段顺序拼接（追加不替换）", () => {
    const merged = defineLintConfig(
      {
        overrides: [{ files: ["a/**"], rules: { "x/r": "off" } }],
      },
      { overrides: [{ files: ["tests/**"], rules: { "y/r": "off" } }] },
    );
    expect(merged.overrides).toEqual([
      { files: ["a/**"], rules: { "x/r": "off" } },
      { files: ["tests/**"], rules: { "y/r": "off" } },
    ]);
  });

  it("其余键（options 等）右侧覆盖透传", () => {
    const merged = defineLintConfig(
      { options: { typeAware: true } },
      { options: { typeAware: false } },
    );
    expect(merged.options).toEqual({ typeAware: false });
  });

  it("片段缺省键不影响 base 已合并结果", () => {
    const merged = defineLintConfig(
      { rules: { "a/r": "error" }, overrides: [{ files: ["x"], rules: { r: "off" } }] },
      {} satisfies LintFragment,
    );
    expect(merged.rules).toEqual({ "a/r": "error" });
    expect(merged.overrides).toEqual([{ files: ["x"], rules: { r: "off" } }]);
  });
});
