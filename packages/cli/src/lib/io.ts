export interface Io {
  exists(path: string): boolean;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  readDir(path: string): string[];
}
