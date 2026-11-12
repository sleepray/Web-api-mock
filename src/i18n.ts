import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

/**
 * 界面语言。文案直接写成「英文 / 中文」一对（见 `tr`），不维护 key 表：
 * 改文案时两种语言就在同一行，不会漏改另一边。
 *
 * 只管界面文案；复制出去的 Markdown、cURL 一类是给别人看的数据，保持英文。
 */

export type TLanguage = "en" | "zh";
/** auto 跟随浏览器语言 */
export type TLanguagePreference = "auto" | TLanguage;

const kPreferences: readonly TLanguagePreference[] = ["auto", "en", "zh"];

let current: TLanguage = "en";

/** 读不出来或值不认识时回到 auto */
export function loadLanguagePreference(): TLanguagePreference {
    try {
        const raw = getGlobalStorageItem(kConfig.languageStorageKey);
        return kPreferences.includes(raw as TLanguagePreference) ? (raw as TLanguagePreference) : "auto";
    } catch {
        return "auto";
    }
}

export function saveLanguagePreference(preference: TLanguagePreference): void {
    try {
        setGlobalStorageItem(kConfig.languageStorageKey, preference);
    } catch {
        // 隐私模式 / 配额满：这次仍按选的语言显示
    }
}

/** auto 时浏览器首选语言是中文就用中文，其它一律英文 */
export function resolveLanguage(
    preference: TLanguagePreference,
    browserLanguages: readonly string[] = typeof navigator === "undefined"
        ? []
        : navigator.languages ?? [navigator.language],
): TLanguage {
    if (preference !== "auto") {
        return preference;
    }
    const first = browserLanguages.at(0) ?? "";
    return first.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function setLanguage(language: TLanguage): void {
    current = language;
}

export function getLanguage(): TLanguage {
    return current;
}

/** 按当前语言取一句文案。界面是在创建时取文案的，所以切换语言要重建面板 */
export function tr(en: string, zh: string): string {
    return current === "zh" ? zh : en;
}
