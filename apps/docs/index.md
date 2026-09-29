---
layout: home

hero:
  name: "tu-design"
  text: "Vue 组件注册表"
  tagline: 基于 shadcn 思路的 Vue 组件库：源码直接拷贝进你的项目，Tailwind 4 + CSS 变量主题，npx 一键添加。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/installation
    - theme: alt
      text: 组件列表
      link: /components/button
    - theme: alt
      text: 什么是 tu-design
      link: /guide/introduction

features:
  - icon: 📦
    title: 源码归你所有
    details: 组件代码通过 CLI 拷贝到 components/ui/ 目录，没有黑盒依赖，随意修改。
  - icon: 🎨
    title: Tailwind 4 + 主题变量
    details: 组件使用 shadcn 风格 CSS 变量（oklch），明暗模式随 .dark class 自动切换。
  - icon: 🧩
    title: shadcn registry 规范
    details: registry JSON 遵循 ui.shadcn.com schema，组件依赖（utils/tokens）自动随装。
  - icon: ⚡
    title: Vue 3 + Ark UI
    details: 组合式 API 优先；交互类组件基于 Ark UI 的无头实现，可访问性开箱即用。
---
