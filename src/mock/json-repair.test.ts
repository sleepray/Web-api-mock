import { describe, expect, it } from "vitest";

import { formatJson, jsonError, prettyJson, repairJson, type TJsonFixes } from "./json-repair";

/** Repairs `input` and returns the parsed value plus what was fixed. */
function repair(input: string): { value: unknown; fixes: TJsonFixes } | undefined {
    const result = repairJson(input);
    return result === undefined ? undefined : { value: JSON.parse(result.text), fixes: result.fixes };
}

describe("repairJson: quotes", () => {
    it("closes a value whose closing quote and comma were deleted", () => {
        const input =
            '{\n  "data": [\n    {\n      "id": "55",\n      "status": "DRAF\n      "assetScope": null,\n      "riskLevels": []\n    }\n  ]\n}';
        expect(repair(input)).toEqual({
            value: { data: [{ id: "55", status: "DRAF", assetScope: null, riskLevels: [] }] },
            fixes: { quote: 1, comma: 1 },
        });
    });

    it("keeps the trailing comma as a separator when only the closing quote is gone", () => {
        expect(repair('{\n  "a": "x,\n  "b": 1\n}')).toEqual({ value: { a: "x", b: 1 }, fixes: { quote: 1 } });
    });

    it("restores a missing opening quote", () => {
        expect(repair('{\n  "a": DRAFT",\n  "b": 1\n}')).toEqual({
            value: { a: "DRAFT", b: 1 },
            fixes: { quote: 1 },
        });
    });

    it("quotes a bare word", () => {
        expect(repair('{\n  "a": DRAFT,\n  "b": 1\n}')?.value).toEqual({ a: "DRAFT", b: 1 });
    });

    it("quotes bare keys", () => {
        expect(repair('{a: 1, b_c: "x"}')).toEqual({ value: { a: 1, b_c: "x" }, fixes: { quote: 2 } });
    });

    it("turns single quotes into double quotes", () => {
        expect(repair("{'a': 'x', 'b': 1}")?.value).toEqual({ a: "x", b: 1 });
    });

    it("turns curly quotes into straight ones but keeps curly quotes inside a string", () => {
        expect(repair('{“a”: “x”, "b": "他说“好”"}')?.value).toEqual({ a: "x", b: "他说“好”" });
    });

    it("stops an unterminated last value before the closing bracket", () => {
        expect(repair('{"a": "b}')?.value).toEqual({ a: "b" });
    });

    it("keeps bare values that contain colons and slashes whole", () => {
        expect(repair('{"url": http://a.b/c, "t": 12:30}')).toEqual({
            value: { url: "http://a.b/c", t: "12:30" },
            fixes: { quote: 2 },
        });
    });
});

describe("repairJson: commas", () => {
    it("adds a comma between members on separate lines", () => {
        expect(repair('{\n  "a": 1\n  "b": 2\n}')).toEqual({ value: { a: 1, b: 2 }, fixes: { comma: 1 } });
    });

    it("adds a comma between members on one line", () => {
        expect(repair('{"a": 1 "b": 2}')?.value).toEqual({ a: 1, b: 2 });
    });

    it("splits space-separated array items instead of merging them into one string", () => {
        expect(repair('[1 2, "a" "b"]')).toEqual({ value: [1, 2, "a", "b"], fixes: { comma: 2 } });
    });

    it("drops trailing commas", () => {
        expect(repair('{"a": [1, 2,], "b": 2,}')).toEqual({
            value: { a: [1, 2], b: 2 },
            fixes: { extra: 2 },
        });
    });

    it("drops doubled commas", () => {
        expect(repair('{"a": 1,, "b": 2}')?.value).toEqual({ a: 1, b: 2 });
    });
});

