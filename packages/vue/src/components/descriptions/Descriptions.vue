<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useSlots, watch, type CSSProperties } from "vue";
import { cn } from "@/lib/utils";
import { packRows, resolveColumn } from "./columns";
import {
  descriptionsBodyVariants,
  descriptionsCellVariants,
  descriptionsHeaderVariants,
  descriptionsItemVariants,
  descriptionsVariants,
  type DescriptionsCellVariants,
  type DescriptionsColumn,
  type DescriptionsItemData,
  type DescriptionsItemVariants,
  type DescriptionsLabelAlign,
} from "./index";

type Size = NonNullable<DescriptionsCellVariants["size"]>;

/** bordered + left 且未显式传 labelWidth 时的标签列宽（固定宽度让各项分隔线对齐） */
const DEFAULT_BORDERED_LABEL_WIDTH = "8rem";

const titleSizeClass: Record<Size, string> = {
  sm: "text-sm",
  default: "text-base",
  lg: "text-lg",
};

const extraSizeClass: Record<Size, string> = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-sm",
};

const labelAlignClass: Record<DescriptionsLabelAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

interface Props {
  /** 数据源：按数组顺序自左而右、自上而下渲染 */
  items: DescriptionsItemData[];
  /** 头部标题（#title 插槽可覆盖） */
  title?: string;
  /** 头部右侧附加区文案（#extra 插槽可覆盖） */
  extra?: string;
  /** 列数；传断点对象时按视口宽度自适应（base 缺省 1），首帧按 base 渲染、挂载后校正 */
  column?: DescriptionsColumn;
  /** 标签位置：内容上方 / 左侧 */
  labelPlacement?: DescriptionsItemVariants["labelPlacement"];
  /** 标签对齐（仅 labelPlacement="left" 生效） */
  labelAlign?: DescriptionsLabelAlign;
  /** 左置标签列宽（数字按 px，字符串为单条轨道宽度）；缺省：bordered + left 为 8rem，其余 auto */
  labelWidth?: string | number;
  /** 尺寸：联动字号，bordered 时联动单元格 padding */
  size?: DescriptionsCellVariants["size"];
  /** 表格线 + 标签浅底 */
  bordered?: boolean;
  /** 左置标签后的分隔符（仅 labelPlacement="left" 且非 bordered 时渲染），空串关闭 */
  separator?: string;
  /** 追加/覆盖样式（经 cn 合并） */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  column: 3,
  labelPlacement: "top",
  labelAlign: "left",
  size: "default",
  bordered: false,
  separator: ":",
});

const slots = useSlots();

// 视口宽度挂载前恒为 0：服务端与客户端水合前的首帧都按 base 档解析，避免 hydration 不一致
const viewportWidth = ref(0);
const isResponsive = computed(() => typeof props.column === "object" && props.column !== null);
const columns = computed(() => resolveColumn(props.column, viewportWidth.value));

const packed = computed(() => packRows(props.items, columns.value));
// dl 的直接子元素必须是各项分组 div，行信息只用于计算 span，渲染前扁平化
const cells = computed(() => packed.value.rows.flat());

let listening = false;

/**
 * 按需挂载 / 移除 window resize 监听（仅断点对象模式需要，数字列数零监听）。
 * @param need - 是否需要监听
 */
function setResizeListening(need: boolean): void {
  if (typeof window === "undefined" || need === listening) return;
  if (need) window.addEventListener("resize", readResize);
  else window.removeEventListener("resize", readResize);
  listening = need;
}

/** resize 回调：仅记录视口宽度，列数由 computed 重新解析（同档内不触发渲染） */
function readResize(): void {
  viewportWidth.value = window.innerWidth;
}

let warnedClamp = false;

/** span 夹紧只在 DEV 且每个实例提示一次（服务端渲染不提示） */
function warnClampOnce(): void {
  if (!import.meta.env.DEV || warnedClamp || !packed.value.clamped) return;
  warnedClamp = true;
  console.warn(
    `[tu-design] <Descriptions> 存在 span 超出行剩余列的 item，已夹紧以保持每行填满（当前 ${columns.value} 列）`,
  );
}

onMounted(() => {
  if (typeof window !== "undefined") viewportWidth.value = window.innerWidth;
  setResizeListening(isResponsive.value);
  warnClampOnce();
});

watch(isResponsive, (need) => setResizeListening(need));
watch(() => packed.value.clamped, warnClampOnce);

onUnmounted(() => setResizeListening(false));

