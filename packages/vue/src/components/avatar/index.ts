import { cva, type VariantProps } from "class-variance-authority";
import type { InjectionKey, Ref } from "vue";

export { default as Avatar } from "./Avatar.vue";

export const avatarVariants = cva("inline-flex shrink-0 overflow-hidden bg-muted", {
  variants: {
    size: {
      xs: "size-6 text-[10px]",
      sm: "size-8 text-xs",
      md: "size-10 text-sm",
      lg: "size-12 text-base",
    },
    shape: {
      circle: "rounded-full",
      square: "rounded-md",
    },
  },
});

export type AvatarVariants = VariantProps<typeof avatarVariants>;

/** 头像组上下文：size 经 provide/inject 下发给子 Avatar（子级显式 size 优先） */
export interface AvatarGroupContext {
  size: Ref<AvatarVariants["size"] | number | undefined>;
}

export const avatarGroupKey: InjectionKey<AvatarGroupContext> = Symbol("tu-avatar-group");
