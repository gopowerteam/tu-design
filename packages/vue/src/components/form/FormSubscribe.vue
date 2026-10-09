<script setup lang="ts">
import { inject } from "vue";
import { FORM_KEY } from "./context";

const form = inject(FORM_KEY)!;
</script>

<template>
  <component :is="form.Subscribe">
    <template #default="state">
      <slot :can-submit="state.canSubmit" :is-submitting="state.isSubmitting" />
    </template>
  </component>
</template>
