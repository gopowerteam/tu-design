<script setup lang="ts">
import type { PropType } from "vue";
import type {
  FormRenderDefinition,
  FormRenderFormApi,
  FormRenderItem,
  WidgetRenderReturn,
} from "./types";
import { computed, provide, ref } from "vue";
import { Button } from "@/components/button";
import { FORM_KEY } from "@/components/form/context";
import FormRenderField from "./FormRenderField.vue";
import { widgetRenders } from "./widgets";

// boolean flags 用运行时声明 + default: undefined 禁用 Vue 的 Boolean casting
// （casting 会让未传的 prop 变 false，"缺省跟随 searchable" 语义失效；Checkbox/Dialog 同款约定）
const props = defineProps({
  /** 聚合式（推荐）：defineForm 返回的定义对象 */
  definition: { type: Object as PropType<FormRenderDefinition<any>> },
  /** 拆分式：与 <Form :form> 模式兼容（与 definition 二选一，definition 优先） */
  form: { type: Object as PropType<FormRenderFormApi> },
  items: { type: Array as PropType<FormRenderItem<any>[]> },
  searchable: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  submitable: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 缺省跟随 searchable */
  resetable: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 缺省跟随 submitable */
  cancelable: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  searchText: { type: String },
  submitText: { type: String },
  resetText: { type: String },
  /** 栅格最小列宽 px（auto-fill 自适应列数） */
  minWidth: { type: Number },
});

const emit = defineEmits<{
  search: [];
  submit: [];
  reset: [];
  cancel: [];
}>();

const instance = props.definition?.form ?? props.form;
const items = computed(() => props.definition?.items ?? props.items ?? []);

if (import.meta.env.DEV && !instance) {
  console.warn(
    "[tu-design] <FormRender> 需要 definition 或 form + items（definition/form 不支持运行时切换）",
  );
}

// S2：FormField 依赖 inject(FORM_KEY)，本组件替代 <Form> 的 provide 职责
provide(FORM_KEY, instance as never);

// S1：form.state 非响应式，响应式 values 只能经 useSelector 订阅建立；
// visible 过滤与 WidgetContext.values 一律消费它，渲染路径禁读 form.state.*
const valuesRef = instance
  ? instance.useSelector((s: any) => s.values)
  : ref<Record<string, unknown>>({});

const r = widgetRenders<any>();

function widgetOf(item: FormRenderItem<any>): WidgetRenderReturn<any> {
  return item.render ? item.render(r) : r.input();
}

const visibleItems = computed(() =>
  items.value.filter((item) =>
    typeof item.visible === "function"
      ? item.visible(valuesRef.value as never)
      : item.visible !== false,
  ),
);

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, minmax(${props.minWidth ?? 320}px, 1fr))`,
}));

function spanStyle(span?: number | "full") {
  if (span === "full") return { gridColumn: "1 / -1" };
  if (typeof span === "number") return { gridColumn: `span ${span}` };
  return undefined;
}

const showReset = computed(() => props.resetable ?? !!props.searchable);
const showCancel = computed(() => props.cancelable ?? !!props.submitable);
const showActions = computed(
  () => props.searchable || props.submitable || showReset.value || showCancel.value,
);

/** I4：校验失败时 isFieldsValid=false，不 emit；成功后才 emit（事件回调中一次性读取不受 S1 限制） */
async function submit(mode: "search" | "submit") {
  if (!instance) return;
  await instance.handleSubmit();
  if (instance.state.isFieldsValid) {
    if (mode === "search") emit("search");
    else emit("submit");
  }
}

function onReset() {
  if (props.definition) {
    props.definition.resetToDefaults();
  } else {
    instance?.reset();
  }
  emit("reset");
}

defineExpose({
  form: instance,
  items,
  resetToDefaults: () =>
    props.definition ? props.definition.resetToDefaults() : instance?.reset(),
});
</script>

<template>
  <div class="grid gap-4" :style="gridStyle">
    <div v-for="item in visibleItems" :key="String(item.key)" :style="spanStyle(item.span)">
      <FormRenderField :item="item" :widget="widgetOf(item)" :values="valuesRef" />
    </div>
    <div v-if="showActions" class="col-span-full flex justify-end gap-2">
      <slot name="actions">
        <Button v-if="searchable" @click="submit('search')">
          {{ searchText ?? "搜索" }}
        </Button>
        <Button v-if="showReset" variant="outline" @click="onReset">
          {{ resetText ?? "重置" }}
        </Button>
        <Button v-if="submitable" @click="submit('submit')">
          {{ submitText ?? "提交" }}
        </Button>
        <Button v-if="showCancel" variant="outline" @click="emit('cancel')"> 取消 </Button>
      </slot>
    </div>
  </div>
</template>
