import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

/**
 * 角标相对视口底边的距离（px）。
 * 锚在 toggle 底边：夹紧用 toggle 高度，不用 root（避免 dock 样式变化影响）。
 */
export function clampPanelBottom(bottom: number, toggleHeight: number): number {
    const min = kConfig.panelMinBottom;
    const max = Math.max(
        min,
        window.innerHeight - Math.max(1, toggleHeight) - kConfig.panelMinBottom,
    );
    return Math.min(max, Math.max(min, Math.round(bottom)));
}

export function loadPanelBottom(toggleHeight: number): number {
    const fallback = kConfig.panelDefaultBottom;
    try {
        const raw = getGlobalStorageItem(kConfig.panelOffsetStorageKey);
        if (raw === null) {
            return clampPanelBottom(fallback, toggleHeight);
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !isFiniteNumber((parsed as { bottom?: unknown }).bottom)
        ) {
            // 兼容早期直接存 number
            if (isFiniteNumber(parsed)) {
                return clampPanelBottom(parsed, toggleHeight);
            }
            return clampPanelBottom(fallback, toggleHeight);
        }
        return clampPanelBottom(
            (parsed as { bottom: number }).bottom,
            toggleHeight,
        );
    } catch {
        return clampPanelBottom(fallback, toggleHeight);
    }
}

export function savePanelBottom(bottom: number, toggleHeight: number): void {
    try {
        setGlobalStorageItem(
            kConfig.panelOffsetStorageKey,
            JSON.stringify({
                bottom: clampPanelBottom(bottom, toggleHeight),
            }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}

/**
 * 垂直拖动角标（仅 Y 轴）。
 * 超过阈值后抑制后续 click，避免拖完误触折叠/展开。
 */
export function bindToggleVerticalDrag(
    toggle: HTMLElement,
    measureToggleHeight: () => number,
    getBottom: () => number,
    setBottom: (bottom: number) => void,
): void {
    const kDragThresholdPx = 4;
    let suppressClick = false;

    toggle.addEventListener(
        "click",
        (event) => {
            if (!suppressClick) {
                return;
            }
            suppressClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
        true,
    );

    toggle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
            return;
        }

        const startY = event.clientY;
        const startBottom = getBottom();
        let dragging = false;

        const onMove = (moveEvent: PointerEvent): void => {
            const deltaY = startY - moveEvent.clientY;
            if (!dragging) {
                if (Math.abs(deltaY) < kDragThresholdPx) {
                    return;
                }
                dragging = true;
                suppressClick = true;
                toggle.setPointerCapture(moveEvent.pointerId);
                document.body.style.userSelect = "none";
                document.body.style.cursor = "ns-resize";
            }
            setBottom(
                clampPanelBottom(
                    startBottom + deltaY,
                    measureToggleHeight(),
                ),
            );
        };

        const onUp = (upEvent: PointerEvent): void => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            document.body.style.removeProperty("user-select");
            document.body.style.removeProperty("cursor");
            if (dragging) {
                try {
                    toggle.releasePointerCapture(upEvent.pointerId);
                } catch {
                    // capture 可能已释放
                }
                savePanelBottom(getBottom(), measureToggleHeight());
                // 若浏览器未派发 click，避免永久吞掉下一次点击
                window.setTimeout(() => {
                    suppressClick = false;
                }, 0);
            }
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    });
}