const hasTitle = computed(() => Boolean(slots.title) || Boolean(props.title));
const hasExtra = computed(() => Boolean(slots.extra) || Boolean(props.extra));

/**
 * 解析左置标签的轨道宽度；非法值（非正数 / 空串）回落到模式默认值。
 * @returns 单条 CSS 轨道宽度
 */
function resolveLabelTrack(): string {
  const width = props.labelWidth;
  if (typeof width === "number") {
    if (Number.isFinite(width) && width > 0) return `${width}px`;
  } else if (typeof width === "string" && width.trim() !== "") {
    return width;
  }
  return props.bordered ? DEFAULT_BORDERED_LABEL_WIDTH : "auto";
}

/** 左置标签的轨道宽度；top 模式不涉及 */
const labelTrack = computed<string | undefined>(() =>
  props.labelPlacement === "left" ? resolveLabelTrack() : undefined,
);

const rootClass = computed(() =>
  cn(descriptionsVariants({ bordered: props.bordered }), props.class),
);
const headerClass = computed(() =>
  descriptionsHeaderVariants({ bordered: props.bordered, size: props.size }),
);
const bodyClass = computed(() => descriptionsBodyVariants({ bordered: props.bordered }));
const bodyStyle = computed<CSSProperties>(() => ({
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
}));
const itemClass = computed(() =>
  descriptionsItemVariants({ labelPlacement: props.labelPlacement, bordered: props.bordered }),
);
const labelClass = computed(() =>
  cn(
    descriptionsCellVariants({ role: "label", size: props.size, bordered: props.bordered }),
    props.labelPlacement === "left" ? labelAlignClass[props.labelAlign] : undefined,
  ),
);
const contentClass = computed(() =>
  descriptionsCellVariants({ role: "content", size: props.size, bordered: props.bordered }),
);
// VariantProps 含 null 类型，实际有缺省值；用 ?? 兜底以获得确定的索引类型
const size = computed<Size>(() => props.size ?? "default");
const titleClass = computed(() =>
  cn("font-semibold leading-none tracking-tight", titleSizeClass[size.value]),
);
const extraClass = computed(() => cn("ml-auto text-muted-foreground", extraSizeClass[size.value]));

/**
 * 单元格内联样式：跨列数恒生效；左置标签追加「标签轨道 + 内容轨道」模板。
 * @param span - 打包后的最终跨列数
 * @returns 合并后的 style 对象
 */
function cellStyle(span: number): CSSProperties {
  const style: CSSProperties = { gridColumn: `span ${span}` };
  if (labelTrack.value) {
    style.gridTemplateColumns = `${labelTrack.value} minmax(0, 1fr)`;
  }
  return style;
}

/**
 * 分隔符仅在「左置标签 + 非 bordered + 有标签内容」时渲染。
 * @param item - 单项数据
 * @returns 是否渲染分隔符
 */
function hasSeparator(item: DescriptionsItemData): boolean {
  return (
    props.labelPlacement === "left" &&
    !props.bordered &&
    props.separator !== "" &&
    (Boolean(slots.label) || Boolean(item.label))
  );
}
</script>

<template>
  <div data-slot="descriptions" :class="rootClass">
    <div v-if="hasTitle || hasExtra" data-slot="descriptions-header" :class="headerClass">
      <h3 v-if="hasTitle" data-slot="descriptions-title" :class="titleClass">
        <slot name="title">{{ props.title }}</slot>
      </h3>
      <div v-if="hasExtra" data-slot="descriptions-extra" :class="extraClass">
        <slot name="extra">{{ props.extra }}</slot>
      </div>
    </div>

    <dl data-slot="descriptions-body" :class="bodyClass" :style="bodyStyle">
      <div
        v-for="cell in cells"
        :key="cell.item.key ?? cell.index"
        data-slot="descriptions-item"
        :class="itemClass"
        :style="cellStyle(cell.span)"
      >
        <dt data-slot="descriptions-label" :class="labelClass">
          <slot name="label" :item="cell.item" :index="cell.index">{{ cell.item.label }}</slot>
          <span
            v-if="hasSeparator(cell.item)"
            data-slot="descriptions-separator"
            class="ml-0.5"
            aria-hidden="true"
          >
            {{ props.separator }}
          </span>
        </dt>
        <dd data-slot="descriptions-content" :class="contentClass">
          <slot name="content" :item="cell.item" :index="cell.index">
            {{ cell.item.content }}
          </slot>
        </dd>
      </div>
    </dl>
  </div>
</template>
