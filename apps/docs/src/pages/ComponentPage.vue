<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { codeToHtml } from "shiki";

const props = defineProps<{ name: string }>();

const componentSources = import.meta.glob("../../../../packages/vue/src/components/*/*.{vue,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const demoModules = import.meta.glob("../demos/*/*Demo.vue");

const sources = computed(() => {
  const prefix = `../../../../packages/vue/src/components/${props.name}/`;
  return Object.entries(componentSources)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, code]) => ({ file: path.slice(prefix.length), code }))
    .sort((a, b) => a.file.localeCompare(b.file));
});

const demoComponent = computed(() => {
  const pascal = props.name.charAt(0).toUpperCase() + props.name.slice(1);
  const loader = demoModules[`../demos/${props.name}/${pascal}Demo.vue`];
  return loader ? defineAsyncComponent(loader) : null;
});

const highlighted = ref<Record<string, string>>({});

watch(
  sources,
  async (list) => {
    const out: Record<string, string> = {};
    for (const { file, code } of list) {
      out[file] = await codeToHtml(code, {
        lang: file.endsWith(".vue") ? "vue" : "ts",
        theme: "github-dark",
      });
    }
    highlighted.value = out;
  },
  { immediate: true },
);
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-10 p-8">
    <h1 class="text-2xl font-semibold capitalize">{{ props.name }}</h1>

    <section class="space-y-2">
      <h2 class="text-sm font-medium text-muted-foreground">Demo</h2>
      <div class="flex min-h-24 flex-wrap items-center justify-center gap-4 rounded-xl border p-8">
        <component :is="demoComponent" v-if="demoComponent" />
        <p v-else class="text-sm text-muted-foreground">demo 未找到</p>
      </div>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-medium text-muted-foreground">安装</h2>
      <pre
        class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-100"
      ><code>npx tu-design add {{ props.name }}</code></pre>
    </section>

    <section v-for="item in sources" :key="item.file" class="space-y-2">
      <h2 class="font-mono text-sm font-medium text-muted-foreground">
        {{ props.name }}/{{ item.file }}
      </h2>
      <div class="overflow-x-auto rounded-lg text-sm" v-html="highlighted[item.file]" />
    </section>
  </div>
</template>
