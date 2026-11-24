import type { BadgeVariants } from "../badge";
import type { ButtonVariants } from "../button";
import type { PropType, VNodeChild } from "vue";
import type { DataRecord, TableColumnOptions } from "./types";
import { defineComponent, h, ref, watch } from "vue";
import Badge from "../badge/Badge.vue";
import Button from "../button/Button.vue";
import Popconfirm from "../popconfirm/Popconfirm.vue";

/** 单元格渲染上下文（第 4 参，可选）：页内序号等显示语义 */
export interface ColumnRenderContext {
  /** 当前页内 0-based 显示位次（排序/展开后的可见顺序） */
  pageRowIndex: number;
  /** 1-based 当前页码 */
  pageIndex: number;
  /** 当前每页条数 */
  pageSize: number;
}

/** 单元格渲染器：与 TableColumnOptions.render 同签名（column 用于读取字段值） */
export type ColumnRender<T extends DataRecord> = (
  record: T,
  /** 数据源下标（跨页连续、不受排序影响） */
  index: number,
  column: TableColumnOptions<T>,
  /** 页内显示上下文（可选；serial 等内置渲染器使用） */
  context?: ColumnRenderContext,
) => VNodeChild;

export type DictEntryVariant = BadgeVariants["variant"];

export type DictColumnMapping = Record<
  string | number,
  string | { label: string; variant?: DictEntryVariant }
>;

export interface DictColumnOptions {
  /** 整列统一 Badge 形态；条目级 variant 优先 */
  badge?: DictEntryVariant | true;
}

/** 日期模式串（迷你令牌 yyyy MM dd HH mm ss），如 "yyyy-MM-dd HH:mm" */
export type DateColumnPattern = string;

export interface SerialColumnOptions {
  /** 起始序号，默认 1 */
  base?: number;
}

/** 操作按钮二次确认配置（气泡形态，复用 Popconfirm）；title/description 支持按行求值 */
export interface TableActionConfirm<T extends DataRecord> {
  /** 气泡标题（必填） */
  title: string | ((record: T, index: number) => string);
  /** 气泡描述（可选） */
  description?: string | ((record: T, index: number) => string);
  /** 确认按钮文案，默认 "确定" */
  confirmText?: string;
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string;
  /** 确认按钮风格；缺省时按钮 variant 为 destructive 则推断 destructive，否则 default */
  variant?: "default" | "destructive";
}

export interface TableActionButton<T extends DataRecord> {
  text: string | ((record: T, index: number) => string);
  /** 点击回调；有 confirm 时仅在气泡确认后触发。返回 Promise 时确认钮 loading 并锁定关闭通道，resolve 自动关闭、reject 保持打开（其余返回值忽略） */
  onClick?: (record: T, index: number) => unknown;
  variant?: ButtonVariants["variant"];
  disabled?: (record: T, index: number) => boolean;
  /** 二次确认：字符串简写 = 气泡标题；对象形态全字段可配。不传则点击直接执行 onClick */
  confirm?: string | TableActionConfirm<T>;
}

/** 图片列配置；单元格值取自 record[column.key]，须为非空字符串 URL（其余值渲染为空） */
export interface ImageColumnOptions<T extends DataRecord> {
  /** 方形边长 px，默认 40（inline style，不占用 Tailwind 类） */
  size?: number;
  /** 图片适应方式，默认 cover */
  fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** 外形，默认 rounded（rounded-md） */
  shape?: "rounded" | "square" | "circle";
  /** 替代文本，默认 ""（装饰图语义）；建议按行传入有意义的描述 */
  alt?: string | ((record: T, index: number) => string);
  /** 加载失败时的备用图 URL（仅切换一次，备用也失败则显示占位盒）；支持按行求值 */
  fallback?: string | ((record: T, index: number) => string);
}

