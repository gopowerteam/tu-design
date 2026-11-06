<script lang="ts">
import type { AnyFieldApi } from "@tanstack/vue-form";
import type { PropType, SlotsType, VNodeChild } from "vue";
import { defineComponent, h, inject, provide, shallowRef } from "vue";
import { FIELD_KEY, FORM_KEY } from "./context";

interface FormFieldProps {
  /** 字段名（TanStack 深层 key 的运行时形态） */
  name: string;
  /** 校验器配置，原样透传（值可为函数或 Standard Schema，如 valibot） */
  validators?: Record<string, unknown>;
  /** 字段模式：value 单值（默认）；array 数组字段，解锁 pushValue/removeValue 等行操作 */
  mode?: "value" | "array";
}

/*
 * 渲染 TanStack `form.Field` 并经 provide 下发 field 上下文。
 * field 实例只能在 form.Field 的插槽执行期取得（时序早于子组件 setup），
 * 故用 setup 函数 + render function 在插槽回调中写入 ShallowRef。
 *
 * 用 defineComponent 函数式重载显式声明 slots 类型（Options API 无法声明）：
 * 降级路径（FormField 不在 Form 内）field 为 undefined，类型必须诚实，
 * 否则消费者 #default="{ field }" 拿到 any（内部子组件已容忍 undefined）。
 */
export default defineComponent<
  FormFieldProps,
  {},
  string,
  SlotsType<{ default?: (props: { field: AnyFieldApi | undefined }) => VNodeChild }>
>(
  /**
   * @param props - 组件 props（name/validators/mode）
   * @param ctx - setup 上下文（slots/attrs/emit）
   * @returns 渲染函数：Form 内渲染 TanStack form.Field 并捕获 field 实例；缺席时降级直渲插槽
   */
  (props, ctx) => {
    const { slots } = ctx;
    const form = inject(FORM_KEY);
    if (!form && import.meta.env.DEV) {
      console.warn("[tu-design] <FormField> 必须在 <Form> 内使用");
    }

    const fieldRef = shallowRef<AnyFieldApi>();
    provide(FIELD_KEY, { field: fieldRef, name: props.name });

    if (!form) {
      // 优雅降级：field 上下文缺席（FIELD_KEY.field 为 undefined），子组件需自行容忍
      return () => slots.default?.({ field: undefined });
    }

    return () =>
      h(
        form.Field as never,
        { name: props.name, validators: props.validators, mode: props.mode } as never,
        {
          default: (slotProps: { field: AnyFieldApi }) => {
            fieldRef.value = slotProps.field;
            return slots.default?.(slotProps);
          },
        },
      );
  },
  {
    name: "TuFormField",
    props: {
      name: { type: String, required: true },
      validators: {
        type: Object as PropType<Record<string, unknown>>,
        default: undefined,
      },
      mode: { type: String as PropType<"value" | "array">, default: "value" },
    },
  },
);
</script>
