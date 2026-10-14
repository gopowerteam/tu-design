# TreeSelect / Cascader 实施方案（修订版 v2）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `@tu-design/vue` 新增一站式（props 驱动）的 `TTreeSelect` 与 `TCascader` 表单组件，行为对齐 naive-ui。

**Architecture:** 共享树数据层 `tree-shared`（移植 treemate v0.3.11 核心源码，MIT 署名）+ 两个独立组件目录（各含内部面板）。数据状态机全部下沉 tree-shared，组件只做交互与渲染。

**Tech Stack:** Vue 3.5 defineProps 对象式 + `@ark-ui/vue`（Popover 原语）+ treemate 移植代码 + vitest（`vite-plus/test`）+ @vue/test-utils + happy-dom。

**Spec:** 本会话 2026-10-14 设计讨论（对话记录）；关键决策已固化到下文。

## Global Constraints

- 一切命令经由 `vp`，不直接调 vite/vitest/oxlint
- **零新增 npm 依赖**：treemate 源码移植进 `tree-shared`，不改 catalog
- 移植的 treemate 文件**每个文件头保留 MIT 版权声明**（Copyright 07akioni, treemate, MIT）；`process.env.NODE_ENV !== "production"` 一律替换为 `import.meta.env?.DEV`
- **表单集成约定**（DatePicker 同款）：组件 `defineOptions({ inheritAttrs: false })`，attrs（`id`/`aria-*`）转发到触发器元素；filterable 时转发到内嵌 input
- 组件受控模式恒走受控 + 内部 ref 兜底（Select/DatePicker 同款「受控桥接」）
- 组件目录内 `registry.meta.json` 必备；**凡改动 `src/components/` 的任务，收尾必须 `cd packages/vue && vp run generate:registry`**
- 注释与测试描述用中文，标识符用英文
- 节点 DOM 约定（测试依赖）：行元素 `data-part="tree-node"` + `data-key`；状态属性 `data-checked` / `data-indeterminate` / `data-expanded` / `data-active`；触发器 `[data-part="trigger"]`、面板 `[data-part="content"]`
- **测试清理约定**：组件内嵌 zag popover 会在 body 留下 portal 节点，afterEach 须同时移除 `[data-scope="popover"]` 与组件自身的 `[data-scope]` 根节点

## Review Focus

1. **checkStrategy 运行时切换** → 值集合按新 strategy 归一（Task 4 钉住）
2. **`options` 变更后 `modelValue` 含失效 key** → 静默忽略，不崩溃不回显（Task 3 钉住）
3. **multiple 下 `modelValue` 为 `undefined` / `[]` 混用** → 均视为无选中（Task 3 钉住）
4. **重复 key / `children: []`** → dev 警告但不崩溃（Task 1 钉住）
5. **键盘导航将 active 移出可视区** → 节点 `scrollIntoView({ block: "nearest" })`（Task 5 实现并手测）

---

### Task 1: tree-shared 数据层（移植 treemate 核心）

**Files:**

- Create: `packages/vue/src/components/tree-shared/{interface,utils,create,check,flatten,path,move,contains,index,types}.ts`
- Create: `packages/vue/src/components/tree-shared/registry.meta.json`
- Test: `packages/vue/src/components/tree-shared/tree-shared.test.ts`

**Interfaces（Produces）:**

```ts
// index.ts 导出
export { createTreeMate } from "./create";
export { flatten } from "./flatten";
export type { Key, CheckStrategy, RawNode, KeyedRawNode, TreeNode, TreeMate, MergedKeys } from "./interface";
export type { TreeOption } from "./types";
// types.ts：公开选项类型（label 显式化，其余透传）
export interface TreeOption { key: Key; label?: string; children?: TreeOption[]; disabled?: boolean; isLeaf?: boolean; [key: string]: unknown }
// create.ts：与 treemate v0.3.11 签名一致
createTreeMate(rawNodes, options?): TreeMate
// TreeMate 关键成员：treeNodes / treeNodeMap / getFlattenedNodes(expandedKeys?) /
// getCheckedKeys(checkedKeys, { cascade?, checkStrategy? }): MergedKeys /
// check(keys, checkedKeys, opts): MergedKeys / uncheck(...) / getPath(key, opts) / getNonLeafKeys(opts?)
```

- `registry.meta.json`：`{ "description": "树形数据层与共享类型（移植自 treemate v0.3.11，MIT）。", "dependencies": {} }`

