/** 列表方向键移动：与 macOS 表格一致，到头不绕回 */
export type TListMove = "previous" | "next" | "first" | "last";

/**
 * 计算移动后的选中 id。
 * 当前无选中（或选中项已不在列表中）时，向下从首项开始、向上从末项开始。
 */
export function moveSelection(
    ids: readonly string[],
    currentId: string | undefined,
    move: TListMove,
): string | undefined {
    if (ids.length === 0) {
        return undefined;
    }
    const lastIndex = ids.length - 1;
    if (move === "first") {
        return ids[0];
    }
    if (move === "last") {
        return ids[lastIndex];
    }
    const index = currentId === undefined ? -1 : ids.indexOf(currentId);
    if (index < 0) {
        return move === "next" ? ids[0] : ids[lastIndex];
    }
    const nextIndex =
        move === "next"
            ? Math.min(lastIndex, index + 1)
            : Math.max(0, index - 1);
    return ids[nextIndex];
}

/** 键盘事件是否为 ⌘（macOS）/ Ctrl（其他平台）+ 指定键，且无其他修饰键 */
export function isCommandKey(event: KeyboardEvent, key: string): boolean {
    const command = isMacPlatform() ? event.metaKey : event.ctrlKey;
    return (
        command &&
        !event.altKey &&
        !event.shiftKey &&
        (isMacPlatform() ? !event.ctrlKey : !event.metaKey) &&
        event.key.toLowerCase() === key
    );
}

export function isMacPlatform(): boolean {
    if (typeof navigator === "undefined") {
        return false;
    }
    const platform =
        (navigator as Navigator & { userAgentData?: { platform?: string } })
            .userAgentData?.platform ?? navigator.platform;
    return /mac|iphone|ipad/i.test(platform);
}

/** 菜单快捷键提示：macOS 用符号，其他平台用 Ctrl+ 文本 */
export function shortcutLabel(key: string): string {
    return isMacPlatform() ? `⌘${key.toUpperCase()}` : `Ctrl+${key.toUpperCase()}`;
}
