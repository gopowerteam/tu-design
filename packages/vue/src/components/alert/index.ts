import { cva, type VariantProps } from "class-variance-authority";

export { default as Alert } from "./Alert.vue";

export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm flex gap-3 items-start",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-[color-mix(in_oklab,var(--color-info)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-info)_10%,transparent)] text-foreground",
        success:
          "border-[color-mix(in_oklab,var(--color-success)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] text-foreground",
        warning:
          "border-[color-mix(in_oklab,var(--color-warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] text-foreground",
        error:
          "border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)] text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;

export const alertIconVariants = cva("size-4 shrink-0 mt-0.5", {
  variants: {
    variant: {
      default: "text-foreground",
      info: "text-info",
      success: "text-success",
      warning: "text-warning",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * 内置图标路径（按 variant 形状差异化，保证色弱用户可辨别）：
 * - default：圆圈 + i（信息）
 * - info：圆圈 + 感叹号
 * - success：圆圈 + 对勾
 * - warning：三角 + 感叹号
 * - error：圆圈 + 叉号
 */
export const alertIconPaths: Record<string, string> = {
  default: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4m0-4h.01",
  info: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 8v4m0 4h.01",
  success: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  warning:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  error: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM15 9l-6 6m0-6 6 6",
};
