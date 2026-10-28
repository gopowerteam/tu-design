<script setup lang="ts">
import { useId } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";
import type { MenuItemOption } from "./types";

/** 当前层级要渲染的菜单项描述列表 */
defineProps<{ items: MenuItemOption[] }>();

/** #item 逃生口：自定义 item 内容渲染（仍包在 ArkMenu.Item 内，保留键盘导航与 select 行为） */
defineSlots<{
  item?: (props: { item: Extract<MenuItemOption, { type: "item" }> }) => unknown;
}>();

// —— 样式类（收编自原 DropdownMenuItem/Label/Separator 子组件）——
const itemCls =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";
const labelCls = "px-2 py-1.5 text-sm font-medium";
const separatorCls = "-mx-1 my-1 h-px bg-muted";

// 未提供 value 的 item 回退标识：useId 保证跨实例唯一，层级内索引保证实例内唯一
const uid = useId();

function valueFor(item: Extract<MenuItemOption, { type: "item" }>, index: number): string {
  return item.value ?? `${uid}-item-${index}`;
}
</script>

<template>
  <template
    v-for="(opt, i) in items"
    :key="opt.type === 'item' ? valueFor(opt, i) : `${opt.type}-${i}`"
  >
    <!-- 菜单项 -->
    <ArkMenu.Item
      v-if="opt.type === 'item'"
      :value="valueFor(opt, i)"
      :disabled="opt.disabled"
      :class="cn(itemCls, opt.class)"
    >
      <slot v-if="$slots.item" name="item" :item="opt" />
      <template v-else>{{ opt.label }}</template>
    </ArkMenu.Item>

    <!-- 独立分组标题（纯视觉） -->
    <div v-else-if="opt.type === 'label'" :class="cn(labelCls, opt.class)">
      {{ opt.label }}
    </div>

    <!-- 分隔线 -->
    <ArkMenu.Separator v-else-if="opt.type === 'separator'" :class="cn(separatorCls, opt.class)" />

    <!-- 分组：label 走 ItemGroupLabel 与 group 建立 aria 关联，子项递归渲染 -->
    <ArkMenu.ItemGroup v-else :class="opt.class">
      <ArkMenu.ItemGroupLabel v-if="opt.label" :class="labelCls">
        {{ opt.label }}
      </ArkMenu.ItemGroupLabel>
      <MenuItems :items="opt.children">
        <template v-if="$slots.item" #item="slotProps">
          <slot name="item" v-bind="slotProps" />
        </template>
      </MenuItems>
    </ArkMenu.ItemGroup>
  </template>
</template>
