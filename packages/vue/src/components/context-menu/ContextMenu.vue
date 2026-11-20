<script setup lang="ts">
import type { PropType } from "vue";
import { computed, useAttrs } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import type { MenuRootProps } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";
import { useOverlayIds } from "../overlay-shared/useOverlayIds";
import { withSandboxStrategy } from "../overlay-shared/useSandboxOverlay";
import { useTuProvider } from "../overlay-shared/config";
// 与 dropdown-menu 同构：items 类型与渲染逻辑直接复用其实现（单一事实来源）
import MenuItems from "../dropdown-menu/MenuItems.vue";
import type { MenuItemOption } from "../dropdown-menu/types";

defineOptions({ name: "ContextMenu", inheritAttrs: false });

const props = defineProps({
  /** 菜单项描述列表，与 DropdownMenu 的 items 完全同构（item/label/separator/group 四种形态，group 可嵌套） */
  items: { type: Array as PropType<MenuItemOption[]>, required: true },
  /** Ark Menu Root 的 positioning 配置（gutter 等；placement 由指针 anchorPoint 驱动）；
      iframe realm（wujie graft / iframe 嵌入）下 strategy 未显式指定时默认 fixed
      （absolute 包含块错位修正，机制详注见 useSandboxOverlay / sandbox.ts） */
  positioning: {
    type: Object as PropType<MenuRootProps["positioning"]>,
    default: undefined,
  },
});

// 仅暴露选中事件；开合由触发元素上的右键（contextmenu）事件驱动，ark 内部管理状态
const emit = defineEmits<{
  /** 选中某个 item 时触发（对齐 DropdownMenu 的事件语义） */
  select: [details: { value: string }];
}>();

// attrs 转发到面板元素（Root 不渲染 DOM，避免 fallthrough 警告）
const attrs = useAttrs();

// ids 全量覆盖（无冒号）：规避 wujie patch getElementById 对 zag 缺省冒号 id 的
// SyntaxError 刷屏（详注见 useOverlayIds）。menu 无 zag root 口，primary 取 content
// （与 DropdownMenu 同款）；右键开合期 machine 查询 getTriggerEl（本组件不渲染
// Trigger）缺省冒号 id 必 miss 刷警告（wujie 2.1.0 实测复现）；覆盖后 miss 落到
// 合法选择器静默 null。trigger/contextTrigger 双模式口以函数默认填充保 per-value
// 唯一，user 显式 attrs.ids 优先；group/groupLabel 函数口 user 直传保留。
const { ids, resolveId } = useOverlayIds(attrs, {
  primary: "content",
  parts: ["content", "arrow", "positioner"],
});
const rootIds = computed(() => {
  const merged = { ...ids.value };
  const stem = resolveId("content");
  if (merged.trigger == null)
    merged.trigger = (value?: string) =>
      value == null ? `${stem}-trigger` : `${stem}-trigger-${value}`;
  if (merged.contextTrigger == null)
    merged.contextTrigger = (value?: string) =>
      value == null ? `${stem}-ctx-trigger` : `${stem}-ctx-trigger-${value}`;
  return merged;
});
// Content 转发前剔除 ids：ids 已由 Root :ids 消费，直传会在面板元素上产生
// `ids="[object Object]"` 垃圾属性。
const contentAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.ids;
  return rest;
});

function handleSelect(details: { value: string }) {
  emit("select", details);
}

// 沙箱适配（机制详注见 useSandboxOverlay / sandbox.ts）：面板无 Teleport 留原地，
// iframe realm 下 strategy 默认 fixed 使指针 anchorPoint 视口坐标与包含块对齐
// Provider 显式配置快照：withSandboxStrategy 在 computed 内调用，inject 须于 setup 顶层捕获后传入
const tuProvider = useTuProvider();

const rootPositioning = computed(() =>
  withSandboxStrategy(props.positioning, { ...props.positioning }, tuProvider),
);

// 面板样式对齐 DropdownMenu 面板（token 化，暗色随主题变量自动切换）
const contentCls =
  "bg-popover text-popover-foreground z-[var(--z-overlay)] min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";
</script>

<template>
  <ArkMenu.Root :ids="rootIds" :positioning="rootPositioning" @select="handleSelect">
    <!-- 默认插槽 = 触发元素本身（ContextTrigger as-child 透传，右键唤出并定位到指针处） -->
    <ArkMenu.ContextTrigger as-child>
      <slot />
    </ArkMenu.ContextTrigger>

    <ArkMenu.Positioner class="z-[var(--z-overlay)]">
      <ArkMenu.Content v-bind="contentAttrs" :class="cn(contentCls)">
        <MenuItems :items="props.items" />
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </ArkMenu.Root>
</template>
