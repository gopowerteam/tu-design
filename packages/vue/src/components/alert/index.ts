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
