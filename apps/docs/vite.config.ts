import { cpSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

const registryDir = fileURLToPath(new URL("../../packages/vue/registry/vue", import.meta.url));

/** dev 期以中间件伺服 /r/vue/*.json；build 期将 registry 复制进 dist/r/vue。 */
function registryPlugin(): Plugin {
  return {
    name: "tu-design-registry",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0]!;
        if (!url.startsWith("/r/vue/")) {
          next();
          return;
        }
        const name = decodeURIComponent(url.slice("/r/vue/".length));
        if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        const file = join(registryDir, name);
        if (!file.startsWith(`${registryDir}/`) || !existsSync(file)) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      if (this.meta.watchMode) {
        return;
      }
      cpSync(registryDir, resolve(dirname(fileURLToPath(import.meta.url)), "dist/r/vue"), {
        recursive: true,
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), registryPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../packages/vue/src", import.meta.url)),
      "@tu-design/vue": fileURLToPath(new URL("../../packages/vue/src/index.ts", import.meta.url)),
    },
  },
});
