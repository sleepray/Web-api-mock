import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

/** 用户选择的主题偏好（system = 跟随浏览器 prefers-color-scheme） */
export type TThemePreference = "dark" | "light" | "system";

/** 实际渲染用的解析主题 */
export type TResolvedTheme = "dark" | "light";

const isThemePreference = (value: unknown): value is TThemePreference =>
    value === "dark" || value === "light" || value === "system";

export function loadThemePreference(): TThemePreference {
    try {
        const raw = getGlobalStorageItem(kConfig.panelThemeStorageKey);
        if (raw === null) {
            return kConfig.panelDefaultTheme;
        }
        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            isThemePreference((parsed as { theme?: unknown }).theme)
        ) {
            return (parsed as { theme: TThemePreference }).theme;
        }
        if (isThemePreference(parsed)) {
            return parsed;
        }
        return kConfig.panelDefaultTheme;
    } catch {
        return kConfig.panelDefaultTheme;
    }
}

export function saveThemePreference(theme: TThemePreference): void {
    try {
        setGlobalStorageItem(
            kConfig.panelThemeStorageKey,
            JSON.stringify({ theme }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}

export function resolveTheme(preference: TThemePreference): TResolvedTheme {
    if (preference === "dark" || preference === "light") {
        return preference;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

/** 界面风格（配色方案），与明暗主题相互独立 */
export type TPalette = "vscode" | "macos";

const isPalette = (value: unknown): value is TPalette =>
    value === "vscode" || value === "macos";

export function loadPalette(): TPalette {
    try {
        const raw = getGlobalStorageItem(kConfig.panelPaletteStorageKey);
        if (raw === null) {
            return kConfig.panelDefaultPalette;
        }
        const parsed: unknown = JSON.parse(raw);
        const palette =
            typeof parsed === "object" && parsed !== null
                ? (parsed as { palette?: unknown }).palette
                : parsed;
        return isPalette(palette) ? palette : kConfig.panelDefaultPalette;
    } catch {
        return kConfig.panelDefaultPalette;
    }
}

export function savePalette(palette: TPalette): void {
    try {
        setGlobalStorageItem(
            kConfig.panelPaletteStorageKey,
            JSON.stringify({ palette }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}
