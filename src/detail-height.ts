import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

const isFinitePositive = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

/** 限制在配置边界与当前视口可用范围内 */
export function clampDetailHeight(height: number): number {
    const viewportCap = Math.max(
        kConfig.detailMinHeight,
        Math.floor(window.innerHeight * 0.6),
    );
    const max = Math.min(kConfig.detailMaxHeight, viewportCap);
    return Math.min(
        max,
        Math.max(kConfig.detailMinHeight, Math.round(height)),
    );
}

export function loadDetailHeight(): number {
    const fallback = kConfig.detailDefaultHeight;
    try {
        const raw = getGlobalStorageItem(kConfig.detailHeightStorageKey);
        if (raw === null) {
            return clampDetailHeight(fallback);
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            isFinitePositive((parsed as { height?: unknown }).height)
        ) {
            return clampDetailHeight(
                (parsed as { height: number }).height,
            );
        }
        // 兼容直接存 number
        if (isFinitePositive(parsed)) {
            return clampDetailHeight(parsed);
        }
        return clampDetailHeight(fallback);
    } catch {
        return clampDetailHeight(fallback);
    }
}

export function saveDetailHeight(height: number): void {
    try {
        setGlobalStorageItem(
            kConfig.detailHeightStorageKey,
            JSON.stringify({ height: clampDetailHeight(height) }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}

type TDetailEdge = "top" | "bottom";

/**
 * 在详情区上下边缘挂载拖拽改高度。
 * 上边缘：上拖增高；下边缘：下拖增高。
 * 返回两个 handle，由调用方排进 flex 列（勿放进 overflow 滚动层）。
 */
export function createDetailResizeHandles(
    getHeight: () => number,
    setHeight: (height: number) => void,
): { top: HTMLDivElement; bottom: HTMLDivElement } {
    const makeHandle = (
        edge: TDetailEdge,
        className: string,
    ): HTMLDivElement => {
        const handle = document.createElement("div");
        handle.className = className;
        handle.dataset.nriDetailResize = edge;
        handle.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();

            const startY = event.clientY;
            const startHeight = getHeight();
            const pointerId = event.pointerId;
            try {
                handle.setPointerCapture(pointerId);
            } catch {
                // 部分环境不支持 capture
            }

            const onMove = (moveEvent: PointerEvent): void => {
                // top: 上移增高；bottom: 下移增高
                const deltaY =
                    edge === "top"
                        ? startY - moveEvent.clientY
                        : moveEvent.clientY - startY;
                setHeight(clampDetailHeight(startHeight + deltaY));
            };

            const onUp = (): void => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
                document.body.style.removeProperty("cursor");
                document.body.style.removeProperty("user-select");
                try {
                    handle.releasePointerCapture(pointerId);
                } catch {
                    // capture 可能已释放
                }
                saveDetailHeight(getHeight());
            };

            document.body.style.cursor = "ns-resize";
            document.body.style.userSelect = "none";
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        });
        return handle;
    };

    return {
        top: makeHandle("top", "nri-detail-resize nri-detail-resize-t"),
        bottom: makeHandle("bottom", "nri-detail-resize nri-detail-resize-b"),
    };
}