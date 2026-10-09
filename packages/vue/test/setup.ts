// happy-dom 的 Event.timeStamp 是 performance.now() 相对值，
// 而 Vue 事件 invoker 的过时事件守卫用 Date.now() 绝对值比较
// （timestamp >= invoker.attached - 1），手动 dispatchEvent 派发的
// 事件会被整体丢弃。包装各事件构造器，在实例上以 Date.now() 覆盖
// timeStamp（happy-dom 将 timeStamp 写为实例属性，prototype getter
// 会被遮蔽，因此必须逐实例覆盖）。
// 注意：Event 子类（PointerEvent/MouseEvent/KeyboardEvent/CustomEvent）
// 各自有独立构造器，必须逐类包装——仅包装 Event 不会影响子类实例。

type EventCtor = abstract new (type: string | Event, init?: EventInit) => Event;

function patchEventCtor(Original: EventCtor): EventCtor {
  return class PatchedEvent extends (Original as abstract new (
    type: string | Event,
    init?: EventInit,
  ) => Event) {
    constructor(type: string | Event, init?: EventInit) {
      super(type as string, init);
      Object.defineProperty(this, "timeStamp", {
        value: Date.now(),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  } as EventCtor;
}

for (const name of [
  "Event",
  "PointerEvent",
  "MouseEvent",
  "KeyboardEvent",
  "CustomEvent",
] as const) {
  const globals = globalThis as unknown as Record<string, EventCtor>;
  const Original = globals[name];
  if (Original) {
    globals[name] = patchEventCtor(Original);
  }
}