- [ ] **Step 1：写失败测试**（`import { describe, expect, it, vi } from "vite-plus/test"`，中文用例名）
  - `flatten 按展开态输出可见节点序列`：两层树默认只展开根 → `flatten(treeMate.treeNodes, expandedKeys)` 输出 `[根, 子1]`
  - `getCheckedKeys cascade=true checkStrategy=all 返回全选与半选`：勾全叶子 → `{ checkedKeys: [父, ...叶子], indeterminateKeys: [] }`；只勾一叶 → 父进 `indeterminateKeys`
  - `checkStrategy=child 时值仅含叶子`；`checkStrategy=parent 时值仅含父`
  - `check/uncheck 增量勾选返回新 MergedKeys`
  - `getPath 返回 keyPath 自根至该节点`
  - `重复 key 与空 children 仅告警不抛错`（vi.spyOn console.error）
- [ ] **Step 2：运行确认失败** — `cd packages/vue && vp test --run tree-shared`，期望 FAIL（模块不存在）
- [ ] **Step 3：移植源码** — 从 https://github.com/07akioni/treemate/tree/master/src 逐文件移植 8 个模块 + `index.ts` + `types.ts`；每文件头加署名；替换 NODE_ENV 判断
- [ ] **Step 4：运行确认通过** — 同 Step 2 命令，期望 PASS
- [ ] **Step 5：再生成 registry** — `cd packages/vue && vp run generate:registry`（出现 `tree-shared.json`）
- [ ] **Step 6：提交** — `git add packages/vue/src/components/tree-shared packages/vue/registry && git commit -m "feat: ✨ 新增 tree-shared 树数据层（移植 treemate 核心）"`

### Task 2: tree-shared 共享触发器 UI

**Files:**

- Create: `packages/vue/src/components/tree-shared/{ValueTags,ClearIcon,ChevronIcon}.vue`
- Test: `packages/vue/src/components/tree-shared/tree-shared-ui.test.ts`

**Interfaces（Produces）:**

```ts
// ValueTags.vue props：values: { key: Key; label: string }[]；maxTagCount?: number；
//   disabled?: boolean；emits：remove [key: Key]、clear []
//   渲染：每个 tag 一个 <span data-part="tag" data-key>（含 × 按钮 data-part="tag-remove"），
//   超出 maxTagCount 折叠为 <span data-part="tag-overflow">+N</span>
// ChevronIcon.vue：chevron-right 路径，class 控制旋转（展开时 rotate-90）
// ClearIcon.vue：× 路径（视觉参考 date-shared/ClearIcon.vue，代码自包含不跨目录 import）
```

- [ ] **Step 1：写失败测试**：3 值 + `maxTagCount: 2` → 断言 2 个 tag + `+1` 折叠符；`tag-remove` 事件携带对应 key
- [ ] **Step 2：运行确认失败** — `vp test --run tree-shared-ui`
- [ ] **Step 3：实现三个 SFC**（样式走 tokens 语义类）
- [ ] **Step 4：运行确认通过**
- [ ] **Step 5：再生成 registry**（ValueTags 等 .vue 文件入条目）
- [ ] **Step 6：提交** — `git commit -m "feat: ✨ tree-shared 共享多标签与图标子组件"`

### Task 3: TreeSelect 单选 / 多选（非 checkable）

**Files:**

- Create: `packages/vue/src/components/tree-select/{TreeSelect.vue,TreePanel.vue,types.ts,index.ts,registry.meta.json}`
- Test: `packages/vue/src/components/tree-select/TreeSelect.test.ts`

**Interfaces:**

- Consumes: Task 1 `createTreeMate/flatten/TreeOption`，Task 2 `ValueTags/ClearIcon/ChevronIcon`
- Produces:

```ts
// TreeSelect props（defineProps 对象式 + 中文 JSDoc，DatePicker 同款）：
//   options: TreeOption[]（required）；modelValue: Key | Key[] | undefined；defaultValue 同型；
//   multiple?: boolean；open?: boolean | undefined；defaultOpen?: boolean；
//   disabled?: boolean | undefined；placeholder?: string（默认"请选择"）；
//   maxTagCount?: number；clearable?: boolean；class?: string
// emits：update:modelValue [Key | Key[] | undefined]、update:show [boolean]、update:expandedKeys [Key[]]
// attrs：inheritAttrs: false，全部 attrs 转发到触发器元素
// index.ts：export { default as TreeSelect } from "./TreeSelect.vue";
//           export type { TreeOption, Key, CheckStrategy } from "../tree-shared";
// registry.meta.json：{ "description": "树形下拉选择：一站式 props 驱动，支持单/多选、勾选级联、过滤与多标签折叠。",
//   "registryDependencies": ["tree-shared", "utils"], "dependencies": { "@ark-ui/vue": "catalog:" } }
// 弹层：直接用 @ark-ui/vue/popover 原语（容器样式参考 popover/PopoverContent.vue），max-h-[280px] overflow-auto
```

