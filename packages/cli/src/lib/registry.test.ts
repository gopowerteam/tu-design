import { describe, expect, it, vi } from "vite-plus/test";
import {
  fetchItem,
  resolveRegistryUrl,
  validateRegistryItem,
  type NpmChannel,
  type RegistryFetcher,
} from "./registry";
import type { ComponentsConfig } from "./config";

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

const CONFIG: ComponentsConfig = {
  framework: "vue",
  registry: "http://default.example/r/vue",
  aliases: {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
  },
  tailwind: { css: "src/assets/main.css" },
};

function fetcherOk(): RegistryFetcher {
  return { fetchJson: vi.fn().mockResolvedValue(ITEM) };
}

function fetcherFailing(): RegistryFetcher {
  return { fetchJson: vi.fn().mockRejectedValue(new Error("ENOTFOUND")) };
}

function npmWith(item: unknown): NpmChannel & { hasItem: ReturnType<typeof vi.fn> } {
  return {
    hasItem: vi.fn().mockReturnValue(true),
    readItem: vi.fn().mockReturnValue(item),
  };
}

function npmEmpty(): NpmChannel {
  return { hasItem: vi.fn().mockReturnValue(false), readItem: vi.fn() };
}

describe("resolveRegistryUrl", () => {
  it("override 优先", () => expect(resolveRegistryUrl(CONFIG, "http://o/r")).toBe("http://o/r"));
  it("无 override 用 config.registry", () =>
    expect(resolveRegistryUrl(CONFIG)).toBe("http://default.example/r/vue"));
});

describe("validateRegistryItem", () => {
  it("合法 item 原样返回", () => expect(validateRegistryItem(ITEM)).toEqual(ITEM));

  it.each([
    [{ type: "registry:ui", files: [] }, /name/],
    [{ name: "x", files: [] }, /type/],
    [{ name: "x", type: "registry:ui" }, /files/],
  ])("非法结构抛错 %j", (raw, re) => {
    expect(() => validateRegistryItem(raw)).toThrow(re);
  });
});

describe("fetchItem", () => {
  const name = "button";

  it("URL 命中时不触 npm 通道", async () => {
    const npm = npmWith(ITEM);
    const item = await fetchItem(fetcherOk(), "http://r/vue", npm, name);
    expect(item.name).toBe("button");
    expect(npm.hasItem).not.toHaveBeenCalled();
  });

  it("URL 抛错时回退 npm", async () => {
    const item = await fetchItem(fetcherFailing(), "http://r/vue", npmWith(ITEM), name);
    expect(item.name).toBe("button");
  });

  it("URL 返回非法 item 时回退 npm", async () => {
    const bad = fetcherOk();
    bad.fetchJson = vi.fn().mockResolvedValue({ name: "broken" });
    const item = await fetchItem(bad, "http://r/vue", npmWith(ITEM), name);
    expect(item.name).toBe("button");
  });

  it("双失败抛错含组件名", async () => {
    await expect(fetchItem(fetcherFailing(), "http://r/vue", npmEmpty(), name)).rejects.toThrow(
      /button/,
    );
  });
});
