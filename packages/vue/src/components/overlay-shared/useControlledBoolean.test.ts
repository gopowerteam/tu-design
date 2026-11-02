import { ref } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import { useControlledBoolean } from "./useControlledBoolean";

describe("useControlledBoolean", () => {
  it("非受控：内部状态接管，onChange 同步每次变更", () => {
    const onChange = vi.fn();
    const state = useControlledBoolean({ controlled: () => undefined, onChange });
    expect(state.isOpen.value).toBe(false);
    state.setOpen(true);
    expect(state.isOpen.value).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    state.setOpen(false);
    expect(state.isOpen.value).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("非受控初始值来自 defaultValue", () => {
    const state = useControlledBoolean({
      controlled: () => undefined,
      defaultValue: () => true,
    });
    expect(state.isOpen.value).toBe(true);
  });

  it("受控：始终跟随外部值，内部状态不生效", () => {
    const open = ref<boolean | undefined>(false);
    const onChange = vi.fn();
    const state = useControlledBoolean({ controlled: () => open.value, onChange });

    state.setOpen(true);
    expect(state.isOpen.value).toBe(false);
    expect(onChange).toHaveBeenCalledWith(true);

    open.value = true;
    expect(state.isOpen.value).toBe(true);
  });

  it("受控 false 与未受控 undefined 语义可区分", () => {
    const open = ref<boolean | undefined>(undefined);
    const state = useControlledBoolean({ controlled: () => open.value });
    state.setOpen(true);
    expect(state.isOpen.value).toBe(true);

    open.value = false;
    expect(state.isOpen.value).toBe(false);
  });
});
