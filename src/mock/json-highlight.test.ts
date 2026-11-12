import { describe, expect, it } from "vitest";

import { highlightJson } from "./json-highlight";

function stripTags(html: string): string {
    return html
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
}

/** 取出某一类着色片段的文字 */
function tokens(html: string, kind: string): string[] {
    return [...html.matchAll(new RegExp(`<span class="nri-json-${kind}">([^<]*)</span>`, "g"))].map((m) =>
        stripTags(m[1] ?? ""),
    );
}

describe("highlightJson", () => {
    const sample = '{\n  "code": "0",\n  "total": -1.5e3,\n  "ok": true,\n  "next": null,\n  "items": [1, 2]\n}';

    it("tells keys from string values and colours numbers, booleans and null", () => {
        const html = highlightJson(sample);
        expect(tokens(html, "key")).toEqual(['"code"', '"total"', '"ok"', '"next"', '"items"']);
        expect(tokens(html, "string")).toEqual(['"0"']);
        expect(tokens(html, "number")).toEqual(["-1.5e3", "1", "2"]);
        expect(tokens(html, "boolean")).toEqual(["true"]);
        expect(tokens(html, "null")).toEqual(["null"]);
    });

    it("keeps the text exactly, so the coloured layer lines up with the editor", () => {
        for (const text of [
            sample,
            '{"a": "x <b> & \\"q\\"", "b" : 1}',
            '{"unterminated: [1, 2,\n  "k": tru',
            "plain text, not JSON at all",
            "",
        ]) {
            expect(stripTags(highlightJson(text))).toBe(text);
        }
    });

    it("escapes markup inside strings", () => {
        expect(highlightJson('"<img>"')).toBe('<span class="nri-json-string">"&lt;img&gt;"</span>');
    });

    it("does not colour digits inside words", () => {
        expect(tokens(highlightJson("abc123 v1.2"), "number")).toEqual([]);
    });
});
