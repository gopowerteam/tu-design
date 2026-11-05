import { AGENTS_MD_SOURCE } from "./ai-rules";
import { CN_UTIL_SOURCE, TOKENS_CSS_SOURCE } from "./generated-sources";
import { defaultConfig, saveConfig, validateConfig } from "./config";
import { applyAliases } from "./alias";
import { parseJson } from "./json";
import type { Io } from "./io";

/**
 * init 注入的源码（TOKENS_CSS_SOURCE / CN_UTIL_SOURCE）里出现的裸包说明符，
 * 必须全部在此声明，否则 init 出来的项目首屏构建即失败（init-core.test.ts 强制校验）。
 */
export const RUNTIME_DEPS = [
  "clsx",
  "tailwind-merge",
  "class-variance-authority",
  "tw-animate-css",
];

/**
 * init 注入源码常量由 scripts/generate-sources.ts 从 @tu-design/vue 源码生成
 * （TOKENS_CSS_SOURCE ← styles/tokens.css，CN_UTIL_SOURCE ← lib/utils.ts）。
 * 源文件变更后运行 pnpm --filter @tu-design/cli generate:sources 再生成；
 * init-core.test.ts 守卫测试会拦截漏跑。
 */
export { CN_UTIL_SOURCE, TOKENS_CSS_SOURCE };

export interface InitSummary {
  configPath: string;
  cnPath: string;
  cssPath: string;
  skippedCss: boolean;
  /** AGENTS.md 绝对/拼接路径（无论是否实际写入都返回）。 */
  agentsPath: string;
  /** true 表示未写入：显式 agents=false 或文件已存在（不覆盖）。 */
  skippedAgents: boolean;
}

/**
 * 判定项目是否满足 Tailwind CSS v4 前置条件：依赖中存在 tailwindcss 4.x 版本声明
 * （容忍 ~ 前缀等写法），且全局 CSS 已引入 tailwindcss。二者缺一即 false。
 * @param pkg - package.json 反序列化结果（取 dependencies 与 devDependencies）
 * @param globalCss - 全局 CSS 文件内容
 * @returns 满足 v4 前置条件返回 true
 */
export function detectTailwindV4(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  globalCss: string,
): boolean {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const tw = deps.tailwindcss;
  if (!tw || !/^[~^]?4\./.test(tw)) {
    return false;
  }
  return globalCss.includes('@import "tailwindcss"');
}

/**
 * 将 tokens 合并进用户全局 CSS：已含 dark variant 定制视为用户自管，原样返回；
 * 否则在 `import "tailwindcss";` 语句之后插入 tokens（无该语句则追加到文件尾部）。
 * @param userCss - 用户全局 CSS 内容
 * @param tokensCss - tokens CSS 内容
 * @returns 合并后的 CSS 内容；无需合并时为原文
 */
export function mergeTokensCss(userCss: string, tokensCss: string): string {
  if (userCss.includes("@custom-variant dark")) {
    return userCss;
  }
  const marker = '@import "tailwindcss";';
  const idx = userCss.indexOf(marker);
  if (idx === -1) {
    return `${userCss.trimEnd()}\n\n${tokensCss}`;
  }
  const end = idx + marker.length;
  return `${userCss.slice(0, end)}\n${tokensCss}${userCss.slice(end)}`;
}

/**
 * 以 POSIX 分隔符拼接路径片段：首段去尾斜杠、其余段去两端斜杠，空段剔除。
 * @param parts - 路径片段（依次为从根到叶）
 * @returns 拼接后的 POSIX 路径
 */
function joinPosix(...parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .filter((p) => p.length > 0)
    .join("/");
}

/** 常见全局 CSS 位置（探测依次命中第一个含 @import "tailwindcss" 的文件）。 */
const CSS_PROBE = [
  "src/assets/main.css",
  "src/style.css",
  "src/index.css",
  "src/main.css",
  "src/App.css",
  "style.css",
];

/**
 * 探测实际生效的全局 CSS 路径：优先配置（或默认）路径，依次尝试常见位置，
 * 取第一个存在且含 tailwindcss 引入语句的文件；全部未命中则回退配置值。
 * @param io - IO 通道
 * @param cwd - 项目根目录
 * @param configured - 配置的 CSS 相对路径（--css 或默认值）
 * @returns 实际生效的 CSS 相对路径
 */
function probeCssPath(io: Io, cwd: string, configured: string): string {
  for (const rel of [configured, ...CSS_PROBE]) {
    const full = joinPosix(cwd, rel);
    if (io.exists(full) && io.readFile(full).includes('@import "tailwindcss"')) {
      return rel;
    }
  }
  return configured;
}

/**
 * 运行 init 命令：校验 Tailwind v4 环境 → 写/验 components.json → 注入 cn 工具与
 * tokens CSS → 按需写入 AGENTS.md → 配置路径别名。components.json 已存在时只校验不覆盖；
 * AGENTS.md 已存在或显式关闭时跳过（不覆盖用户自定义内容）。
 * @param io - IO 通道
 * @param cwd - 项目根目录
 * @param opts - init 选项（registry 地址、alias 根目录、CSS 路径、AGENTS.md 开关）
 * @returns 写入路径与跳过情况的摘要
 */
export function runInit(
  io: Io,
  cwd: string,
  opts: { registry: string; aliasRoot?: string; css?: string; agents?: boolean },
): InitSummary {
  const aliasRoot = opts.aliasRoot ?? "src";
  const config = defaultConfig(opts.registry);
  const cssRel = probeCssPath(io, cwd, opts.css ?? config.tailwind.css);
  const cssPath = joinPosix(cwd, cssRel);
  const globalCss = io.exists(cssPath) ? io.readFile(cssPath) : "";

  const pkgPath = joinPosix(cwd, "package.json");
  if (!io.exists(pkgPath)) {
    throw new Error(`未找到 ${pkgPath}，请在 npm 项目根目录运行 \`tu-design init\``);
  }
  const pkg = parseJson(io.readFile(pkgPath), "package.json") as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  if (!detectTailwindV4(pkg, globalCss)) {
    throw new Error(
      '未检测到 Tailwind CSS v4：需要 package.json 中的 tailwindcss ^4 依赖，以及全局 CSS 中的 @import "tailwindcss";',
    );
  }

  const configPath = joinPosix(cwd, "components.json");
  if (io.exists(configPath)) {
    validateConfig(parseJson(io.readFile(configPath), "components.json"));
  } else {
    saveConfig(io, cwd, { ...config, tailwind: { css: cssRel } });
  }

  const utilsRel = config.aliases.utils.replace(/^@\//, "");
  const cnPath = joinPosix(cwd, aliasRoot, `${utilsRel}.ts`);
  io.writeFile(cnPath, CN_UTIL_SOURCE);

  const merged = mergeTokensCss(globalCss, TOKENS_CSS_SOURCE);
  const skippedCss = merged === globalCss;
  if (!skippedCss) {
    io.writeFile(cssPath, merged);
  }

  // AGENTS.md（AI 协作规则）：显式关闭或已存在时跳过，已存在不覆盖用户自定义内容。
  const agentsPath = joinPosix(cwd, "AGENTS.md");
  const skippedAgents = opts.agents === false || io.exists(agentsPath);
  if (!skippedAgents) {
    io.writeFile(agentsPath, AGENTS_MD_SOURCE);
  }

  applyAliases(io, cwd, aliasRoot);

  return { configPath, cnPath, cssPath, skippedCss, agentsPath, skippedAgents };
}
