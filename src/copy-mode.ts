import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

export type TCopyMode = "redacted" | "raw";

const isCopyMode = (value: unknown): value is TCopyMode =>
    value === "redacted" || value === "raw";

export function loadCopyMode(): TCopyMode {
    try {
        const raw = getGlobalStorageItem(kConfig.copyModeStorageKey);
        if (raw === null) {
            return kConfig.copyModeDefault;
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            isCopyMode((parsed as { mode?: unknown }).mode)
        ) {
            return (parsed as { mode: TCopyMode }).mode;
        }
        if (isCopyMode(parsed)) {
            return parsed;
        }
    } catch {
        // 忽略存储或解析异常，回退到安全默认值。
    }
    return kConfig.copyModeDefault;
}

export function saveCopyMode(mode: TCopyMode): void {
    try {
        setGlobalStorageItem(
            kConfig.copyModeStorageKey,
            JSON.stringify({ mode }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}
