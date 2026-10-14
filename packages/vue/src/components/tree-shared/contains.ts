/*!
 * 移植自 treemate v0.3.11 —— https://github.com/07akioni/treemate
 * MIT License · Copyright (c) 07akioni
 * 本地改动：无实质改动。
 */
import type { TreeNode } from "./interface";

export function contains<R, G, I>(
  parent: TreeNode<R, G, I>,
  child: TreeNode<R, G, I> | null | undefined,
): boolean {
  const parentKey = parent.key;
  while (child) {
    if (child.key === parentKey) return true;
    child = child.parent as any;
  }
  return false;
}
