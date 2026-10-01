export interface SelectItemOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export function normalizeSelectItem(item: string | SelectItemOption): SelectItemOption {
  return typeof item === "string" ? { label: item, value: item } : item;
}
