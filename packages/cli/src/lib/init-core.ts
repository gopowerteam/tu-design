import { defaultConfig, saveConfig, validateConfig } from "./config";
import { applyAliases } from "./alias";
import type { Io } from "./io";

/**
 * 与 @tu-design/vue/src/styles/tokens.css 保持一致（init-core.test.ts 有防漂移守卫）。
 * 来源：packages/vue/src/styles/tokens.css
 */
export const TOKENS_CSS_SOURCE = `@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.269 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
`;

/** cn 工具模板，等价 @tu-design/vue/src/lib/utils.ts。 */
export const CN_UTIL_SOURCE = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

export interface InitSummary {
  configPath: string;
  cnPath: string;
  cssPath: string;
  skippedCss: boolean;
}

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

function probeCssPath(io: Io, cwd: string, configured: string): string {
  for (const rel of [configured, ...CSS_PROBE]) {
    const full = joinPosix(cwd, rel);
    if (io.exists(full) && io.readFile(full).includes('@import "tailwindcss"')) {
      return rel;
    }
  }
  return configured;
}

export function runInit(
  io: Io,
  cwd: string,
  opts: { registry: string; aliasRoot?: string; css?: string },
): InitSummary {
  const aliasRoot = opts.aliasRoot ?? "src";
  const config = defaultConfig(opts.registry);
  const cssRel = probeCssPath(io, cwd, opts.css ?? config.tailwind.css);
  const cssPath = joinPosix(cwd, cssRel);
  const globalCss = io.exists(cssPath) ? io.readFile(cssPath) : "";

  const pkg = JSON.parse(io.readFile(joinPosix(cwd, "package.json"))) as {
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
    validateConfig(JSON.parse(io.readFile(configPath)));
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

  applyAliases(io, cwd, aliasRoot);

  return { configPath, cnPath, cssPath, skippedCss };
}
