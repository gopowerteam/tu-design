/** 与 @tu-design/vue/src/registry/types.ts 的最小子集（刻意复制，避免跨包运行时依赖）。 */
export type RegistryType = "registry:ui" | "registry:lib" | "registry:style";

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

export interface RegistryItem {
  $schema: string;
  name: string;
  type: RegistryType;
  description?: string;
  registryDependencies?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  files: RegistryFile[];
}