describe("repairJson: brackets and colons", () => {
    it("closes every bracket left open", () => {
        expect(repair('{"a": {"b": [1, 2')).toEqual({
            value: { a: { b: [1, 2] } },
            fixes: { bracket: 3 },
        });
    });

    it("recovers from a mismatched closing bracket", () => {
        expect(repair('{"a": [1, 2}')?.value).toEqual({ a: [1, 2] });
    });

    it("ignores one closing bracket too many", () => {
        expect(repair('{"a": 1}}')).toEqual({ value: { a: 1 }, fixes: { other: 1 } });
    });

    it("closes a lone opening bracket", () => {
        expect(repair("{")).toEqual({ value: {}, fixes: { bracket: 1 } });
    });

    it("adds missing colons", () => {
        expect(repair('{"a" 1, "b" "x"}')).toEqual({ value: { a: 1, b: "x" }, fixes: { colon: 2 } });
    });

    it("accepts = and => in place of a colon", () => {
        expect(repair('{"a" = 1, "b" => 2}')).toEqual({ value: { a: 1, b: 2 }, fixes: { colon: 2 } });
    });

    it("fills a missing value with null", () => {
        expect(repair('{"a": , "b": }')?.value).toEqual({ a: null, b: null });
    });
});

describe("repairJson: other leniencies", () => {
    it("strips comments", () => {
        expect(repair('{\n  // note\n  "a": 1, /* x */ "b": 2\n}')?.value).toEqual({ a: 1, b: 2 });
    });

    it("accepts Python-style and miscased literals", () => {
        expect(repair('{"a": True, "b": None, "c": FALSE}')?.value).toEqual({ a: true, b: null, c: false });
    });

    it("keeps valid escapes intact", () => {
        expect(repair('{"a": "x\\"y\\n\\u4e2d", "b": 1,}')?.value).toEqual({ a: 'x"y\n中', b: 1 });
    });

    it("leaves well-formed numbers alone", () => {
        expect(repair('{"a": -1.5e3, "b": 0, "c": [],}')?.value).toEqual({ a: -1500, b: 0, c: [] });
    });

    it("keeps a __proto__ key as an ordinary field", () => {
        const result = repairJson('{"__proto__": 1, "a": 2,}');
        expect(result?.text).toContain('"__proto__": 1');
    });
});

describe("repairJson: gives up rather than guess", () => {
    it("on text that does not start like JSON", () => {
        expect(repairJson("hello")).toBeUndefined();
    });

    it("on content after the first value", () => {
        expect(repairJson('{"a": 1} {"b": 2}')).toBeUndefined();
    });

    it("on absurd nesting, without overflowing the stack", () => {
        expect(repairJson("[".repeat(5000))).toBeUndefined();
    });

    it.each(['{"a": "b\n"c": [1 2 3\n', "{,,,}", "[,]", "{:}", '{"a"::1}', "[}]", "{]}"])(
        "always produces valid JSON for %j",
        (input) => {
            const result = repairJson(input);
            expect(result).toBeDefined();
            expect(() => JSON.parse(result?.text ?? "")).not.toThrow();
        },
    );
});

describe("repairJson: summary", () => {
    it("lists each kind of fix with singular and plural forms", () => {
        expect(repairJson('{a: 1, b: 2 "c": [1,],}')?.summary).toBe("2 quotes, 1 missing comma, 2 extra commas");
    });
});

describe("jsonError", () => {
    it("is empty for valid JSON and for text that is not JSON-like", () => {
        expect(jsonError('{"a": 1}')).toBe("");
        expect(jsonError("plain text")).toBe("");
        expect(jsonError("")).toBe("");
    });

    it("reports the parser message for broken JSON", () => {
        expect(jsonError('{"a": 1,}')).not.toBe("");
    });
});

describe("formatJson", () => {
    it("re-indents valid JSON", () => {
        expect(formatJson('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}' });
    });

    it("repairs broken JSON and says what it fixed", () => {
        expect(formatJson('{"a":1,}')).toEqual({ text: '{\n  "a": 1\n}', fixed: "1 extra comma" });
    });

    it("explains why it cannot format", () => {
        expect("error" in formatJson("plain text")).toBe(true);
        expect("error" in formatJson('{"a": 1} trailing words')).toBe(true);
    });
});

describe("prettyJson", () => {
    it("indents JSON and returns anything else unchanged", () => {
        expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
        expect(prettyJson("<html>")).toBe("<html>");
    });
});
