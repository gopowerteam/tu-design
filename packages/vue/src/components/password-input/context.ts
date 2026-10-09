import type { InjectionKey, Ref } from "vue";

/** PasswordInput 值上下文：zag password-input 不管理 value，值链路由 T 家族自建 */
export interface PasswordInputContext {
  current: Readonly<Ref<string>>;
  setValue: (value: string) => void;
}

/** 同时用于子组件的开发期 guard 探测（Form 家族同款模式） */
export const PASSWORD_INPUT_KEY: InjectionKey<PasswordInputContext> = Symbol("tu-password-input");