export interface ColumnRenders<T extends DataRecord> {
  /** 逃逸口：自定义渲染器与内置同一范式 */
  render: (fn: ColumnRender<T>) => ColumnRender<T>;
  dict: (mapping: DictColumnMapping, options?: DictColumnOptions) => ColumnRender<T>;
  date: (pattern?: DateColumnPattern) => ColumnRender<T>;
  currency: (currency?: string, locale?: string) => ColumnRender<T>;
  serial: (base?: number) => ColumnRender<T>;
  /** 操作列按钮组；按钮组为行内级（inline-flex），随单元格 align 对齐（默认居中） */
  button: (items: Array<TableActionButton<T> | string>) => ColumnRender<T>;
  /** 图片缩略图列；原生 img + loading="lazy"，失败切 fallback、再失败占位盒 */
  image: (options?: ImageColumnOptions<T>) => ColumnRender<T>;
}

/**
 * 两位补零
 * @param value - 数字（月/日/时/分/秒）
 * @returns 补零后的两位字符串
 */
const pad = (value: number) => String(value).padStart(2, "0");

/**
 * 迷你日期令牌格式化，不引入 date-fns；非法输入原样返回
 * @param input - 单元格原始值（Date 或可构造 Date 的字符串/数字）
 * @param pattern - 令牌模板（支持 yyyy/MM/dd/HH/mm/ss）
 * @returns 格式化后的文本；输入非法时原样返回
 */
function formatDate(input: unknown, pattern: string): VNodeChild {
  const date = input instanceof Date ? input : new Date(input as string | number);
  if (Number.isNaN(date.getTime())) return input as VNodeChild;
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (token) => tokens[token]!);
}

// 字面类名映射（Tailwind 静态扫描要求完整类名，禁止 `object-${fit}` 式插值拼接）
const FIT_CLASS = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
} as const;

const SHAPE_CLASS = {
  rounded: "rounded-md",
  square: "rounded-none",
  circle: "rounded-full",
} as const;

/**
 * 单元格图片内部组件（不导出）：error 计数状态机驱动 原图 → fallback → 占位盒。
 * errors 单调递增防循环切换；watch src 复位，防虚拟滚动/分页行复用串图。
 */
const CellImage = defineComponent({
  name: "TuCellImage",
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
    fallback: { type: String, default: undefined },
    size: { type: Number, default: 40 },
    fit: { type: String as PropType<keyof typeof FIT_CLASS>, default: "cover" },
    shape: { type: String as PropType<keyof typeof SHAPE_CLASS>, default: "rounded" },
  },
  setup(props) {
    const errors = ref(0);
    watch(
      () => props.src,
      () => {
        errors.value = 0;
      },
    );
    return () => {
      const sizeStyle = { width: `${props.size}px`, height: `${props.size}px` };
      const shapeClass = SHAPE_CLASS[props.shape];
      // 0 → 原图；1 且有 fallback → 备用图；其余（无 fallback / 备用也失败）→ 占位盒
      const currentSrc =
        errors.value === 0 ? props.src : errors.value === 1 ? props.fallback : undefined;
      if (!currentSrc) {
        return h(
          "div",
          {
            class: ["bg-muted text-muted-foreground flex items-center justify-center", shapeClass],
            style: sizeStyle,
            "aria-hidden": "true",
          },
          [
            h(
              "svg",
              {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                class: "size-1/2",
                "aria-hidden": "true",
              },
              [
                h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
                h("circle", { cx: "9", cy: "9", r: "2" }),
                h("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }),
              ],
            ),
          ],
        );
      }
      return h("img", {
        src: currentSrc,
        alt: props.alt,
        loading: "lazy",
        class: ["bg-muted", shapeClass, FIT_CLASS[props.fit]],
        style: sizeStyle,
        onError: () => {
          errors.value++;
        },
      });
    };
  },
});

/**
 * 内置列渲染器工厂：dict/date/currency/serial/button/image。
 * 返回值直接填入 TableColumnOptions.render；column 参数用于读取字段值。
 * 与 FormRender widget 的 r.xxx() 范式共词根。
 * @returns 各内置渲染器集合（render/dict/date/currency/serial/button/image）
 */
