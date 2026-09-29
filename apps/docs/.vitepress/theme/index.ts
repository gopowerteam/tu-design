import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import DemoPreview from "./DemoPreview.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("DemoPreview", DemoPreview);
  },
} satisfies Theme;
