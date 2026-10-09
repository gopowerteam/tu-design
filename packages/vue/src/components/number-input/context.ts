import type { InjectionKey } from "vue";

/** NumberInput Root 上下文：仅用于子组件的开发期 guard 探测（Form 家族同款模式） */
export const NUMBER_INPUT_KEY: InjectionKey<true> = Symbol("tu-number-input");
