/** Ark ValueChangeDetails → number|null（空串/NaN 归一 null，numberOrNull 为可单测的纯函数） */
export function numberOrNull(details: { value: string; valueAsNumber: number }): number | null {
  return details.value === "" || Number.isNaN(details.valueAsNumber) ? null : details.valueAsNumber;
}
