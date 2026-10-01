<script setup lang="ts">
import { useId } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";

interface Props {
  /** 选中回调里回传的标识；缺省自动生成 */
  value?: string;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { value: undefined, disabled: false });

const autoValue = useId();
</script>

<template>
  <ArkMenu.Item
    :value="props.value ?? autoValue"
    :disabled="props.disabled"
    :class="
      cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        props.class,
      )
    "
  >
    <slot />
  </ArkMenu.Item>
</template>
