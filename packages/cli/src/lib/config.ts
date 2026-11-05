import { parseJson } from "./json";
import type { Io } from "./io";

export interface ComponentsConfig {
  framework: "vue";
  registry: string;
  aliases: { components: string; utils: string; ui: string; lib: string };
  tailwind: { css: string };
}

/** init 未显式传 --registry 时写入 components.json 的默认 URL 通道（不可达时 add 走 npm 兜底）。 */
export const DEFAULT_REGISTRY = "https://gopowerteam.github.io/tu-design/r/vue";

const CONFIG_FILE = "components.json";
const ALIAS_KEYS = ["components", "utils", "ui", "lib"] as const;

/**
 * 校验 components.json 结构：framework 必须为 "vue"，registry、aliases 四键、
 * tailwind.css 必须为字符串；缺失或非法字段一次性汇总报错，避免用户逐次修。
 * @param raw - JSON 反序列化结果（任意形态）
 * @returns 校验通过的项目配置
 */
export function validateConfig(raw: unknown): ComponentsConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${CONFIG_FILE} 内容不是 JSON 对象`);
  }
  const obj = raw as Record<string, unknown>;
  const missing: string[] = [];

  if (obj.framework === undefined) {
    missing.push("framework");
  } else if (obj.framework !== "vue") {
    throw new Error(
      `${CONFIG_FILE} 的 framework 仅支持 "vue"，得到 ${JSON.stringify(obj.framework)}`,
    );
  }

  if (typeof obj.registry !== "string") missing.push("registry");

  const aliases = obj.aliases;
  if (typeof aliases !== "object" || aliases === null) {
    missing.push("aliases");
  } else {
    for (const key of ALIAS_KEYS) {
      if (typeof (aliases as Record<string, unknown>)[key] !== "string") {
        missing.push(`aliases.${key}`);
      }
    }
  }

  const tailwind = obj.tailwind;
  if (typeof tailwind !== "object" || tailwind === null) {
    missing.push("tailwind");
  } else if (typeof (tailwind as Record<string, unknown>).css !== "string") {
    missing.push("tailwind.css");
  }

  if (missing.length > 0) {
    throw new Error(`${CONFIG_FILE} 缺少或非法字段：${missing.join("、")}`);
  }
  return raw as ComponentsConfig;
}

/**
 * 生成 init 写入的默认配置：别名指向约定的 src 布局，tailwind.css 用常见默认路径。
 * @param registry - 用户经 --registry 指定（或默认）的 registry URL
 * @returns 默认 ComponentsConfig
 */
export function defaultConfig(registry: string): ComponentsConfig {
  return {
    framework: "vue",
    registry,
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
      lib: "@/lib",
    },
    tailwind: { css: "src/assets/main.css" },
  };
}

/**
 * 拼接项目根下 components.json 的完整路径。
 * @param cwd - 项目根目录
 * @returns 配置文件路径
 */
function configPath(cwd: string): string {
  return `${cwd}/${CONFIG_FILE}`;
}

/**
 * 读取并校验项目配置；文件缺失时抛错提示先运行 init。
 * @param io - IO 通道
 * @param cwd - 项目根目录
 * @returns 校验通过的 ComponentsConfig
 */
export function loadConfig(io: Io, cwd: string): ComponentsConfig {
  const path = configPath(cwd);
  if (!io.exists(path)) {
    throw new Error(`未找到 ${CONFIG_FILE}，请先运行 \`tu-design init\``);
  }
  return validateConfig(parseJson(io.readFile(path), CONFIG_FILE));
}

/**
 * 将配置以两空格缩进 JSON 写入 components.json，末尾补换行。
 * @param io - IO 通道
 * @param cwd - 项目根目录
 * @param config - 要写入的项目配置
 */
export function saveConfig(io: Io, cwd: string, config: ComponentsConfig): void {
  io.writeFile(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`);
}
