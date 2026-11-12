import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { kConfig } from "./config";
import { loadCopyMode, saveCopyMode } from "./copy-mode";
import { loadDetailHeight, saveDetailHeight } from "./detail-height";
import { loadPanelCollapsed, savePanelCollapsed } from "./panel-mode";
import { loadPanelBottom, savePanelBottom } from "./panel-offset";
import { loadPanelSize, savePanelSize } from "./panel-size";
import {
    loadPalette,
    loadThemePreference,
    savePalette,
    saveThemePreference,
} from "./panel-theme";
import {
    getGlobalStorageItem,
    setGlobalStorageItem,
    type TNriStorageBridge,
} from "./storage";

const localStore = new Map<string, string>();

/** Simulates Tampermonkey's GM storage, which is shared across sites. */
function installGmStorage(): Map<string, unknown> {
    const gmStore = new Map<string, unknown>();
    vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown) =>
        gmStore.has(key) ? gmStore.get(key) : defaultValue,
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown) => gmStore.set(key, value));
    return gmStore;
}

/** Simulates the dev-proxy bridge used when the main script runs without GM APIs. */
function installBridge(): Map<string, unknown> {
    const bridgeStore = new Map<string, unknown>();
    const bridge: TNriStorageBridge = {
        get: (key, defaultValue) => (bridgeStore.has(key) ? bridgeStore.get(key) : defaultValue),
        set: (key, value) => bridgeStore.set(key, value),
    };
    vi.stubGlobal("__NRI_STORAGE_BRIDGE__", bridge);
    return bridgeStore;
}

beforeEach(() => {
    localStore.clear();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => localStore.get(key) ?? null,
        setItem: (key: string, value: string) => localStore.set(key, String(value)),
        removeItem: (key: string) => localStore.delete(key),
        clear: () => localStore.clear(),
    });
    vi.stubGlobal("window", {
        innerWidth: 1920,
        innerHeight: 1080,
        matchMedia: () => ({ matches: false }),
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("global storage backends", () => {
    it("falls back to localStorage when no global storage exists", () => {
        localStore.set(kConfig.panelThemeStorageKey, JSON.stringify({ theme: "light" }));
        expect(loadThemePreference()).toBe("light");
    });

    it("prefers GM storage so preferences follow the user across sites", () => {
        const gmStore = installGmStorage();
        saveThemePreference("system");
        expect(gmStore.get(kConfig.panelThemeStorageKey)).toBe(JSON.stringify({ theme: "system" }));
        expect(loadThemePreference()).toBe("system");
        saveThemePreference("dark");
        expect(loadThemePreference()).toBe("dark");
    });

    it("uses the dev-proxy bridge when GM_getValue is absent", () => {
        const bridgeStore = installBridge();
        setGlobalStorageItem("test-key", "test-val");
        expect(bridgeStore.get("test-key")).toBe("test-val");
        expect(getGlobalStorageItem("test-key")).toBe("test-val");
    });
});

describe("panel preferences", () => {
    it("keeps the open/hidden state per site, outside GM storage", () => {
        const gmStore = installGmStorage();
        savePanelCollapsed(false);
        expect(loadPanelCollapsed()).toBe(false);
        expect(gmStore.has(kConfig.panelCollapsedStorageKey)).toBe(false);
    });

    it("shares panel size, vertical offset and detail height globally", () => {
        const gmStore = installGmStorage();
        savePanelSize({ width: 500, height: 600 });
        expect(loadPanelSize()).toEqual({ width: 500, height: 600 });
        expect(gmStore.has(kConfig.panelSizeStorageKey)).toBe(true);

        savePanelBottom(80, 36);
        expect(loadPanelBottom(36)).toBe(80);
        expect(gmStore.has(kConfig.panelOffsetStorageKey)).toBe(true);

        saveDetailHeight(300);
        expect(loadDetailHeight()).toBe(300);
        expect(gmStore.has(kConfig.detailHeightStorageKey)).toBe(true);
    });

    it("defaults copy mode to redacted so nothing leaks before the user opts in", () => {
        const bridgeStore = installBridge();
        expect(loadCopyMode()).toBe("redacted");
        saveCopyMode("raw");
        expect(loadCopyMode()).toBe("raw");
        expect(bridgeStore.has(kConfig.copyModeStorageKey)).toBe(true);
    });

    it("stores the palette globally and falls back on unknown values", () => {
        const bridgeStore = installBridge();
        expect(loadPalette()).toBe("vscode");
        savePalette("macos");
        expect(loadPalette()).toBe("macos");
        expect(bridgeStore.get(kConfig.panelPaletteStorageKey)).toBe(JSON.stringify({ palette: "macos" }));

        bridgeStore.set(kConfig.panelPaletteStorageKey, JSON.stringify({ palette: "neon" }));
        expect(loadPalette()).toBe("vscode");
    });
});