- [ ] **Step 1：写失败测试**（Host + `mount(Host, { attachTo: document.body })`、`vi.waitFor`；afterEach 同时清理 `[data-scope="popover"]` 与组件根节点）
  - `点击触发器打开面板渲染树节点，单选点击子节点回显并关闭`
  - `multiple 下点击多个节点 tags 依次展示`
  - `maxTagCount 折叠超出项`
  - `modelValue 为 undefined 或 [] 均视为无选中`
  - `options 变更后残留失效 key 被静默忽略`（不回显、不报错）
  - `clearable 单选点击清空发出 undefined`
  - `clearable multiple 点击清空发出 []`
  - `宿主传入的 id 落在触发器元素上`（`mountSelect({ attrs: { id: "ts" } })` → `trigger()!.id === "ts"`）
- [ ] **Step 2：运行确认失败** — `vp test --run TreeSelect`
- [ ] **Step 3：实现** — TreeSelect.vue（`inheritAttrs: false` + attrs 转发 + 受控桥接 + Ark Popover + 触发器）+ TreePanel.vue（按 `getFlattenedNodes(expandedKeys)` 渲染行，点击选中；ChevronIcon 切换展开）；单选非 checkable 时任意非 disabled 节点可选
- [ ] **Step 4：运行确认通过**
- [ ] **Step 5：再生成 registry**
- [ ] **Step 6：提交** — `git commit -m "feat: ✨ 新增 TreeSelect 组件（单选/多选）"`

### Task 4: TreeSelect checkable 级联勾选

**Files:** Modify: `TreeSelect.vue`、`TreePanel.vue`、`types.ts`；Test: `TreeSelect.test.ts`（追加）

**Interfaces:** 新增 props：`checkable?: boolean`、`cascade?: boolean`（默认 false，实现时以 naive-ui 文档核对）、`checkStrategy?: CheckStrategy`（默认 `"all"`）、`defaultExpandAll?: boolean`、`defaultExpandedKeys?: Key[]`、`expandedKeys?: Key[]`

> **钉死**：**`checkable=true` 时 `modelValue` 恒为 `Key[]`（等价 multiple）**；此时若传入单值 `Key`，按无选中处理并 dev 警告一次。

- [ ] **Step 1：写失败测试（追加）**：`checkable 点击勾选级联父子（cascade=true 时父勾子全勾）`、`checkStrategy=child 值仅含叶子`、`部分勾选父级显示半选 data-indeterminate`、`再次点击取消勾选`、`checkStrategy 运行时切换后值集合按新 strategy 归一`、`checkable 下传入单值 Key 按无选中处理且 dev 警告`
- [ ] **Step 2：运行确认失败**
- [ ] **Step 3：实现** — 勾选走 `treeMate.check/uncheck(key, checkedKeys, { cascade, checkStrategy })`；checkbox 用 CSS 绘制（勾/横线两态）
- [ ] **Step 4：运行确认通过**
- [ ] **Step 5：再生成 registry**
- [ ] **Step 6：提交** — `git commit -m "feat: ✨ TreeSelect 支持勾选级联与 checkStrategy"`

### Task 5: 键盘导航（tree-shared/keyboard.ts）+ TreeSelect filterable

**Files:**

- Create: `packages/vue/src/components/tree-shared/keyboard.ts`
- Modify: `TreePanel.vue`、`TreeSelect.vue`
- Test: `packages/vue/src/components/tree-shared/keyboard.test.ts` + `TreeSelect.test.ts`（追加）

**Interfaces（钉死）:**

```ts
// tree-shared/keyboard.ts —— 移动游标纯函数（展开/选中/勾选由面板按 activeKey 自行解释）
export function nextActiveKey(
  flattened: TreeNode[], // getFlattenedNodes(expandedKeys) 的可见序列
  activeKey: Key | null,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
  options?: { loop?: boolean }, // 默认 loop: true，跳过 disabled
): Key | null;
```

- 键盘映射：`ArrowDown/Up/Home/End` 走 `nextActiveKey`；`ArrowRight` 展开 active（有子级）/进入子级；`ArrowLeft` 折叠/回父级（Cascader 亦复用此文件）；`Enter` 选中或勾选 active
- [ ] **Step 1：写失败测试**（keyboard.test.ts）：`ArrowDown 沿可见序列移动且跳过 disabled`、`末尾循环回首行`、`Home/End 定位首末`；TreeSelect.test.ts 追加：`ArrowDown 移动 data-active 到下一可见节点`、`Enter 选中 active 节点`、`ArrowRight 展开节点`、`ArrowLeft 折叠回父级`、`filterable 输入"子"后面板只剩匹配节点及其祖先路径`
- [ ] **Step 2：运行确认失败** — `vp test --run keyboard` 与 `vp test --run TreeSelect`
- [ ] **Step 3：实现**（active 节点 `scrollIntoView({ block: "nearest" })`；`role="tree"/"treeitem"` + `aria-selected`/`aria-checked`/`aria-expanded`；filterable 触发器内嵌 input，attrs 转发改指向 input）
- [ ] **Step 4：运行确认通过**
- [ ] **Step 5：再生成 registry**
- [ ] **Step 6：提交** — `git commit -m "feat: ✨ 树形键盘导航与 TreeSelect 过滤"`

