import { ref } from "vue";

/**
 * 行拖拽状态机（原生 HTML5 DnD）：内部状态是唯一事实源，不读 dataTransfer
 * （happy-dom 的 DragEvent 是 Event 别名、无 dataTransfer，测试直接派发普通 Event）。
 * dataTransfer 写入仅作真实浏览器兼容（Firefox 需 setData 才起拖、setDragImage 整行快照），
 * 全部 optional 守卫。
 *
 * 落位语义由组件层预览序决定（实时让位）：本状态机只负责起拖/接收/落位/清理。
 * @returns 拖拽状态（draggingKey）与事件动作（start/over/drop/end）
 */
export function useRowDrag() {
  const draggingKey = ref<string | undefined>(undefined);

  /**
   * 起拖（把手 dragstart）
   * @param key - 源行主键
   * @param event - 原生 dragstart 事件
   * @param image - 拖拽快照（离屏克隆元素 + 相对原行的抓取偏移）；提供时幽灵影为整行截图
   */
  function start(
    key: string,
    event: DragEvent,
    image?: { el: Element; offsetX: number; offsetY: number },
  ) {
    draggingKey.value = key;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", key);
      // 快照在 dragstart 内同步截取，早于 Vue 异步应用源行半透明类 → 幽灵影为不透明整行
      if (image) event.dataTransfer.setDragImage(image.el, image.offsetX, image.offsetY);
    }
  }

  /**
   * 悬停（行 dragover）：持续 preventDefault 才允许 drop——**含被拖行占位自身**
   * （实时让位后光标恰停在占位上，不 preventDefault 则真实浏览器拒绝 drop）。
   * @param key - 悬停行主键
   * @param event - 原生 dragover 事件
   * @returns 是否接收让位（同源行返回 false：允许 drop 但不移动预览序）
   */
  function over(key: string, event: DragEvent): boolean {
    if (!draggingKey.value) return false;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    return key !== draggingKey.value;
  }

  /**
   * 落位（行 drop）：仅成功落位返回结果（取消路径走 end，不返回）。
   * 实时让位后被拖行占位恰在光标下，落在自身占位是有效提交（toKey = fromKey），
   * 最终序由组件层预览序决定；无预览时同源落位由组件层 from === to 守卫为空操作。
   * @param key - 落位行主键
   * @param event - 原生 drop 事件
   * @returns 源/目标行主键；无起拖状态时 undefined
   */
  function drop(key: string, event: DragEvent): { fromKey: string; toKey: string } | undefined {
    const fromKey = draggingKey.value;
    draggingKey.value = undefined;
    if (!fromKey) return undefined;
    event.preventDefault();
    return { fromKey, toKey: key };
  }

  /** 拖拽结束（把手 dragend，含取消路径）：仅清理状态，不产生落位结果 */
  function end() {
    draggingKey.value = undefined;
  }

  return { draggingKey, start, over, drop, end };
}

/**
 * 整行拖拽快照：深克隆 tr 包进离屏临时 table（border-separate + 完整边框）。
 * border-collapse 下边框几何归属 table 而非 tr，直接截 tr 会缺上/左边框；
 * 克隆逐格复制实测宽度保证列宽一致。调用方负责在 drop/dragend 时 remove()。
 * @param tr - 源行元素
 * @returns 离屏快照 table（已挂 body，fixed 定位移出视口）
 */
export function createRowSnapshot(tr: HTMLElement): HTMLElement {
  const clone = tr.cloneNode(true) as HTMLElement;
  const srcCells = tr.querySelectorAll("td");
  const cloneCells = clone.querySelectorAll("td");
  srcCells.forEach((td, index) => {
    const cell = cloneCells[index];
    if (cell) cell.style.width = `${td.offsetWidth}px`;
  });
  const tbody = document.createElement("tbody");
  tbody.appendChild(clone);
  const table = document.createElement("table");
  table.className = "border-separate border-spacing-0 border border-border bg-background";
  table.style.position = "fixed";
  table.style.left = "-9999px";
  table.style.top = "0";
  table.style.tableLayout = "fixed";
  table.style.width = `${tr.offsetWidth}px`;
  table.appendChild(tbody);
  document.body.appendChild(table);
  return table;
}
