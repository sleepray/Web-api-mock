import { kConfig } from "./config";

export function loadPanelCollapsed(): boolean {
    try {
        const raw = localStorage.getItem(kConfig.panelCollapsedStorageKey);
        if (raw !== null) {
            const parsed: unknown = JSON.parse(raw);
            if (
                typeof parsed === "object" &&
                parsed !== null &&
                typeof (parsed as { collapsed?: unknown }).collapsed ===
                    "boolean"
            ) {
                return (parsed as { collapsed: boolean }).collapsed;
            }
            if (typeof parsed === "boolean") {
                return parsed;
            }
        }
        // 兼容旧模式本地存储
        const oldRaw = localStorage.getItem(kConfig.panelModeStorageKey);
        if (oldRaw !== null) {
            const parsed: unknown = JSON.parse(oldRaw);
            if (
                typeof parsed === "object" &&
                parsed !== null &&
                typeof (parsed as { collapsed?: unknown }).collapsed ===
                    "boolean"
            ) {
                return (parsed as { collapsed: boolean }).collapsed;
            }
        }
    } catch {
        // 忽略
    }
    return kConfig.panelDefaultCollapsed;
}

export function savePanelCollapsed(collapsed: boolean): void {
    try {
        localStorage.setItem(
            kConfig.panelCollapsedStorageKey,
            JSON.stringify({ collapsed }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}