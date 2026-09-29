import { defineConfig } from "vite-plus";
import vue from "unplugin-vue/rolldown";

export default defineConfig({
  pack: {
    plugins: [vue({ isProduction: true })],
    dts: { vue: true },
    exports: true,
  },
});
