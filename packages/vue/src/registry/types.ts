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
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files: RegistryFile[];
}

export interface RegistryIndex {
  $schema: string;
  name: string;
  items: { name: string; title: string; type: RegistryType; description?: string }[];
}

export interface RegistryMeta {
  description: string;
  registryDependencies?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}
