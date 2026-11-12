import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

export type TPanelSize = {
    width: number;
    height: number;
};

const isFinitePositive = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

/** 限制在配置最小尺寸与当前视口可用范围内 */
export function clampPanelSize(size: TPanelSize): TPanelSize {
    const maxWidth = Math.max(
        kConfig.panelMinWidth,
        window.innerWidth - 32,
    );
    const maxHeight = Math.max(
        kConfig.panelMinHeight,
        window.innerHeight - 80,
    );
    return {
        width: Math.min(
            maxWidth,
            Math.max(kConfig.panelMinWidth, Math.round(size.width)),
        ),
        height: Math.min(
            maxHeight,
            Math.max(kConfig.panelMinHeight, Math.round(size.height)),
        ),
    };
}

export function loadPanelSize(): TPanelSize {
    const fallback: TPanelSize = {
        width: kConfig.panelDefaultWidth,
        height: kConfig.panelDefaultHeight,
    };
    try {
        const raw = getGlobalStorageItem(kConfig.panelSizeStorageKey);
        if (raw === null) {
            return clampPanelSize(fallback);
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !isFinitePositive((parsed as TPanelSize).width) ||
            !isFinitePositive((parsed as TPanelSize).height)
        ) {
            return clampPanelSize(fallback);
        }
        return clampPanelSize({
            width: (parsed as TPanelSize).width,
            height: (parsed as TPanelSize).height,
        });
    } catch {
        return clampPanelSize(fallback);
    }
}

export function savePanelSize(size: TPanelSize): void {
    try {
        setGlobalStorageItem(
            kConfig.panelSizeStorageKey,
            JSON.stringify(clampPanelSize(size)),
        );
    } catch {
        // 隐私模式 / 配额满：忽略，不影响交互
    }
}

type TResizeEdge = "left" | "top" | "top-left";

type TResizeSession = {
    edge: TResizeEdge;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
};

/**
 * 在面板左侧 / 顶部 / 左上角挂载拖拽改尺寸。
 * 面板锚定 right+bottom，因此左拖增宽、上拖增高。
 */
export function bindPanelResize(
    panel: HTMLElement,
    getSize: () => TPanelSize,
    setSize: (size: TPanelSize) => void,
): void {
    const makeHandle = (edge: TResizeEdge, className: string): HTMLDivElement => {
        const handle = document.createElement("div");
        handle.className = className;
        handle.dataset.nriResize = edge;
        handle.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();

            const current = getSize();
            const session: TResizeSession = {
                edge,
                startX: event.clientX,
                startY: event.clientY,
                startWidth: current.width,
                startHeight: current.height,
            };

            const onMove = (moveEvent: PointerEvent): void => {
                // 向左拖 → clientX 减小 → 宽度增加；向上拖同理
                const deltaX = session.startX - moveEvent.clientX;
                const deltaY = session.startY - moveEvent.clientY;
                const next: TPanelSize = {
                    width:
                        edge === "top"
                            ? session.startWidth
                            : session.startWidth + deltaX,
                    height:
                        edge === "left"
                            ? session.startHeight
                            : session.startHeight + deltaY,
                };
                setSize(clampPanelSize(next));
            };

            const onUp = (): void => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
                document.body.style.removeProperty("cursor");
                document.body.style.removeProperty("user-select");
                savePanelSize(getSize());
            };

            document.body.style.cursor =
                edge === "left"
                    ? "ew-resize"
                    : edge === "top"
                      ? "ns-resize"
                      : "nwse-resize";
            document.body.style.userSelect = "none";
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        });
        return handle;
    };

    panel.append(
        makeHandle("left", "nri-resize nri-resize-l"),
        makeHandle("top", "nri-resize nri-resize-t"),
        makeHandle("top-left", "nri-resize nri-resize-tl"),
    );
}