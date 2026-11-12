import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";

/** 全局快捷键：按物理键位（KeyboardEvent.code）匹配，不受 ⌥ 产生的特殊字符和输入法影响 */
export type TShortcut = {
    code: string;
    alt: boolean;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
};

type TKeyLike = Pick<
    KeyboardEvent,
    "code" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey"
>;

export const kDefaultToggleShortcut: TShortcut = {
    code: "KeyH",
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
};

const kModifierCodes = new Set([
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "MetaLeft",
    "MetaRight",
    "OSLeft",
    "OSRight",
    "CapsLock",
    "Fn",
]);

/** 面板自身占用的无修饰键（单按或仅加 Shift） */
const kPanelNavigationCodes = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "Enter",
    "NumpadEnter",
    "Tab",
    "Escape",
]);

/** 面板自身占用的 ⌘（macOS）/ Ctrl 组合，以及系统级编辑键 */
const kPanelCommandCodes = new Set([
    "KeyA",
    "KeyC",
    "KeyF",
    "KeyK",
    "KeyV",
    "KeyX",
    "KeyZ",
]);

const kCodeLabels: Record<string, string> = {
    Space: "Space",
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    PageUp: "PgUp",
    PageDown: "PgDn",
    Insert: "Ins",
};

const isShortcut = (value: unknown): value is TShortcut => {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return (
        typeof v.code === "string" &&
        v.code !== "" &&
        typeof v.alt === "boolean" &&
        typeof v.ctrl === "boolean" &&
        typeof v.meta === "boolean" &&
        typeof v.shift === "boolean"
    );
};

/** 读取用户设置；null 表示已禁用，异常或缺省回退默认 H */
export function loadToggleShortcut(): TShortcut | null {
    try {
        const raw = getGlobalStorageItem(kConfig.toggleShortcutStorageKey);
        if (raw === null) {
            return kDefaultToggleShortcut;
        }
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null && "shortcut" in parsed) {
            const shortcut = (parsed as { shortcut: unknown }).shortcut;
            if (shortcut === null) {
                return null;
            }
            if (isShortcut(shortcut)) {
                return shortcut;
            }
        }
    } catch {
        // 忽略存储或解析异常，回退到默认值。
    }
    return kDefaultToggleShortcut;
}

export function saveToggleShortcut(shortcut: TShortcut | null): void {
    try {
        setGlobalStorageItem(
            kConfig.toggleShortcutStorageKey,
            JSON.stringify({ shortcut }),
        );
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}

export function isSameShortcut(
    a: TShortcut | null,
    b: TShortcut | null,
): boolean {
    if (a === null || b === null) {
        return a === b;
    }
    return (
        a.code === b.code &&
        a.alt === b.alt &&
        a.ctrl === b.ctrl &&
        a.meta === b.meta &&
        a.shift === b.shift
    );
}

/** 录制：单按修饰键时返回 undefined，等待主键 */
export function shortcutFromEvent(event: TKeyLike): TShortcut | undefined {
    if (event.code === "" || kModifierCodes.has(event.code)) {
        return undefined;
    }
    return {
        code: event.code,
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
    };
}

export function matchesShortcut(event: TKeyLike, shortcut: TShortcut): boolean {
    return (
        event.code === shortcut.code &&
        event.altKey === shortcut.alt &&
        event.ctrlKey === shortcut.ctrl &&
        event.metaKey === shortcut.meta &&
        event.shiftKey === shortcut.shift
    );
}

/** 不带 ⌘/Ctrl/⌥ 的快捷键在输入框里应让位于打字 */
export function isPlainShortcut(shortcut: TShortcut): boolean {
    return !shortcut.alt && !shortcut.ctrl && !shortcut.meta;
}

/** 与面板已有按键冲突时返回原因，否则 undefined */
export function shortcutConflict(
    shortcut: TShortcut,
    mac: boolean,
): string | undefined {
    if (isPlainShortcut(shortcut) && kPanelNavigationCodes.has(shortcut.code)) {
        return "used to navigate the panel";
    }
    const command = mac ? shortcut.meta : shortcut.ctrl;
    const other = mac ? shortcut.ctrl : shortcut.meta;
    if (
        command &&
        !other &&
        !shortcut.alt &&
        !shortcut.shift &&
        kPanelCommandCodes.has(shortcut.code)
    ) {
        return "used by the panel or for editing";
    }
    return undefined;
}

function keyLabel(code: string): string {
    const known = kCodeLabels[code];
    if (known !== undefined) {
        return known;
    }
    const match = /^(?:Key|Digit|Numpad)(.+)$/.exec(code);
    if (match?.[1] !== undefined) {
        return match[1];
    }
    return code;
}

/** macOS：⌃⌥⇧⌘H；其他平台：Ctrl+Alt+Shift+Win+H */
export function formatShortcut(shortcut: TShortcut, mac: boolean): string {
    const key = keyLabel(shortcut.code);
    if (mac) {
        return [
            shortcut.ctrl ? "⌃" : "",
            shortcut.alt ? "⌥" : "",
            shortcut.shift ? "⇧" : "",
            shortcut.meta ? "⌘" : "",
            key,
        ].join("");
    }
    return [
        shortcut.ctrl ? "Ctrl" : "",
        shortcut.alt ? "Alt" : "",
        shortcut.shift ? "Shift" : "",
        shortcut.meta ? "Win" : "",
        key,
    ]
        .filter((part) => part !== "")
        .join("+");
}

const kTextInputTypes = new Set([
    "text",
    "search",
    "email",
    "url",
    "tel",
    "password",
    "number",
    "date",
    "datetime-local",
    "month",
    "week",
    "time",
]);

/** 键盘事件是否发生在可编辑区域（含 Shadow DOM 内部） */
export function isEditableTarget(event: Event): boolean {
    const target = event.composedPath()[0] ?? event.target;
    if (!(target instanceof Element)) {
        return false;
    }
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return true;
    }
    if (target instanceof HTMLInputElement) {
        return kTextInputTypes.has(target.type);
    }
    return target instanceof HTMLElement && target.isContentEditable;
}
