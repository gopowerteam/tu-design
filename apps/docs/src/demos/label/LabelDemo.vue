<script setup lang="ts">
import { Input, Label } from "@tu-design/vue";
</script>

<template>
  <div class="w-72 space-y-2">
    <Label for="demo-email">邮箱</Label>
    <Input id="demo-email" type="email" placeholder="name@example.com" />
  </div>
</template>