export function columnRenders<T extends DataRecord>(): ColumnRenders<T> {
  return {
    render: (fn) => fn,

    dict(mapping, options) {
      return (record, _index, column) => {
        const raw = (record as Record<string, unknown>)[column.key];
        const entry = mapping[raw as string | number];
        if (entry === undefined) return (raw ?? "") as VNodeChild;

        const label = typeof entry === "string" ? entry : entry.label;
        const entryVariant = typeof entry === "object" ? entry.variant : undefined;
        // Badge 形态：条目级 variant，或整列 badge 简写
        if (entryVariant !== undefined || options?.badge !== undefined) {
          const variant = entryVariant ?? (options?.badge === true ? undefined : options?.badge);
          return h(Badge, { variant }, () => label);
        }
        return label;
      };
    },

    date(pattern = "yyyy-MM-dd") {
      return (record, _index, column) =>
        formatDate((record as Record<string, unknown>)[column.key], pattern);
    },

    currency(currency = "CNY", locale = "zh-CN") {
      const format = new Intl.NumberFormat(locale, { style: "currency", currency });
      return (record, _index, column) => {
        const raw = (record as Record<string, unknown>)[column.key];
        const value = typeof raw === "string" ? Number(raw) : raw;
        if (typeof value !== "number" || Number.isNaN(value)) return raw as VNodeChild;
        return format.format(value);
      };
    },

    serial(base = 1) {
      return (_record, index, _column, context) => (context?.pageRowIndex ?? index) + base;
    },

    // inline-flex（行内级）：按钮组随单元格 align 对齐（默认居中）；块级 flex 占满单元格、恒左起
    button(items) {
      return (record, index) => {
        if (items.length === 0) return "";
        return h(
          "div",
          { class: "inline-flex items-center gap-1" },
          items.map((item) => {
            const action = typeof item === "string" ? { text: item } : item;
            const buttonNode = h(
              Button,
              {
                size: "sm",
                variant: action.variant ?? "link",
                disabled: action.disabled?.(record, index),
                // 有 confirm 时 Button 不挂 onClick：触发点击只开气泡，onClick 仅经
                // Popconfirm.onConfirm 在确认后执行（asChild 合并监听器，不剥离即双触发）
                onClick: action.confirm ? undefined : () => action.onClick?.(record, index),
              },
              () => (typeof action.text === "function" ? action.text(record, index) : action.text),
            );
            if (!action.confirm) return buttonNode;

            const confirm: TableActionConfirm<T> =
              typeof action.confirm === "string" ? { title: action.confirm } : action.confirm;
            const resolveText = (value?: string | ((rec: T, i: number) => string)) =>
              typeof value === "function" ? value(record, index) : value;
            // pending 语义零成本继承：useConfirmPending 从 vnode.props.onConfirm 直取处理器，
            // onClick 返回 Promise → loading + 锁定关闭通道 + resolve 自动关闭 / reject 保持打开
            return h(
              Popconfirm,
              {
                title: resolveText(confirm.title)!,
                description: resolveText(confirm.description),
                confirmText: confirm.confirmText,
                cancelText: confirm.cancelText,
                variant:
                  confirm.variant ?? (action.variant === "destructive" ? "destructive" : "default"),
                onConfirm: () => action.onClick?.(record, index),
              },
              () => buttonNode,
            );
          }),
        );
      };
    },

    image(options) {
      return (record, index, column) => {
        const raw = (record as Record<string, unknown>)[column.key];
        // 非字符串（含 null/undefined/number）与空串 → 空字符串，不产生节点（对齐 dict 兜底）
        if (typeof raw !== "string" || raw === "") return "";
        const resolveText = (value?: string | ((rec: T, i: number) => string)) =>
          typeof value === "function" ? value(record, index) : value;
        return h(CellImage, {
          src: raw,
          alt: resolveText(options?.alt) ?? "",
          fallback: resolveText(options?.fallback),
          size: options?.size,
          fit: options?.fit,
          shape: options?.shape,
        });
      };
    },
  };
}
