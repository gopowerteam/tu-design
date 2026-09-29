import type { Io } from "./io";

export interface ComponentsConfig {
  framework: "vue";
  registry: string;
  aliases: { components: string; utils: string; ui: string; lib: string };
  tailwind: { css: string };
}

/** init 未显式传 --registry 时写入 components.json 的默认 URL 通道（不可达时 add 走 npm 兜底）。 */
export const DEFAULT_REGISTRY = "https://<org>.github.io/tu-design/r/vue";

const CONFIG_FILE = "components.json";
const ALIAS_KEYS = ["components", "utils", "ui", "lib"] as const;

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

function configPath(cwd: string): string {
  return `${cwd}/${CONFIG_FILE}`;
}

export function loadConfig(io: Io, cwd: string): ComponentsConfig {
  const path = configPath(cwd);
  if (!io.exists(path)) {
    throw new Error(`未找到 ${CONFIG_FILE}，请先运行 \`tu-design init\``);
  }
  return validateConfig(JSON.parse(io.readFile(path)));
}

export function saveConfig(io: Io, cwd: string, config: ComponentsConfig): void {
  io.writeFile(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`);
}
