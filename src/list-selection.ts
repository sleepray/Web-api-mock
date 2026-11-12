/**
 * 列表多选：与 macOS 表格一致。
 * - ids：选中集合（插入顺序即选中先后）
 * - focusId：当前行，驱动详情区与方向键起点
 * - anchorId：Shift 范围选择的起点
 */
export type TListSelection = {
    ids: ReadonlySet<string>;
    focusId: string | undefined;
    anchorId: string | undefined;
};

export const kEmptySelection: TListSelection = {
    ids: new Set(),
    focusId: undefined,
    anchorId: undefined,
};

/** 普通单击 / 方向键：只选中这一行 */
export function selectOnly(id: string | undefined): TListSelection {
    if (id === undefined) {
        return kEmptySelection;
    }
    return { ids: new Set([id]), focusId: id, anchorId: id };
}

/** ⌘-单击：切换该行；取消当前行时焦点落到最近一次选中的剩余行 */
export function toggleSelection(
    selection: TListSelection,
    id: string,
): TListSelection {
    const ids = new Set(selection.ids);
    if (!ids.delete(id)) {
        ids.add(id);
        return { ids, focusId: id, anchorId: id };
    }
    const remaining = Array.from(ids);
    const focusId =
        selection.focusId === id ? remaining.at(-1) : selection.focusId;
    return { ids, focusId, anchorId: focusId };
}

/** Shift-单击 / Shift+方向键：选中锚点到 id 的连续区间，锚点不变 */
export function extendSelection(
    order: readonly string[],
    selection: TListSelection,
    id: string | undefined,
): TListSelection {
    if (id === undefined) {
        return selection;
    }
    const target = order.indexOf(id);
    if (target < 0) {
        return selection;
    }
    const anchorId = selection.anchorId ?? selection.focusId ?? id;
    const anchor = order.indexOf(anchorId);
    if (anchor < 0) {
        return selectOnly(id);
    }
    const [start, end] = anchor <= target ? [anchor, target] : [target, anchor];
    return {
        ids: new Set(order.slice(start, end + 1)),
        focusId: id,
        anchorId,
    };
}

/** ⌘A：全选；保留当前行，无当前行时取首项 */
export function selectAll(
    order: readonly string[],
    selection: TListSelection,
): TListSelection {
    if (order.length === 0) {
        return kEmptySelection;
    }
    const focusId =
        selection.focusId !== undefined && order.includes(selection.focusId)
            ? selection.focusId
            : order[0];
    return { ids: new Set(order), focusId, anchorId: focusId };
}

/** 列表变化（过滤、清空、淘汰）后剔除不可见的 id，避免复制看不到的请求 */
export function pruneSelection(
    order: readonly string[],
    selection: TListSelection,
): TListSelection {
    const visible = new Set(order);
    const ids = new Set(
        Array.from(selection.ids).filter((id) => visible.has(id)),
    );
    if (ids.size === selection.ids.size) {
        return selection;
    }
    if (ids.size === 0) {
        return kEmptySelection;
    }
    const focusId =
        selection.focusId !== undefined && ids.has(selection.focusId)
            ? selection.focusId
            : Array.from(ids).at(-1);
    const anchorId =
        selection.anchorId !== undefined && visible.has(selection.anchorId)
            ? selection.anchorId
            : focusId;
    return { ids, focusId, anchorId };
}