### Task 6: Cascader 组件

**Files:**

- Create: `packages/vue/src/components/cascader/{Cascader.vue,CascaderPanel.vue,types.ts,index.ts,registry.meta.json}`
- Test: `packages/vue/src/components/cascader/Cascader.test.ts`

**Interfaces:**

- Consumes: tree-shared 全部（含 Task 5 keyboard.ts）
- Produces:

```ts
// Cascader props：Task 3/4 的 options/modelValue/defaultValue/multiple/checkable/cascade/
//   checkStrategy/clearable/disabled/placeholder/maxTagCount/open/defaultOpen/class 全套，另加：
//   expandTrigger?: "click" | "hover"（默认 "click"）；showPath?: boolean（默认 true）；
//   separator?: string（默认 " / "）
// emits：update:modelValue、update:show
// attrs：inheritAttrs: false，转发到触发器元素
// a11y（钉死）：每列 role="listbox"，节点 role="option" + aria-selected；
//   checkable 时节点加 aria-checked；列容器 aria-expanded 标注展开路径
// index.ts：export { default as Cascader } from "./Cascader.vue";
// registry.meta.json：registryDependencies: ["tree-shared", "utils"]，dependencies: { "@ark-ui/vue": "catalog:" }
// 单选语义：点击父级仅展开，点击叶子才选中；showPath 回显按 getPath 拼 keyPath
```

- [ ] **Step 1：写失败测试**（afterEach 清理同 Task 3 约定）：`单选点击叶子回显路径 a / b / c 并关闭`、`点击父级仅展开不选中`、`expandTrigger=hover 悬停展开下级`、`multiple+checkable 级联勾选各列 checkbox`、`键盘 ArrowRight 进入下级列 ArrowLeft 返回`、`Esc 关闭`、`宿主传入的 id 落在触发器元素上`
- [ ] **Step 2：运行确认失败** — `vp test --run Cascader`
- [ ] **Step 3：实现** — CascaderPanel.vue 多列布局（每列一层数据，列内沿用 `data-part="tree-node"` 约定）；勾选复用 `treeMate.check/uncheck`；移动游标复用 `nextActiveKey`
- [ ] **Step 4：运行确认通过**
- [ ] **Step 5：再生成 registry**
- [ ] **Step 6：提交** — `git commit -m "feat: ✨ 新增 Cascader 级联选择组件"`

### Task 7: 导出 / resolver 接入与全量校验

**Files:**

- Modify: `packages/vue/src/index.ts`（字母序插入 `export * from "./components/cascader"`（card 之后、checkbox 之前）与 `export * from "./components/tree-select"`（textarea 之后、tooltip 之前））
- Modify: `packages/vue/src/resolver.ts` — `COMPONENT_NAMES` 插入 `"Cascader"`（`"Checkbox"` 之前）与 `"TreeSelect"`（`"Textarea"` 之后、`"Tooltip"` 之前）

- [ ] **Step 1：编辑两个文件**
- [ ] **Step 2：全量校验** — `vp check && vp run -r typecheck && cd packages/vue && vp test --run`
- [ ] **Step 3：兜底再生成** — `cd packages/vue && vp run generate:registry`（幂等，应无漂移）
- [ ] **Step 4：提交** — `git commit -m "feat: 🔌 导出 Cascader / TreeSelect 并更新 resolver"`

### Task 8: 文档与 demos

**Files:**

- Create: `apps/docs/components/tree-select.md`、`apps/docs/components/cascader.md`（结构照抄 `components/select.md`）
- Create: `apps/docs/demos/tree-select/TreeSelectDemo.vue`（基础 + checkable 级联 + filterable 三块）、`apps/docs/demos/cascader/CascaderDemo.vue`
- Modify: `apps/docs/.vitepress/config.mts` sidebar（约 127 行，字母序插入 `{ text: "Cascader", link: "/components/cascader" }` 与 `{ text: "TreeSelect", link: "/components/tree-select" }`）

- [ ] **Step 1：编写两份文档 + 两个 demo + sidebar 注册**
- [ ] **Step 2：本地验证** — 根目录 `pnpm docs` 访问 `/tu-design/components/tree-select` 与 `cascader` 确认渲染交互
- [ ] **Step 3：提交** — `git commit -m "docs: 📝 新增 TreeSelect / Cascader 文档与演示"`

### Task 9: 全量体检

- [ ] **Step 1：** 根目录 `vp run ready`——期望全绿
- [ ] **Step 2：** 如有格式/lint 修正，`git commit -m "fix: 🎨 体检修正"`
