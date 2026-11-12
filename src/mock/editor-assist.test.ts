import { describe, expect, it } from "vitest";

import { isBalanced, planEditorKey, type TEditAction, type TEditorState } from "./editor-assist";

/** Editor state written with `|` at the caret, or two `|` around a selection. */
function state(marked: string): TEditorState {
    const start = marked.indexOf("|");
    const rest = marked.slice(0, start) + marked.slice(start + 1);
    const second = rest.indexOf("|", start);
    return second < 0
        ? { value: rest, start, end: start }
        : { value: rest.slice(0, second) + rest.slice(second + 1), start, end: second };
}

/** Applies an action the way the editor would and returns the result with `|` at the caret. */
function applied(marked: string, action: TEditAction | undefined, typed: string): string {
    const { value, start, end } = state(marked);
    if (action === undefined) {
        // The browser's default: type the key over the selection
        return `${value.slice(0, start)}${typed}|${value.slice(end)}`;
    }
    if (action.kind === "move") {
        return `${value.slice(0, action.to)}|${value.slice(action.to)}`;
    }
    const [from, to] = action.select ?? [start, end];
    const caret = from + action.text.length - (action.caretBack ?? 0);
    const text = value.slice(0, from) + action.text + value.slice(to);
    return `${text.slice(0, caret)}|${text.slice(caret)}`;
}

function press(marked: string, key: string, shiftKey = false): string {
    const typed = key === "Enter" ? "\n" : key.length === 1 ? key : "";
    return applied(marked, planEditorKey(state(marked), { key, shiftKey }), typed);
}

describe("planEditorKey: pairing", () => {
    it("closes quotes and brackets when the caret has room after it", () => {
        expect(press("|", "{")).toBe("{|}");
        expect(press('{"a": |}', "[")).toBe('{"a": [|]}');
        expect(press("{|}", '"')).toBe('{"|"}');
    });

    it("types a single quote to close a string that was left open", () => {
        expect(press('{\n  "s": "DRAF|\n}', '"')).toBe('{\n  "s": "DRAF"|\n}');
    });

    it("steps over a closing quote that is already there", () => {
        expect(press('{"a|"}', '"')).toBe('{"a"|}');
    });

    it("leaves an escaped quote alone", () => {
        expect(press('{"a": "x\\|"}', '"')).toBe('{"a": "x\\"|"}');
    });

    it("does not pair brackets typed inside a string", () => {
        expect(press('{"a": "x|"}', "{")).toBe('{"a": "x{|"}');
    });

    it("does not pair when text follows the caret", () => {
        expect(press('{"a": |abc}', '"')).toBe('{"a": "|abc}');
    });

    it("wraps the selection", () => {
        expect(press('{"a": |abc|}', '"')).toBe('{"a": "abc"|}');
        expect(press('{"a": |1, 2|}', "[")).toBe('{"a": [1, 2]|}');
    });

    it("steps over a closing bracket only when the brackets already balance", () => {
        expect(press('{"a": {}|}', "}")).toBe('{"a": {}}|');
        expect(press('{"a": {|}', "}")).toBe('{"a": {}|}');
    });
});

describe("planEditorKey: Enter, Tab, Backspace", () => {
    it("opens a bracket pair onto three lines", () => {
        expect(press("{|}", "Enter")).toBe("{\n  |\n}");
    });

    it("keeps the current indentation", () => {
        expect(press('{\n    "a": 1,|', "Enter")).toBe('{\n    "a": 1,\n    |');
    });

    it("indents one level after an opening bracket", () => {
        expect(press('{\n  "a": [|', "Enter")).toBe('{\n  "a": [\n    |');
    });

    it("inserts two spaces for Tab and leaves Shift+Tab to the browser", () => {
        expect(press("{\n|}", "Tab")).toBe("{\n  |}");
        expect(planEditorKey(state("{\n|}"), { key: "Tab", shiftKey: true })).toBeUndefined();
    });

    it("deletes an empty pair together", () => {
        expect(press('{"a": "|"}', "Backspace")).toBe('{"a": |}');
        expect(press("{|}", "Backspace")).toBe("|");
        expect(planEditorKey(state('{"a|"}'), { key: "Backspace", shiftKey: false })).toBeUndefined();
    });
});

describe("planEditorKey: scope", () => {
    it("stays out of the way in a body that is not JSON", () => {
        expect(planEditorKey(state("hello |"), { key: '"', shiftKey: false })).toBeUndefined();
        expect(planEditorKey(state("hello |"), { key: "Tab", shiftKey: false })).toBeUndefined();
    });

    it("helps in an empty body, where JSON is about to be typed", () => {
        expect(press("|", "[")).toBe("[|]");
    });

    it("types a small document without leaving stray characters", () => {
        let text = "|";
        for (const key of ["{", "Enter", '"', "a", '"', ":", " ", "[", "1", ",", " ", "2", "]", ",", "Enter", '"', "b", '"', ":", " ", '"', "x", '"']) {
            text = press(text, key);
        }
        expect(text).toBe('{\n  "a": [1, 2],\n  "b": "x"|\n}');
        expect(() => JSON.parse(text.replace("|", ""))).not.toThrow();
    });
});

describe("isBalanced", () => {
    it("ignores brackets inside strings", () => {
        expect(isBalanced('{"a": "}"', "}")).toBe(false);
        expect(isBalanced('{"a": "{"}', "}")).toBe(true);
        expect(isBalanced("[[1]", "]")).toBe(false);
    });
});
