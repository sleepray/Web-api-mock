/**
 * 滚动锚定：在列表 DOM 全量重建前后保持滚动状态。
 *
 * 两个关注点：
 * 1. 列表视口稳定：新记录插入顶部并触发 replaceChildren 重建后，scrollTop
 *    像素值不变但顶部新增行把原内容整体下推，造成视觉跳动。渲染前记录视口
 *    顶部第一条可见条目在内容坐标系中的位置，渲染后按同 id 恢复 scrollTop。
 * 2. 展开详情面板滚动保持：detail-body 随重建被整棵替换，scrollTop/scrollLeft
 *    归零；渲染前按 recordId 记录各详情容器的滚动位置，渲染后恢复。
 */

type TAnchor = {
    id: string;
    /** 条目顶部在列表内容坐标系中的位置（不受滚动影响） */
    top: number;
};

type TDetailScroll = {
    top: number;
    left: number;
};

/** 元素在列表内容坐标系中的位置：相对视口偏移 + 已滚动量 */
function contentTop(listEl: HTMLElement, el: HTMLElement): number {
    return (
        el.getBoundingClientRect().top -
        listEl.getBoundingClientRect().top +
        listEl.scrollTop
    );
}

/** 视口内第一条可见条目：自身底边越过 scrollTop 的即为视口顶部锚点 */
function findViewportAnchor(listEl: HTMLElement): TAnchor | null {
    const viewTop = listEl.scrollTop;
    for (const child of listEl.children) {
        if (!(child instanceof HTMLElement)) {
            continue;
        }
        const id = child.dataset.recordId;
        if (id === undefined) {
            continue;
        }
        const top = contentTop(listEl, child);
        if (top + child.offsetHeight > viewTop) {
            return { id, top };
        }
    }
    return null;
}

/** 所属条目的 recordId；detail-body 必然位于 .nri-item 内 */
function recordIdOf(body: HTMLElement): string | undefined {
    const item = body.closest(".nri-item");
    return item instanceof HTMLElement ? item.dataset.recordId : undefined;
}

/** 渲染前捕获所有展开详情面板的滚动位置 */
function captureDetailScrolls(
    listEl: HTMLElement,
): Map<string, TDetailScroll> {
    const scrolls = new Map<string, TDetailScroll>();
    for (const body of listEl.querySelectorAll<HTMLElement>(
        ".nri-detail-body",
    )) {
        const id = recordIdOf(body);
        if (id !== undefined) {
            scrolls.set(id, { top: body.scrollTop, left: body.scrollLeft });
        }
    }
    return scrolls;
}

/** 重建后按 recordId 恢复详情面板滚动位置；无匹配（被过滤/清空）则跳过 */
function restoreDetailScrolls(
    listEl: HTMLElement,
    scrolls: ReadonlyMap<string, TDetailScroll>,
): void {
    for (const body of listEl.querySelectorAll<HTMLElement>(
        ".nri-detail-body",
    )) {
        const saved = recordIdOf(body);
        if (saved === undefined) {
            continue;
        }
        const scroll = scrolls.get(saved);
        if (scroll !== undefined) {
            body.scrollTop = scroll.top;
            body.scrollLeft = scroll.left;
        }
    }
}

export function withStableScroll(
    listEl: HTMLElement,
    render: () => void,
): void {
    const prevScrollTop = listEl.scrollTop;
    const anchor = findViewportAnchor(listEl);
    const detailScrolls = captureDetailScrolls(listEl);
    render();
    // 详情面板滚动位置不受列表锚点影响，先恢复
    restoreDetailScrolls(listEl, detailScrolls);
    if (anchor === null) {
        listEl.scrollTop = prevScrollTop;
        return;
    }
    // 全量重建后按同 id 找回锚点；被过滤/清空时保持原滚动量
    const next = Array.from(listEl.children).find(
        (el) =>
            el instanceof HTMLElement && el.dataset.recordId === anchor.id,
    );
    if (!(next instanceof HTMLElement)) {
        listEl.scrollTop = prevScrollTop;
        return;
    }
    const shift = contentTop(listEl, next) - anchor.top;
    listEl.scrollTop = prevScrollTop + shift;
}