// 本地假 registry：静态伺服 mock-registry 目录下的 *.json（模拟 GitHub Pages 上的线上 registry）。
// 用法：node serve-registry.mjs <mock-registry 目录> <端口>
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const port = Number(process.argv[3]);

if (!dir || !port) {
  console.error("用法：node serve-registry.mjs <mock-registry 目录> <端口>");
  process.exit(1);
}

createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname.replace(/^\/+/, "");
  if (!pathname || pathname.includes("..")) {
    res.writeHead(400);
    res.end("bad request");
    return;
  }
  const file = join(dir, pathname);
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`not found: ${pathname}`);
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(readFileSync(file));
}).listen(port, "127.0.0.1", () => {
  console.log(`mock registry: http://127.0.0.1:${port}/ （伺服 ${dir}）`);
});
