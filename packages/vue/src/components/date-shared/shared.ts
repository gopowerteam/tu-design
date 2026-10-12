import { type DateValue, parseDate } from "@ark-ui/vue/date-picker";

/**
 * 日期家族共享模块：ISO 值域解析（日期/月/年/区间）与日历样式常量。
 * 供 DatePicker / DateRangePicker 及后续变体（Month/Year/WeekPicker）复用。
 */

/** ISO 日期串格式（yyyy-MM-dd）：日期家族公开值域的基础格式 */
export type IsoDate = string;

/** zag 按 locale 分隔符清洗键入字符（zh-CN 为 "/"），解析前统一归一为 "-" */
function normalizeSeparators(raw: string): string {
  return raw.trim().replace(/\//g, "-");
}

/**
 * "yyyy-MM-dd" → DateValue（@internationalized/date 纯日历解析，无时区参与）。
 * 兼容 "/" 分隔（zag 键入清洗路径，如 "2026/10/09"），归一后做严格 ISO 校验；
 * 非法/非补零（如 "abc"、"2026-2-3"）返回 undefined，由调用方忽略。
 */
export function parseIsoDate(raw: string): DateValue | undefined {
  const normalized = normalizeSeparators(raw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  try {
    return parseDate(normalized);
  } catch {
    return undefined;
  }
}

/** DateValue → "yyyy-MM-dd"（CalendarDate.toString 原生 ISO 输出） */
export function formatIsoDate(date: DateValue): string {
  return date.toString();
}

/** "yyyy-MM" → DateValue（锚定 1 日）；非法/非补零返回 undefined */
export function parseIsoMonth(raw: string): DateValue | undefined {
  const normalized = normalizeSeparators(raw);
  if (!/^\d{4}-\d{2}$/.test(normalized)) return undefined;
  try {
    return parseDate(`${normalized}-01`);
  } catch {
    return undefined;
  }
}

/** DateValue → "yyyy-MM"（不能走 toString()，会带 day） */
export function formatIsoMonth(date: DateValue): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}`;
}

/** "yyyy" → DateValue（锚定 1 月 1 日）；非四位年份返回 undefined */
export function parseIsoYear(raw: string): DateValue | undefined {
  const normalized = normalizeSeparators(raw);
  if (!/^\d{4}$/.test(normalized)) return undefined;
  try {
    return parseDate(`${normalized}-01-01`);
  } catch {
    return undefined;
  }
}

/** DateValue → "yyyy" */
export function formatIsoYear(date: DateValue): string {
  return String(date.year);
}

/** 区间解析：逐侧 parseIsoDate + 顺序归一（start ≤ end）；null / 任一侧非法返回 undefined */
export function parseIsoRange(
  raw: [string, string] | null | undefined,
): [DateValue, DateValue] | undefined {
  if (!raw) return undefined;
  const start = parseIsoDate(raw[0] ?? "");
  const end = parseIsoDate(raw[1] ?? "");
  if (!start || !end) return undefined;
  return start.compare(end) <= 0 ? [start, end] : [end, start];
}

// —— 日期家族共享样式常量（与 TDatePicker 视觉规范一致）——

export const controlCls =
  "border-input flex h-9 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px]";
export const iconBtnCls =
  "text-muted-foreground/70 hover:text-foreground flex h-full w-8 shrink-0 items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-30";
export const navBtnCls =
  "text-muted-foreground inline-flex size-7 items-center justify-center rounded-md outline-none hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";
export const cellCls =
  "flex h-8 items-center justify-center text-sm outline-none hover:bg-accent data-[selected]:bg-primary data-[selected]:font-medium data-[selected]:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
// table-fixed：7 列日视图 / 4 列月年视图均分列宽，表头与内容同走原生 table 布局
export const tableCls = "w-full table-fixed border-collapse";
export const viewControlCls = "flex items-center justify-between pb-2";
export const viewTriggerCls =
  "hover:bg-accent inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium outline-none";
