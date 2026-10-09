import { type DateValue, parseDate } from "@ark-ui/vue/date-picker";

/** ISO 日期串格式（yyyy-MM-dd）：TDatePicker 公开值域与后续日期变体的基础格式 */
export type IsoDate = string;

/**
 * "yyyy-MM-dd" → DateValue（@internationalized/date 纯日历解析，无时区参与）。
 * 非法/非严格 ISO（如 "abc"、"2026-2-3"、"2026/10/09"）返回 undefined，由调用方忽略。
 */
export function parseIsoDate(raw: string): DateValue | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  try {
    return parseDate(raw);
  } catch {
    return undefined;
  }
}

/** DateValue → "yyyy-MM-dd"（CalendarDate.toString 原生 ISO 输出） */
export function formatIsoDate(date: DateValue): string {
  return date.toString();
}
