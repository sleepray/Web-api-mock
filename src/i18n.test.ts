import { afterEach, describe, expect, it, vi } from "vitest";

import { kConfig } from "./config";
import {
    getLanguage,
    loadLanguagePreference,
    resolveLanguage,
    saveLanguagePreference,
    setLanguage,
    tr,
} from "./i18n";

afterEach(() => {
    vi.unstubAllGlobals();
    setLanguage("en");
});

function stubGmStorage(initial: Record<string, unknown> = {}): Map<string, unknown> {
    const store = new Map<string, unknown>(Object.entries(initial));
    vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown) => (store.has(key) ? store.get(key) : fallback));
    vi.stubGlobal("GM_setValue", (key: string, value: unknown) => store.set(key, value));
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined });
    return store;
}

describe("language preference", () => {
    it("defaults to auto, and falls back to auto for unknown values", () => {
        stubGmStorage();
        expect(loadLanguagePreference()).toBe("auto");
        stubGmStorage({ [kConfig.languageStorageKey]: "fr" });
        expect(loadLanguagePreference()).toBe("auto");
    });

    it("is saved to the storage shared across sites", () => {
        const store = stubGmStorage();
        saveLanguagePreference("zh");
        expect(store.get(kConfig.languageStorageKey)).toBe("zh");
        expect(loadLanguagePreference()).toBe("zh");
    });
});

describe("resolveLanguage", () => {
    it("uses an explicit choice as is", () => {
        expect(resolveLanguage("zh", ["en-US"])).toBe("zh");
        expect(resolveLanguage("en", ["zh-CN"])).toBe("en");
    });

    it("follows the browser's first language in auto mode", () => {
        expect(resolveLanguage("auto", ["zh-CN", "en"])).toBe("zh");
        expect(resolveLanguage("auto", ["zh-TW"])).toBe("zh");
        expect(resolveLanguage("auto", ["en-US", "zh-CN"])).toBe("en");
        expect(resolveLanguage("auto", [])).toBe("en");
    });
});

describe("tr", () => {
    it("picks the text of the current language", () => {
        expect(tr("Copy", "复制")).toBe("Copy");
        setLanguage("zh");
        expect(getLanguage()).toBe("zh");
        expect(tr("Copy", "复制")).toBe("复制");
    });
});
