import type { Key, TreeNode } from "./interface";

/** 组件公开的选项类型：key/label/children 常用字段显式化，其余字段透传（对齐 naive-ui TreeOption） */
export interface TreeOption {
  key: Key;
  label?: string;
  children?: TreeOption[];
  disabled?: boolean;
  isLeaf?: boolean;
  [key: string]: unknown;
}

/** TreeOption 具象泛型下的树节点：裸 `TreeNode` 默认 RawNode 实例化，TS6 起方法级变体拒收具型节点 */
export type TreeOptionNode = TreeNode<TreeOption, TreeOption, TreeOption>;
