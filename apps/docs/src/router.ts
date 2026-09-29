import { createRouter, createWebHistory } from "vue-router";
import ComponentPage from "./pages/ComponentPage.vue";

export const COMPONENTS = [
  "avatar",
  "badge",
  "button",
  "card",
  "input",
  "label",
  "separator",
  "skeleton",
] as const;

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/button" },
    { path: "/:name", component: ComponentPage, props: true },
  ],
});
