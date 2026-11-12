import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    formatShortcut,
    isSameShortcut,
    kDefaultToggleShortcut,
    loadToggleShortcut,
    matchesShortcut,
    saveToggleShortcut,
    shortcutConflict,
    shortcutFromEvent,
    type TShortcut,
} from "./toggle-shortcut";

type TModifiers = Partial<Record<"altKey" | "ctrlKey" | "metaKey" | "shiftKey", boolean>>;

const memory = new Map<string, string>();

function keyEvent(code: string, modifiers: TModifiers = {}) {
    return { code, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, ...modifiers };
}

function shortcut(code: string, modifiers: TModifiers = {}): TShortcut {
    const value = shortcutFromEvent(keyEvent(code, modifiers));
    if (value === undefined) {
        throw new Error(`${code} is not a recordable shortcut`);
    }
    return value;
}

beforeEach(() => {
    memory.clear();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
            memory.set(key, value);
        },
        removeItem: (key: string) => {
            memory.delete(key);
        },
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("toggle shortcut storage", () => {
    it("defaults to H, saves a custom key and can be disabled", () => {
        expect(loadToggleShortcut()).toEqual(kDefaultToggleShortcut);
        const altShiftJ = shortcut("KeyJ", { altKey: true, shiftKey: true });
        saveToggleShortcut(altShiftJ);
        expect(loadToggleShortcut()).toEqual(altShiftJ);
        saveToggleShortcut(null);
        expect(loadToggleShortcut()).toBeNull();
    });

    it("falls back to the default when the stored value is corrupt", () => {
        memory.set("nri-toggle-shortcut", "{broken");
        expect(loadToggleShortcut()).toEqual(kDefaultToggleShortcut);
    });
});

describe("recording and matching", () => {
    it("ignores lone modifier keys while recording", () => {
        expect(shortcutFromEvent(keyEvent("ShiftLeft", { shiftKey: true }))).toBeUndefined();
        expect(shortcutFromEvent(keyEvent("MetaRight", { metaKey: true }))).toBeUndefined();
    });

    it("matches only the exact modifier combination", () => {
        expect(matchesShortcut(keyEvent("KeyH"), kDefaultToggleShortcut)).toBe(true);
        expect(matchesShortcut(keyEvent("KeyH", { shiftKey: true }), kDefaultToggleShortcut)).toBe(false);
        expect(matchesShortcut(keyEvent("KeyH", { metaKey: true }), kDefaultToggleShortcut)).toBe(false);
        expect(isSameShortcut(shortcutFromEvent(keyEvent("KeyH")) ?? null, kDefaultToggleShortcut)).toBe(true);
        expect(isSameShortcut(null, kDefaultToggleShortcut)).toBe(false);
    });
});

describe("shortcutConflict", () => {
    it("rejects keys the panel already handles", () => {
        expect(shortcutConflict(kDefaultToggleShortcut, true)).toBeUndefined();
        expect(shortcutConflict(shortcut("ArrowDown"), true)).toBeDefined();
        expect(shortcutConflict(shortcut("Enter", { shiftKey: true }), true)).toBeDefined();
        expect(shortcutConflict(shortcut("KeyC", { metaKey: true }), true)).toBeDefined();
        expect(shortcutConflict(shortcut("KeyK", { ctrlKey: true }), false)).toBeDefined();
    });

    it("allows combinations the panel does not use on the current platform", () => {
        expect(shortcutConflict(shortcut("ArrowDown", { altKey: true, ctrlKey: true }), true)).toBeUndefined();
        expect(shortcutConflict(shortcut("KeyC", { metaKey: true }), false)).toBeUndefined();
        expect(shortcutConflict(shortcut("KeyC", { metaKey: true, shiftKey: true }), true)).toBeUndefined();
    });
});

describe("formatShortcut", () => {
    it("uses macOS symbols on Mac and words elsewhere", () => {
        expect(formatShortcut(kDefaultToggleShortcut, true)).toBe("H");
        expect(formatShortcut(shortcut("KeyJ", { altKey: true, shiftKey: true, metaKey: true, ctrlKey: true }), true)).toBe(
            "⌃⌥⇧⌘J",
        );
        expect(formatShortcut(shortcut("Digit1", { ctrlKey: true, altKey: true }), false)).toBe("Ctrl+Alt+1");
        expect(formatShortcut(shortcut("Backquote", { ctrlKey: true }), false)).toBe("Ctrl+`");
        expect(formatShortcut(shortcut("F2"), true)).toBe("F2");
    });
});
