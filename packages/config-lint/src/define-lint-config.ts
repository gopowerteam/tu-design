/**
 * defineLintConfig 片段组合器：多个 lint 配置片段从左到右键级合并。
 *
 * 合并语义（红线：严禁整体 spread——浅覆盖会丢失既有 rules/overrides）：
 * - `rules`：逐键合并，右侧片段覆盖左侧
 * - `plugins`：按值去重追加
 * - `jsPlugins`：按 `specifier` 去重追加
 * - `settings`：二层深合并（如 `jsdoc` 子键）
 * - `overrides`：按片段顺序拼接（追加不替换，保证豁免优先级可控）
 * - 其余键（options / ignorePatterns 等）：右侧覆盖（标量语义）
 *
 * 使用约定：用户 base 放最前，片段依次叠加；片段与 base 无同名键时二者等价，
 * 冲突时后传的片段胜出（片段是精心调校的规则集）。
 *
 * 类型直接借用 `vite-plus/lint`（re-export 自 oxlint）的官方 `OxlintConfig`，
 * 保证合并结果可原样赋给根 vite.config 的 `lint` 块，无需任何断言收口。
 */
import type { OxlintConfig } from "vite-plus/lint";

/** 组合器做特殊合并的键；其余键走「右侧覆盖」透传路径 */
const MERGED_KEYS = new Set(["plugins", "jsPlugins", "rules", "settings", "overrides"]);

/** 官方类型别名（便于片段文件引用，避免各自 NonNullable 链） */
export type LintPluginsList = NonNullable<OxlintConfig["plugins"]>;
export type LintJsPlugins = NonNullable<OxlintConfig["jsPlugins"]>;
export type LintRules = NonNullable<OxlintConfig["rules"]>;
export type LintSettings = NonNullable<OxlintConfig["settings"]>;
export type LintOverrides = NonNullable<OxlintConfig["overrides"]>;

/** settings 二层深合并的内部宽松视图（最终写回 LintSettings 时断言回收） */
type SettingsMap = { [key: string]: unknown };

/** 单个配置片段：OxlintConfig 可合并键的子集 + 其余键透传 */
export interface LintFragment {
  plugins?: LintPluginsList;
  jsPlugins?: LintJsPlugins;
  rules?: LintRules;
  settings?: LintSettings;
  overrides?: LintOverrides;
  [key: string]: unknown;
}

/**
 * jsPlugins 元素的 specifier（字符串形式与对象形式统一取值）。
 *
 * @param {string | {name: string, specifier: string}} entry 插件注册项
 * @returns {string} 用于去重比对的 specifier
 */
function pluginSpecifier(entry: LintJsPlugins[number]): string {
  return typeof entry === "string" ? entry : entry.specifier;
}

/**
 * 将多个 lint 配置片段从左到右合并为单个 lint 块。
 *
 * @param {...LintFragment[]} fragments 片段序列；约定用户 base 在前、规则片段在后
 * @returns {LintFragment} 合并后的 lint 块（可直接作为 vite.config 的 `lint` 值）
 */
export function defineLintConfig(...fragments: LintFragment[]): LintFragment {
  const result: LintFragment = {};
  for (const frag of fragments) {
    if (frag.plugins) {
      const prev = result.plugins ?? [];
      result.plugins = [...prev, ...frag.plugins.filter((p) => !prev.includes(p))];
    }
    if (frag.jsPlugins) {
      const prev = result.jsPlugins ?? [];
      result.jsPlugins = [
        ...prev,
        ...frag.jsPlugins.filter(
          (e) => !prev.some((p) => pluginSpecifier(p) === pluginSpecifier(e)),
        ),
      ];
    }
    if (frag.rules) {
      result.rules = { ...result.rules, ...frag.rules };
    }
    if (frag.settings) {
      const merged: SettingsMap = { ...(result.settings ?? {}) };
      for (const [key, sub] of Object.entries(frag.settings)) {
        merged[key] = {
          ...((merged[key] as SettingsMap | undefined) ?? {}),
          ...((sub as SettingsMap) ?? {}),
        };
      }
      result.settings = merged as LintSettings;
    }
    if (frag.overrides) {
      result.overrides = [...(result.overrides ?? []), ...frag.overrides];
    }
    for (const [key, value] of Object.entries(frag)) {
      if (!MERGED_KEYS.has(key)) result[key] = value;
    }
  }
  return result;
}
