<script setup lang="ts">
import { Select as ArkSelect } from "@ark-ui/vue/select";

interface Props {
  placeholder?: string;
}

const props = defineProps<Props>();
</script>

<!-- 注意：不能向 ValueText 传插槽内容，其内部会对默认插槽做字符串化渲染 -->
<template>
  <ArkSelect.ValueText :placeholder="props.placeholder" />
</template>
