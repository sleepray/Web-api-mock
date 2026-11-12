/**
 * 响应体编辑框的输入辅助：自动补另一半引号 / 括号、回车自动缩进、Tab 缩进。
 *
 * 这里只做判断（按下这个键该对文本做什么），不碰 DOM：真正改文本由界面去做，这样判断部分能单测。
 */

export type TEditorState = {
    value: string;
    /** 选区起点和终点；相等表示只有光标 */
    start: number;
    end: number;
};

export type TEditAction =
    /**
     * 插入一段文字，替换当前选区；`select` 有值时先把选区改成它（用来连带删掉光标两侧的一对符号）。
     * `caretBack` 是插入后光标往回退几格（停在一对符号中间）。
     */
    | { kind: "insert"; text: string; caretBack?: number; select?: [number, number] }
    /** 不改文本，只把光标挪到这个位置（跳过已经有的收尾符号） */
    | { kind: "move"; to: number };

/**
 * 括号够不够：开的不比关的多，说明光标后面那个闭括号就是要找的，不用再打一个。
 * 字符串里的括号不算；没收尾的字符串到行尾为止。
 */
export function isBalanced(text: string, close: "}" | "]"): boolean {
    const open = close === "}" ? "{" : "[";
    let depth = 0;
    let inString = false;
    for (let j = 0; j < text.length; j++) {
        const c = text[j];
        if (inString) {
            if (c === "\\") {
                j++;
            } else if (c === '"' || c === "\n") {
                inString = false;
            }
        } else if (c === '"') {
            inString = true;
        } else if (c === open) {
            depth++;
        } else if (c === close) {
            depth--;
        }
    }
    return depth <= 0;
}

/**
 * 按下 `key` 时要不要接管。不返回内容表示不插手，让浏览器照常输入。
 * 调用方负责先排除输入法组字和带 Ctrl / ⌘ / Alt 的组合键。
 */
export function planEditorKey(
    { value, start, end }: TEditorState,
    { key, shiftKey }: { key: string; shiftKey: boolean },
): TEditAction | undefined {
    // 已经写了别的东西、又不是 JSON：不插手
    if (value.trim() !== "" && !/^\s*[[{]/.test(value)) {
        return;
    }
    const hasSelection = start !== end;
    const prev = value.charAt(start - 1);
    const next = value.charAt(end);
    // 这一行光标前面的部分
    const line = value.slice(value.lastIndexOf("\n", start - 1) + 1, start);
    const inString = (line.replace(/\\./g, "").match(/"/g) ?? []).length % 2 === 1;
    // 光标后面空着，才适合自动补另一半
    const roomy = next === "" || /[\s,\]}:]/.test(next);

    if (key === "Tab" && !shiftKey) {
        return { kind: "insert", text: "  " };
    }
    if (key === "Enter" && !shiftKey) {
        const indent = /^[ \t]*/.exec(line)?.[0] ?? "";
        const opened = /[[{][ \t]*$/.test(line);
        // 光标夹在一对括号中间：把闭括号顶到下一行
        const between = opened && !hasSelection && (next === "}" || next === "]");
        return {
            kind: "insert",
            text: `\n${indent}${opened ? "  " : ""}${between ? `\n${indent}` : ""}`,
            caretBack: between ? indent.length + 1 : undefined,
        };
    }
    if (key === "Backspace") {
        const pair = prev + next;
        // 删掉空的一对
        if (!hasSelection && (pair === '""' || pair === "{}" || pair === "[]")) {
            return { kind: "insert", text: "", select: [start - 1, start + 1] };
        }
        return;
    }
    if (key === '"') {
        if (prev === "\\") {
            return;
        }
        if (hasSelection) {
            return { kind: "insert", text: `"${value.slice(start, end)}"` };
        }
        if (inString) {
            // 已经有收尾的引号了就跳过去；没有的话这一下就是来补收尾引号的，照常输入
            return next === '"' ? { kind: "move", to: start + 1 } : undefined;
        }
        return roomy ? { kind: "insert", text: '""', caretBack: 1 } : undefined;
    }
    if (key === "{" || key === "[") {
        if (inString) {
            return;
        }
        const close = key === "{" ? "}" : "]";
        if (hasSelection) {
            return { kind: "insert", text: `${key}${value.slice(start, end)}${close}` };
        }
        return roomy ? { kind: "insert", text: `${key}${close}`, caretBack: 1 } : undefined;
    }
    if (
        (key === "}" || key === "]") &&
        !hasSelection &&
        next === key &&
        !inString &&
        isBalanced(value, key)
    ) {
        return { kind: "move", to: start + 1 };
    }
    return;
}
