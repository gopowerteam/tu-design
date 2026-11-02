import { describe, expect, it, vi } from "vite-plus/test";
import { fetchRegistryIndex, getComponent, searchComponents } from "./mcp-core";
import type { RegistryFetcher } from "./registry";

const REG = "http://r/vue";

const INDEX = {
  items: [
    { name: "button", type: "registry:ui", title: "Button", description: "按钮组件" },
    { name: "data-table", type: "registry:ui", title: "Data Table", description: "数据表格" },
    { name: "utils", type: "registry:lib", title: "Utils", description: "cn 工具" },
  ],
};

const ITEM = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "button",
  type: "registry:ui",
  files: [
    {
      path: "button/Button.vue",
      type: "registry:component",
      target: "components/ui/button/Button.vue",
      content: "<template><button /></template>",
    },
  ],
};

/** 按 URL 路由的 fake fetcher：未命中路由视为 HTTP 404（与线上行为一致）。 */
function fetcherFor(routes: Record<string, unknown>): RegistryFetcher & {
  fetchJson: ReturnType<typeof vi.fn>;
} {
  return {
    fetchJson: vi.fn(async (url: string) => {
      if (url in routes) {
        return routes[url];
      }
      throw new Error(`HTTP 404: ${url}`);
    }),
  };
}

describe("fetchRegistryIndex", () => {
  it("过滤掉非 registry:ui 项，只留 name/title/description", async () => {
    const f = fetcherFor({ [`${REG}/registry.json`]: INDEX });
    const list = await fetchRegistryIndex(f, REG);
    expect(list).toEqual([
      { name: "button", title: "Button", description: "按钮组件" },
      { name: "data-table", title: "Data Table", description: "数据表格" },
    ]);
    expect(f.fetchJson).toHaveBeenCalledWith("http://r/vue/registry.json");
  });

  it("URL 尾斜杠被去掉", async () => {
    const f = fetcherFor({ "http://r/vue/registry.json": INDEX });
    await fetchRegistryIndex(f, `${REG}/`);
    expect(f.fetchJson).toHaveBeenCalledWith("http://r/vue/registry.json");
  });

  it.each([
    ["不是对象", "nope", /不是 JSON 对象/],
    ["缺 items 数组", { foo: [] }, /缺少 items 数组/],
    ["item 无 name 字符串", { items: [{ type: "registry:ui" }] }, /items\[0\].*name/],
  ])("非法 index（%s）抛错含 URL", async (_label, raw, re) => {
    const f = fetcherFor({ [`${REG}/registry.json`]: raw });
    await expect(fetchRegistryIndex(f, REG)).rejects.toThrow(re);
  });
});

describe("searchComponents", () => {
  const f = fetcherFor({ [`${REG}/registry.json`]: INDEX });

  it("按 name 命中且大小写不敏感", async () => {
    await expect(searchComponents(f, REG, "TABLE")).resolves.toEqual([
      { name: "data-table", title: "Data Table", description: "数据表格" },
    ]);
  });

  it("按 description 命中", async () => {
    await expect(searchComponents(f, REG, "按钮")).resolves.toEqual([
      { name: "button", title: "Button", description: "按钮组件" },
    ]);
  });

  it("未命中返回空数组", async () => {
    await expect(searchComponents(f, REG, "no-such-thing")).resolves.toEqual([]);
  });
});

describe("getComponent", () => {
  it("成功返回 item（含 files[].content 与 installHint），只打 URL 通道", async () => {
    const f = fetcherFor({ [`${REG}/button.json`]: ITEM });
    const item = await getComponent(f, REG, "button");
    expect(item.name).toBe("button");
    expect(item.files[0]!.content).toBe("<template><button /></template>");
    expect(item.installHint).toBe("npx @tu-design/cli add button");
    expect(f.fetchJson).toHaveBeenCalledTimes(1);
    expect(f.fetchJson).toHaveBeenCalledWith("http://r/vue/button.json");
  });

  it.each(["Button", "a/b", "../etc/passwd", "button x", ""])(
    "非法组件名 %j 被拒且不发起请求",
    async (name) => {
      const f = fetcherFor({});
      await expect(getComponent(f, REG, name)).rejects.toThrow(/非法组件名/);
      expect(f.fetchJson).not.toHaveBeenCalled();
    },
  );

  it("fetch 失败抛错含组件名、URL 与真实原因", async () => {
    const f = fetcherFor({});
    await expect(getComponent(f, REG, "button")).rejects.toThrow(
      /button.*http:\/\/r\/vue\/button\.json.*HTTP 404/,
    );
  });

  it("item 校验失败抛错含 URL", async () => {
    const f = fetcherFor({ [`${REG}/button.json`]: { name: "button" } });
    await expect(getComponent(f, REG, "button")).rejects.toThrow(/校验失败.*button\.json/);
  });
});
