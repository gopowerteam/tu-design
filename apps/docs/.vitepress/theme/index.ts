import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { defineComponent, h } from "vue";
import ToastProvider from "@/components/toast/ToastProvider.vue";
import DemoPreview from "./DemoPreview.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  // ToastProvider 全站挂载一次：useToast() 的渲染宿主（demo 与正文示例共用）
  Layout: defineComponent({
    name: "DocsLayout",
    setup() {
      return () => [h(DefaultTheme.Layout), h(ToastProvider)];
    },
  }),
  enhanceApp({ app }) {
    app.component("DemoPreview", DemoPreview);
  },
} satisfies Theme;
